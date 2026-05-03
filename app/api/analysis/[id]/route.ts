import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runAnalysis } from "@/lib/services/analysis-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const analysis = await runAnalysis(id);
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
