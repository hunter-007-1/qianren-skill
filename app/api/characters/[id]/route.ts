import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, checkIsAdmin } from "@/lib/auth";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const user = await getCurrentUser();

  const character = await prisma.character.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      nickname: true,
      relationship: true,
      background: true,
      timeframe: true,
      impression: true,
      avatarUrl: true,
      userAvatarUrl: true,
      analysisStatus: true,
      errorMessage: true,
      createdAt: true,
      updatedAt: true,
      sourceDocuments: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          filename: true,
          fileType: true,
          content: true,
        },
      },
      analysis: {
        select: {
          id: true,
          modelName: true,
          persona: true,
          memories: true,
          speakingStyle: true,
          emotionPattern: true,
          relationshipPattern: true,
        },
      },
    },
  });

  if (!character) {
    return NextResponse.json({ error: "角色不存在" }, { status: 404 });
  }

  if (user && character.userId && character.userId !== user.id) {
    const isAdmin = await checkIsAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 });
    }
  }

  return NextResponse.json(character);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const existing = await prisma.character.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "角色不存在" }, { status: 404 });
    }
    if (existing.userId && existing.userId !== user.id) {
      const isAdmin = await checkIsAdmin(user.id);
      if (!isAdmin) {
        return NextResponse.json({ error: "无权限修改" }, { status: 403 });
      }
    }

    const body = await request.json();

    const character = await prisma.character.update({
      where: { id },
      data: {
        nickname: body.nickname,
        relationship: body.relationship,
        background: body.background,
        timeframe: body.timeframe,
        impression: body.impression,
        avatarUrl: body.avatarUrl,
        userAvatarUrl: body.userAvatarUrl,
      },
    });

    return NextResponse.json(character);
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const existing = await prisma.character.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "角色不存在" }, { status: 404 });
    }
    if (existing.userId && existing.userId !== user.id) {
      const isAdmin = await checkIsAdmin(user.id);
      if (!isAdmin) {
        return NextResponse.json({ error: "无权限删除" }, { status: 403 });
      }
    }

    await prisma.character.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
