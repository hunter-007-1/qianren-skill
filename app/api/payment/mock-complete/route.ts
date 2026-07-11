import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { completePayment } from "@/lib/payment/complete-payment";
import { getPaymentMode } from "@/lib/payment/config";
import { isPaymentEnabled } from "@/lib/payment-enabled";

export async function POST(request: Request) {
  if (!isPaymentEnabled() || getPaymentMode() !== "mock") {
    return NextResponse.json({ error: "支付功能暂未开放" }, { status: 403 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json({ error: "缺少支付ID" }, { status: 400 });
    }

    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId: user.id },
    });

    if (!payment) {
      return NextResponse.json({ error: "支付记录不存在" }, { status: 404 });
    }

    if (payment.status === "success") {
      return NextResponse.json({ status: "success" });
    }

    await completePayment(payment.id);

    return NextResponse.json({ status: "success" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "模拟支付失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
