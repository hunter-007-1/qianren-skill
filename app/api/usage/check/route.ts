import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { checkUsageLimit, checkCharacterLimit } from "@/lib/subscription";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") as "chat" | "analysis" | "memory" | "export";

    if (!action || !["chat", "analysis", "memory", "export"].includes(action)) {
      return NextResponse.json({ error: "无效的操作类型" }, { status: 400 });
    }

    const usageLimit = await checkUsageLimit(user.id, action);
    const characterLimit = await checkCharacterLimit(user.id);

    return NextResponse.json({
      action,
      usage: usageLimit,
      characters: characterLimit,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "检查使用额度失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
