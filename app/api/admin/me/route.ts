import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(admin);
  } catch (error) {
    console.error("Get admin me error:", error);
    return NextResponse.json({ error: "获取管理员信息失败" }, { status: 500 });
  }
}
