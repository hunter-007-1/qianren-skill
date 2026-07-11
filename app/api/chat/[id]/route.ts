import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateReply } from "@/lib/services/chat-service";
import { getCurrentUser } from "@/lib/auth";
import { checkUsageLimit, recordUsage } from "@/lib/subscription";

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
    
    // 获取当前用户并检查对话次数限制
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const usageLimit = await checkUsageLimit(user.id, "chat");
    if (!usageLimit.allowed) {
      return NextResponse.json(
        {
          error: `今日对话次数已达上限（${usageLimit.limit}次），请明天再试`,
          remaining: 0,
          limit: usageLimit.limit,
          plan: usageLimit.plan,
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as { content?: string };
    const content = body.content?.trim();

    if (!content) {
      return NextResponse.json({ error: "消息不能为空" }, { status: 400 });
    }

    const data = await generateReply(id, content);
    
    // 记录使用量
    await recordUsage(user.id, "chat");
    
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
