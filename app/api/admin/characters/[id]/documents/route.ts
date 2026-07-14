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

    const documents = await prisma.sourceDocument.findMany({
      where: { characterId: id },
      select: {
        id: true,
        filename: true,
        fileType: true,
        content: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Get source documents error:", error);
    return NextResponse.json({ error: "获取源文档失败" }, { status: 500 });
  }
}
