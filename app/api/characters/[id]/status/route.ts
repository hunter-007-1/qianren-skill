import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const character = await prisma.character.findUnique({
      where: { id },
      select: {
        id: true,
        analysisStatus: true,
        errorMessage: true,
      },
    });

    if (!character) {
      return NextResponse.json({ error: "角色不存在" }, { status: 404 });
    }

    return NextResponse.json(character);
  } catch (error) {
    const message = error instanceof Error ? error.message : "查询失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
