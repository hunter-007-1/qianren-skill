import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentAdmin();
    if (!user) {
      return NextResponse.json({ error: "请先登录管理员后台" }, { status: 401 });
    }

    const characters = await prisma.character.findMany({
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        userAvatarUrl: true,
        analysisStatus: true,
        createdAt: true,
        userId: true,
        user: {
          select: {
            email: true,
            nickname: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(characters);
  } catch (error) {
    console.error("Get all characters error:", error);
    return NextResponse.json({ error: "获取角色列表失败" }, { status: 500 });
  }
}