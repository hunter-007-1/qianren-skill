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
    const { subscriptionId, paymentMethod } = body;

    if (!subscriptionId || !paymentMethod) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    if (!["alipay", "wechat"].includes(paymentMethod)) {
      return NextResponse.json({ error: "不支持的支付方式" }, { status: 400 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId: user.id },
      include: { plan: true },
    });

    if (!subscription) {
      return NextResponse.json({ error: "订阅不存在" }, { status: 404 });
    }

    const amount =
      subscription.plan.yearlyPrice && subscription.plan.yearlyPrice > 0
        ? subscription.plan.yearlyPrice
        : subscription.plan.price;

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        subscriptionId: subscription.id,
        amount,
        paymentMethod,
        status: "pending",
        transactionId: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      },
    });

    setTimeout(async () => {
      try {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "success" },
        });

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "active" },
        });

        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: "pro",
            planExpiresAt: subscription.endDate,
          },
        });
      } catch (err) {
        console.error("模拟支付处理失败:", err);
      }
    }, 2000);

    return NextResponse.json({
      paymentId: payment.id,
      transactionId: payment.transactionId,
      amount: payment.amount,
      status: "pending",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建支付失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
