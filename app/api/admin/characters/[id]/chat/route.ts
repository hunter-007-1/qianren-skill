import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentAdmin();
    if (!user) {
      return NextResponse.json({ error: "请先登录管理员后台" }, { status: 401 });
    }

    const { id } = await params;

    const messages = await prisma.chatMessage.findMany({
      where: { characterId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Get chat messages error:", error);
    return NextResponse.json({ error: "获取聊天记录失败" }, { status: 500 });
  }
}
