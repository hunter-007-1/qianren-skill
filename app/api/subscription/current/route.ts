import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getPlanLimits } from "@/lib/subscription";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        plan: true,
        planExpiresAt: true,
        trialEndsAt: true,
      },
    });

    if (!fullUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { userId: user.id, status: "active" },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    const limits = getPlanLimits(fullUser.plan);

    return NextResponse.json({
      plan: fullUser.plan,
      planExpiresAt: fullUser.planExpiresAt,
      trialEndsAt: fullUser.trialEndsAt,
      subscription,
      limits,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取订阅信息失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
