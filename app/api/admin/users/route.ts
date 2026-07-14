import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentAdmin();
    if (!user) {
      return NextResponse.json({ error: "请先登录管理员后台" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nickname: true,
        isAdmin: true,
        isDisabled: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: { characters: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 });
  }
}