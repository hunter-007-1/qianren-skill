import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateCharacterMemory } from "@/lib/services/memory-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const result = await updateCharacterMemory(id);
    return NextResponse.json({
      success: true,
      newMemories: result.memories,
      analysis: result.analysis,
      memoryCount: result.memoryCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "记忆更新失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
