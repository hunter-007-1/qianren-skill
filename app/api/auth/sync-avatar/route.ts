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
    const { userAvatarUrl } = body;

    if (userAvatarUrl !== null && typeof userAvatarUrl !== "string") {
      return NextResponse.json({ error: "无效的头像数据" }, { status: 400 });
    }

    await prisma.character.updateMany({
      where: { userId: user.id },
      data: { userAvatarUrl },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sync avatar error:", error);
    return NextResponse.json(
      { error: "同步头像失败" },
      { status: 500 }
    );
  }
}
