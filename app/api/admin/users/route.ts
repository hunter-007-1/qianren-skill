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