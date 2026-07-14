import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentAdmin();
    if (!user) {
      return NextResponse.json({ error: "请先登录管理员后台" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isDisabled } = body;

    // 不能禁用自己
    if (id === user.id) {
      return NextResponse.json({ error: "不能禁用自己的账号" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isDisabled },
      select: {
        id: true,
        email: true,
        nickname: true,
        isAdmin: true,
        isDisabled: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Update user status error:", error);
    return NextResponse.json({ error: "更新用户状态失败" }, { status: 500 });
  }
}
