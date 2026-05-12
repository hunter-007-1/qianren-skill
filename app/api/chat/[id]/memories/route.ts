import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const memories = await prisma.characterMemory.findMany({
      where: { characterId: id },
      orderBy: { importance: "desc" },
    });

    const character = await prisma.character.findUnique({
      where: { id },
      select: { nickname: true },
    });

    return NextResponse.json({
      memories,
      nickname: character?.nickname,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取记忆失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
