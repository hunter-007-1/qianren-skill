import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentAdmin();
    if (!user) {
      return NextResponse.json({ error: "请先登录管理员后台" }, { status: 401 });
    }

    const { id } = await params;

    // 不能删除自己
    if (id === user.id) {
      return NextResponse.json({ error: "不能删除自己的账号" }, { status: 400 });
    }

    // 删除用户的所有数据（级联删除会处理关联数据）
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "删除用户失败" }, { status: 500 });
  }
}
