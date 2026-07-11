import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { completePayment } from "@/lib/payment/complete-payment";
import {
  decryptWechatNotifyResource,
  verifyWechatNotify,
} from "@/lib/payment/wechat";
import { isWechatPayConfigured } from "@/lib/payment/config";

export async function POST(request: Request) {
  if (!isWechatPayConfigured()) {
    return NextResponse.json({ error: "微信支付未配置" }, { status: 503 });
  }

  try {
    const body = await request.text();
    const payload = JSON.parse(body) as {
      resource: {
        ciphertext: string;
        associated_data: string;
        nonce: string;
      };
    };

    const verified = await verifyWechatNotify(request.headers, body);
    if (!verified) {
      return NextResponse.json(
        { code: "FAIL", message: "签名验证失败" },
        { status: 401 }
      );
    }

    const decrypted = decryptWechatNotifyResource(payload.resource);
    if (decrypted.trade_state !== "SUCCESS") {
      return NextResponse.json({ code: "SUCCESS", message: "已接收" });
    }

    const payment = await prisma.payment.findFirst({
      where: { transactionId: decrypted.out_trade_no },
    });

    if (!payment) {
      console.error("微信支付回调：未找到订单", decrypted.out_trade_no);
      return NextResponse.json({ code: "SUCCESS", message: "已接收" });
    }

    await completePayment(payment.id, decrypted.transaction_id);

    return NextResponse.json({ code: "SUCCESS", message: "成功" });
  } catch (error) {
    console.error("微信支付回调处理失败:", error);
    return NextResponse.json(
      { code: "FAIL", message: "处理失败" },
      { status: 500 }
    );
  }
}
