import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isPaymentEnabled } from "@/lib/payment-enabled";
import { getPaymentMode } from "@/lib/payment/config";
import { createWechatNativeOrder } from "@/lib/payment/wechat";

export async function POST(request: Request) {
  if (!isPaymentEnabled()) {
    return NextResponse.json({ error: "支付功能暂未开放" }, { status: 403 });
  }

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

    if (paymentMethod === "alipay") {
      return NextResponse.json(
        { error: "支付宝支付暂未开通，请使用微信支付" },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId: user.id },
      include: { plan: true },
    });

    if (!subscription) {
      return NextResponse.json({ error: "订阅不存在" }, { status: 404 });
    }

    if (subscription.status === "active") {
      return NextResponse.json({ error: "该订阅已支付" }, { status: 400 });
    }

    const amount =
      subscription.billingPeriod === "yearly" && subscription.plan.yearlyPrice
        ? subscription.plan.yearlyPrice
        : subscription.plan.price;

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        subscriptionId: subscription.id,
        amount,
        paymentMethod,
        status: "pending",
      },
    });

    const paymentMode = getPaymentMode();

    if (paymentMode === "wechat") {
      const order = await createWechatNativeOrder({
        paymentId: payment.id,
        description: `千人智聊 ${subscription.plan.displayName} 订阅`,
        amount,
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: { transactionId: order.outTradeNo },
      });

      return NextResponse.json({
        paymentId: payment.id,
        transactionId: order.outTradeNo,
        amount: payment.amount,
        status: "pending",
        codeUrl: order.codeUrl,
        paymentMode: "wechat",
      });
    }

    const mockTradeNo = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await prisma.payment.update({
      where: { id: payment.id },
      data: { transactionId: mockTradeNo },
    });

    return NextResponse.json({
      paymentId: payment.id,
      transactionId: mockTradeNo,
      amount: payment.amount,
      status: "pending",
      paymentMode: "mock",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建支付失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
