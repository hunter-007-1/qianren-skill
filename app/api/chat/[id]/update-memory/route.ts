import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateCharacterMemory } from "@/lib/services/memory-service";
import { checkUsageLimit, recordUsage } from "@/lib/subscription";

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

    // 检查记忆更新次数限制
    const usageLimit = await checkUsageLimit(user.id, "memory");
    if (!usageLimit.allowed) {
      return NextResponse.json(
        {
          error: `今日记忆更新次数已达上限（${usageLimit.limit}次），请明天再试`,
          remaining: 0,
          limit: usageLimit.limit,
          plan: usageLimit.plan,
        },
        { status: 403 }
      );
    }

    const result = await updateCharacterMemory(id);
    
    // 记录使用量
    await recordUsage(user.id, "memory");
    
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
