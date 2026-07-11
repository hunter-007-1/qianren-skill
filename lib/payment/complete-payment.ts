import { prisma } from "@/lib/db";

export async function completePayment(paymentId: string, wechatTransactionId?: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { subscription: true },
  });

  if (!payment) {
    throw new Error("支付记录不存在");
  }

  if (payment.status === "success") {
    return payment;
  }

  return prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: "success",
        transactionId: wechatTransactionId || payment.transactionId,
      },
    });

    await tx.subscription.update({
      where: { id: payment.subscriptionId },
      data: {
        status: "active",
        paymentMethod: payment.paymentMethod,
      },
    });

    await tx.user.update({
      where: { id: payment.userId },
      data: {
        plan: "pro",
        planExpiresAt: payment.subscription.endDate,
      },
    });

    return updatedPayment;
  });
}

export async function failPayment(paymentId: string) {
  return prisma.payment.update({
    where: { id: paymentId },
    data: { status: "failed" },
  });
}
