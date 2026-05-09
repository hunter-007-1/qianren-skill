import { NextResponse } from "next/server";
import { getCurrentUser, checkIsAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const isAdmin = await checkIsAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isAdmin: newIsAdmin } = body;

    // 不能修改自己的管理员状态
    if (id === user.id) {
      return NextResponse.json({ error: "不能修改自己的管理员状态" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isAdmin: newIsAdmin },
      select: {
        id: true,
        email: true,
        nickname: true,
        isAdmin: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Update user role error:", error);
    return NextResponse.json({ error: "更新用户权限失败" }, { status: 500 });
  }
}
