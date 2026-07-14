import { NextResponse } from "next/server";
import {
  getCurrentAdmin,
  createSession,
  setSessionCookie,
  getSessionCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getCurrentAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: "请先登录管理员后台" }, { status: 401 });
    }

    const { id } = await params;

    if (id === adminUser.id) {
      return NextResponse.json({ error: "不能模拟自己的账号" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nickname: true,
        isAdmin: true,
        isDisabled: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    if (targetUser.isDisabled) {
      return NextResponse.json({ error: "该用户已被禁用" }, { status: 400 });
    }

    // 保存前台用户 Cookie，恢复时用；管理员 Cookie 不动
    const previousUserToken = (await getSessionCookie()) || null;

    const newToken = await createSession(targetUser.id);
    await setSessionCookie(newToken);

    return NextResponse.json({
      user: targetUser,
      previousUserToken,
    });
  } catch (error) {
    console.error("Impersonate user error:", error);
    return NextResponse.json({ error: "模拟登录失败" }, { status: 500 });
  }
}
