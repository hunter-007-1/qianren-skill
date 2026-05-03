import { NextResponse } from "next/server";
import { regenerateReply } from "@/lib/services/chat-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const message = await regenerateReply(id);
    return NextResponse.json(message);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "重新生成失败";
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
