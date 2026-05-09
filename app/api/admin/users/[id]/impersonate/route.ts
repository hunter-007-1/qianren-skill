import { NextResponse } from "next/server";
import { getCurrentUser, checkIsAdmin, createSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getCurrentUser();
    if (!adminUser) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const isAdmin = await checkIsAdmin(adminUser.id);
    if (!isAdmin) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id } = await params;

    // 不能模拟自己
    if (id === adminUser.id) {
      return NextResponse.json({ error: "不能模拟自己的账号" }, { status: 400 });
    }

    // 获取目标用户
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

    // 创建新的 session
    const token = await createSession(targetUser.id);

    return NextResponse.json({
      token,
      user: targetUser,
      adminToken: request.headers.get("Cookie")?.match(/qianren-session=([^;]+)/)?.[1],
    });
  } catch (error) {
    console.error("Impersonate user error:", error);
    return NextResponse.json({ error: "模拟登录失败" }, { status: 500 });
  }
}
