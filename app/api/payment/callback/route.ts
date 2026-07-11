import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { completePayment } from "@/lib/payment/complete-payment";
import { getPaymentMode } from "@/lib/payment/config";
import { queryWechatOrder } from "@/lib/payment/wechat";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("id");

    if (!paymentId) {
      return NextResponse.json({ error: "缺少支付ID" }, { status: 400 });
    }

    let payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId: user.id },
      include: { subscription: { include: { plan: true } } },
    });

    if (!payment) {
      return NextResponse.json({ error: "支付记录不存在" }, { status: 404 });
    }

    if (
      payment.status === "pending" &&
      payment.paymentMethod === "wechat" &&
      payment.transactionId &&
      getPaymentMode() === "wechat"
    ) {
      try {
        const wechatOrder = await queryWechatOrder(payment.transactionId);
        if (wechatOrder?.trade_state === "SUCCESS") {
          await completePayment(payment.id, wechatOrder.transaction_id);
          payment = (await prisma.payment.findFirst({
            where: { id: paymentId, userId: user.id },
            include: { subscription: { include: { plan: true } } },
          }))!;
        }
      } catch (error) {
        console.error("查询微信支付状态失败:", error);
      }
    }

    return NextResponse.json({
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      createdAt: payment.createdAt,
      planName: payment.subscription.plan.displayName,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "查询支付状态失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
