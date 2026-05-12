import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { avatarUrl } = body;

    if (avatarUrl !== null && typeof avatarUrl !== "string") {
      return NextResponse.json({ error: "无效的头像数据" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl },
    });

    return NextResponse.json({ avatarUrl });
  } catch (error) {
    console.error("Update avatar error:", error);
    return NextResponse.json(
      { error: "更新头像失败" },
      { status: 500 }
    );
  }
}
