import { NextResponse } from "next/server";
import { getModelName, getOpenAIClient } from "@/lib/ai-client";
import { prisma } from "@/lib/db";
import { buildSummaryPrompt } from "@/lib/prompts";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const character = await prisma.character.findUnique({
      where: { id },
      select: { id: true, nickname: true },
    });

    if (!character) {
      return NextResponse.json({ error: "角色不存在" }, { status: 404 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { characterId: id },
      orderBy: { createdAt: "asc" },
    });

    if (messages.length === 0) {
      return NextResponse.json({ error: "暂无对话记录" }, { status: 400 });
    }

    const formatted = messages
      .map((m) => {
        const sender = m.role === "user" ? "用户" : character.nickname;
        return `${sender}：${m.content}`;
      })
      .join("\n");

    const client = getOpenAIClient();
    const model = getModelName();

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: buildSummaryPrompt(character.nickname, formatted),
        },
      ],
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json({ error: "生成摘要失败" }, { status: 500 });
    }

    let summary;
    try {
      summary = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: "摘要格式解析失败" },
        { status: 500 },
      );
    }

    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成摘要失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
