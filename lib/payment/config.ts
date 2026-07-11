export type PaymentMode = "mock" | "wechat";

export function getPaymentMode(): PaymentMode {
  if (process.env.PAYMENT_MODE === "mock") return "mock";
  if (isWechatPayConfigured()) return "wechat";
  return "mock";
}

export function isWechatPayConfigured(): boolean {
  return Boolean(
    process.env.WECHAT_APP_ID &&
      process.env.WECHAT_MCH_ID &&
      process.env.WECHAT_API_V3_KEY &&
      process.env.WECHAT_PRIVATE_KEY &&
      (process.env.WECHAT_PUBLIC_KEY || process.env.WECHAT_PLATFORM_CERT)
  );
}

export function getAppUrl(fallback?: string): string {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    fallback ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function resolvePemContent(value: string): string {
  return value.replace(/\\n/g, "\n").trim();
}

export function yuanToFen(amount: number): number {
  return Math.round(amount * 100);
}

export function generateOutTradeNo(paymentId: string): string {
  const compact = paymentId.replace(/[^a-zA-Z0-9]/g, "").slice(-24);
  return `P${compact}`.slice(0, 32);
}
