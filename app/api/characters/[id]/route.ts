import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const character = await prisma.character.findUnique({
    where: { id },
    include: {
      sourceDocuments: { orderBy: { createdAt: "asc" } },
      analysis: true,
      chatMessages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!character) {
    return NextResponse.json({ error: "角色不存在" }, { status: 404 });
  }

  return NextResponse.json(character);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
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

    // Prisma schema 中已配置 onDelete: Cascade，所以直接删除 Character 即可
    await prisma.character.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
