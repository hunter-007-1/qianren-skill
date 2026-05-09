import { NextResponse } from "next/server";
import { setSessionCookie, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminToken } = body;

    if (!adminToken) {
      return NextResponse.json({ error: "缺少管理员令牌" }, { status: 400 });
    }

    // 验证 admin token 是否有效
    const payload = verifyToken(adminToken);
    if (!payload) {
      return NextResponse.json({ error: "管理员令牌无效或已过期" }, { status: 400 });
    }

    // 检查 session 是否存在且未过期
    const session = await prisma.session.findUnique({
      where: { token: adminToken },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: "管理员会话已过期，请重新登录" }, { status: 400 });
    }

    // 服务端设置 admin cookie
    await setSessionCookie(adminToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Stop impersonate error:", error);
    return NextResponse.json({ error: "停止模拟登录失败" }, { status: 500 });
  }
}
