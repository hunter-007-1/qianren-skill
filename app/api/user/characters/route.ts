import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const characters = await prisma.character.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        relationship: true,
        analysisStatus: true,
        createdAt: true,
        _count: {
          select: { chatMessages: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(characters);
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取角色列表失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
