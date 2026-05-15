import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const { planId, period = "monthly" } = body;

    if (!planId) {
      return NextResponse.json({ error: "请选择套餐" }, { status: 400 });
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: "套餐不存在" }, { status: 404 });
    }

    const existingSubscription = await prisma.subscription.findFirst({
      where: { userId: user.id, status: "active" },
    });

    if (existingSubscription) {
      return NextResponse.json({ error: "您已有活跃订阅" }, { status: 400 });
    }

    const endDate = new Date();
    if (period === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        status: "pending",
        endDate,
      },
    });

    const amount = period === "yearly" && plan.yearlyPrice ? plan.yearlyPrice : plan.price;

    return NextResponse.json({
      subscriptionId: subscription.id,
      amount,
      planName: plan.displayName,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建订阅失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
