import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runAnalysis } from "@/lib/services/analysis-service";
import { getCurrentUser } from "@/lib/auth";
import { checkUsageLimit, recordUsage } from "@/lib/subscription";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    
    // 获取当前用户并检查分析次数限制
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const usageLimit = await checkUsageLimit(user.id, "analysis");
    if (!usageLimit.allowed) {
      return NextResponse.json(
        {
          error: `今日分析次数已达上限（${usageLimit.limit}次），请升级到专业版`,
          remaining: 0,
          limit: usageLimit.limit,
          plan: usageLimit.plan,
        },
        { status: 403 }
      );
    }

    const analysis = await runAnalysis(id);
    
    // 记录使用量
    await recordUsage(user.id, "analysis");
    
    return NextResponse.json(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : "分析失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const record = await prisma.analysis.findUnique({
    where: { characterId: id },
  });

  if (!record) {
    return NextResponse.json({ error: "分析结果不存在" }, { status: 404 });
  }

  return NextResponse.json(record);
}
