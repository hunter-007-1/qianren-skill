import { NextResponse } from "next/server";
import { getCurrentUser, checkIsAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const isAdmin = await checkIsAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const characters = await prisma.character.findMany({
      select: {
        id: true,
        nickname: true,
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