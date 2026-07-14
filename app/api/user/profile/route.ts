import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const MAX_AVATAR_LENGTH = 2.5 * 1024 * 1024; // ~2.5MB base64

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        nickname: true,
        avatarUrl: true,
        isAdmin: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: { characters: true },
        },
      },
    });

    if (!fullUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    return NextResponse.json(fullUser);
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取用户信息失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const { nickname, avatarUrl } = body as {
      nickname?: string;
      avatarUrl?: string | null;
    };

    if (nickname !== undefined) {
      const trimmed = typeof nickname === "string" ? nickname.trim() : "";
      if (!trimmed) {
        return NextResponse.json({ error: "昵称不能为空" }, { status: 400 });
      }
      if (trimmed.length > 32) {
        return NextResponse.json({ error: "昵称不能超过32个字符" }, { status: 400 });
      }
    }

    if (avatarUrl !== undefined && avatarUrl !== null) {
      if (typeof avatarUrl !== "string") {
        return NextResponse.json({ error: "无效的头像数据" }, { status: 400 });
      }
      if (avatarUrl.length > MAX_AVATAR_LENGTH) {
        return NextResponse.json({ error: "头像过大" }, { status: 400 });
      }
      if (
        avatarUrl.length > 0 &&
        !avatarUrl.startsWith("data:image/") &&
        !avatarUrl.startsWith("http://") &&
        !avatarUrl.startsWith("https://")
      ) {
        return NextResponse.json({ error: "头像格式不支持" }, { status: 400 });
      }
    }

    const trimmedNickname =
      nickname !== undefined ? String(nickname).trim() : undefined;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(trimmedNickname !== undefined && { nickname: trimmedNickname }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        avatarUrl: true,
        isAdmin: true,
      },
    });

    // 同步到各角色聊天中的用户头像
    if (avatarUrl !== undefined) {
      await prisma.character.updateMany({
        where: { userId: user.id },
        data: { userAvatarUrl: avatarUrl },
      });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
