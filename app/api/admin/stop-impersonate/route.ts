import { NextResponse } from "next/server";
import {
  setSessionCookie,
  clearSessionCookie,
  verifyToken,
  getCurrentAdmin,
} from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "管理员会话已失效，请重新登录后台" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { previousUserToken, adminToken } = body as {
      previousUserToken?: string | null;
      /** @deprecated 兼容旧前端字段 */
      adminToken?: string | null;
    };

    const restoreToken = previousUserToken ?? adminToken ?? null;

    if (restoreToken) {
      const payload = verifyToken(restoreToken);
      if (payload) {
        const session = await prisma.session.findUnique({
          where: { token: restoreToken },
        });
        if (session && session.expiresAt >= new Date()) {
          await setSessionCookie(restoreToken);
          return NextResponse.json({ success: true });
        }
      }
    }

    // 无有效前台会话可恢复时，清除前台 Cookie；管理员 Cookie 保持不变
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Stop impersonate error:", error);
    return NextResponse.json({ error: "停止模拟登录失败" }, { status: 500 });
  }
}
