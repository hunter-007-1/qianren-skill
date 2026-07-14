import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentAdmin();
    if (!user) {
      return NextResponse.json({ error: "请先登录管理员后台" }, { status: 401 });
    }

    // 获取总览数据
    const [
      totalUsers,
      totalCharacters,
      totalAnalyses,
      successfulAnalyses,
      activeUsersToday,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.character.count(),
      prisma.analysis.count(),
      prisma.analysis.count({
        where: { character: { analysisStatus: "DONE" } },
      }),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    // 获取最近30天的用户增长数据
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const userGrowth = await prisma.user.groupBy({
      by: ["createdAt"],
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // 获取最近30天的角色增长数据
    const characterGrowth = await prisma.character.groupBy({
      by: ["createdAt"],
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // 获取分析状态分布
    const analysisStats = await prisma.character.groupBy({
      by: ["analysisStatus"],
      _count: {
        id: true,
      },
    });

    // 格式化用户增长数据（按日期分组）
    const userGrowthByDate = formatGrowthData(userGrowth);
    const characterGrowthByDate = formatGrowthData(characterGrowth);

    // 格式化分析状态数据
    const analysisStatsFormatted: Record<string, number> = {
      notStarted: 0,
      running: 0,
      done: 0,
      failed: 0,
    };
    analysisStats.forEach((stat) => {
      const key = stat.analysisStatus.toLowerCase().replace("_", "");
      if (key in analysisStatsFormatted) {
        analysisStatsFormatted[key] = stat._count.id;
      }
    });

    return NextResponse.json({
      overview: {
        totalUsers,
        totalCharacters,
        totalAnalyses,
        analysisSuccessRate: totalAnalyses > 0 
          ? Math.round((successfulAnalyses / totalAnalyses) * 100) 
          : 0,
        activeUsersToday,
      },
      userGrowth: userGrowthByDate,
      characterGrowth: characterGrowthByDate,
      analysisStats: analysisStatsFormatted,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json({ error: "获取统计数据失败" }, { status: 500 });
  }
}

function formatGrowthData(data: Array<{ createdAt: Date; _count: { id: number } }>) {
  const grouped: Record<string, number> = {};
  
  data.forEach((item) => {
    const date = new Date(item.createdAt).toISOString().split("T")[0];
    grouped[date] = (grouped[date] || 0) + item._count.id;
  });

  // 填充最近30天的数据
  const result = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    result.push({
      date: dateStr,
      count: grouped[dateStr] || 0,
    });
  }

  return result;
}
