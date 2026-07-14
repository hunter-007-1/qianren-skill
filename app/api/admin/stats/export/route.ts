import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    const user = await getCurrentAdmin();
    if (!user) {
      return NextResponse.json({ error: "请先登录管理员后台" }, { status: 401 });
    }

    // 获取用户数据
    const users = await prisma.user.findMany({
      select: {
        email: true,
        nickname: true,
        isAdmin: true,
        isDisabled: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: { characters: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 获取角色数据
    const characters = await prisma.character.findMany({
      select: {
        nickname: true,
        analysisStatus: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            nickname: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 创建工作簿
    const wb = XLSX.utils.book_new();

    // 用户数据表
    const userSheet = XLSX.utils.json_to_sheet(
      users.map((u) => ({
        "邮箱": u.email,
        "昵称": u.nickname || "-",
        "管理员": u.isAdmin ? "是" : "否",
        "禁用": u.isDisabled ? "是" : "否",
        "角色数量": u._count.characters,
        "注册时间": new Date(u.createdAt).toLocaleString("zh-CN"),
        "最后登录": u.lastLoginAt 
          ? new Date(u.lastLoginAt).toLocaleString("zh-CN") 
          : "从未登录",
      }))
    );
    XLSX.utils.book_append_sheet(wb, userSheet, "用户列表");

    // 角色数据表
    const characterSheet = XLSX.utils.json_to_sheet(
      characters.map((c) => ({
        "角色名称": c.nickname,
        "分析状态": c.analysisStatus,
        "所有者": c.user?.nickname || c.user?.email || "未知",
        "创建时间": new Date(c.createdAt).toLocaleString("zh-CN"),
      }))
    );
    XLSX.utils.book_append_sheet(wb, characterSheet, "角色列表");

    // 生成 Excel 文件
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // 返回文件
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="qianren-stats-${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Export stats error:", error);
    return NextResponse.json({ error: "导出数据失败" }, { status: 500 });
  }
}
