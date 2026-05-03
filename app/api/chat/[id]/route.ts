import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateReply } from "@/lib/services/chat-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const messages = await prisma.chatMessage.findMany({
    where: { characterId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { content?: string };
    const content = body.content?.trim();

    if (!content) {
      return NextResponse.json({ error: "消息不能为空" }, { status: 400 });
    }

    const data = await generateReply(id, content);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "发送失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  await prisma.chatMessage.deleteMany({ where: { characterId: id } });

  return NextResponse.json({ ok: true });
}
