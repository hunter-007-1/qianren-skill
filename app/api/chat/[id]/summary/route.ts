import { NextResponse } from "next/server";
import { getModelName, getOpenAIClient } from "@/lib/ai-client";
import { prisma } from "@/lib/db";
import { buildSummaryPrompt } from "@/lib/prompts";
import { getCurrentUser } from "@/lib/auth";
import { checkUsageLimit, recordUsage } from "@/lib/subscription";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    // 获取当前用户并检查分析次数限制（摘要也消耗分析额度）
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const usageLimit = await checkUsageLimit(user.id, "analysis");
    if (!usageLimit.allowed) {
      return NextResponse.json(
        {
          error: `今日分析次数已达上限（${usageLimit.limit}次），请明天再试`,
          remaining: 0,
          limit: usageLimit.limit,
          plan: usageLimit.plan,
        },
        { status: 403 }
      );
    }

    const character = await prisma.character.findUnique({
      where: { id },
      select: { id: true, nickname: true },
    });

    if (!character) {
      return NextResponse.json({ error: "角色不存在" }, { status: 404 });
    }

    // 限制消息数量，避免 prompt 过长
    const messages = await prisma.chatMessage.findMany({
      where: { characterId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    if (messages.length === 0) {
      return NextResponse.json({ error: "暂无对话记录" }, { status: 400 });
    }

    // 按时间正序排列
    const sortedMessages = messages.reverse();

    const formatted = sortedMessages
      .map((m) => {
        const sender = m.role === "user" ? "用户" : character.nickname;
        return `${sender}：${m.content}`;
      })
      .join("\n");

    // 检查内容长度，如果太长则截断
    const maxContentLength = 8000;
    const truncatedContent = formatted.length > maxContentLength
      ? formatted.slice(0, maxContentLength) + "\n\n(对话内容过长，已截取最近部分...)"
      : formatted;

    const client = getOpenAIClient();
    const model = getModelName();

    console.log(`[Summary] 生成摘要: ${character.nickname}, 消息数: ${sortedMessages.length}, 内容长度: ${truncatedContent.length}`);

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "你是一个对话摘要助手，负责从对话中提取关键信息、要点和情感基调。请严格按照要求的 JSON 格式输出。",
        },
        {
          role: "user",
          content: buildSummaryPrompt(character.nickname, truncatedContent),
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
      console.error("[Summary] JSON 解析失败:", content);
      // 尝试提取 JSON 部分
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          summary = JSON.parse(jsonMatch[0]);
        } catch {
          return NextResponse.json(
            { error: "摘要格式解析失败，请重试" },
            { status: 500 },
          );
        }
      } else {
        return NextResponse.json(
          { error: "摘要格式解析失败，请重试" },
          { status: 500 },
        );
      }
    }

    // 记录使用量
    await recordUsage(user.id, "analysis");

    return NextResponse.json(summary);
  } catch (error) {
    console.error("[Summary] 错误:", error);
    const message = error instanceof Error ? error.message : "生成摘要失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
