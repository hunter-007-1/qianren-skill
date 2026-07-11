/** 支付功能开关，默认关闭。设为 "true" 可重新启用。 */
export function isPaymentEnabled(): boolean {
  return (
    process.env.PAYMENT_ENABLED === "true" ||
    process.env.NEXT_PUBLIC_PAYMENT_ENABLED === "true"
  );
}
