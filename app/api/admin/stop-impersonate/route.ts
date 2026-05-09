import { NextResponse } from "next/server";

export async function POST() {
  try {
    // 清除当前 session cookie
    const response = NextResponse.json({ success: true });
    response.cookies.delete("qianren-session");
    
    return response;
  } catch (error) {
    console.error("Stop impersonate error:", error);
    return NextResponse.json({ error: "停止模拟登录失败" }, { status: 500 });
  }
}
