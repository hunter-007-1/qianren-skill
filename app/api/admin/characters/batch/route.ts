import { NextResponse } from "next/server";
import { getCurrentUser, checkIsAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const isAdmin = await checkIsAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = await request.json();
    const { ids, action } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "请选择要操作的角色" }, { status: 400 });
    }

    let result;

    switch (action) {
      case "delete":
        result = await prisma.character.deleteMany({
          where: {
            id: { in: ids },
          },
        });
        return NextResponse.json({
          success: true,
          message: `已删除 ${result.count} 个角色`,
        });

      case "reanalyze":
        // 重置分析状态
        result = await prisma.character.updateMany({
          where: {
            id: { in: ids },
          },
          data: {
            analysisStatus: "NOT_STARTED",
            errorMessage: null,
          },
        });
        // 删除现有分析记录
        await prisma.analysis.deleteMany({
          where: {
            characterId: { in: ids },
          },
        });
        return NextResponse.json({
          success: true,
          message: `已重置 ${result.count} 个角色的分析状态`,
        });

      default:
        return NextResponse.json({ error: "不支持的操作" }, { status: 400 });
    }
  } catch (error) {
    console.error("Batch operation error:", error);
    return NextResponse.json({ error: "批量操作失败" }, { status: 500 });
  }
}
