import WxPay from "wechatpay-node-v3";
import {
  generateOutTradeNo,
  getAppUrl,
  isWechatPayConfigured,
  resolvePemContent,
  yuanToFen,
} from "./config";

let wechatPayClient: WxPay | null = null;

function getWechatPayClient(): WxPay {
  if (wechatPayClient) return wechatPayClient;

  if (!isWechatPayConfigured()) {
    throw new Error("微信支付未配置，请设置相关环境变量");
  }

  const publicKey = resolvePemContent(
    process.env.WECHAT_PUBLIC_KEY || process.env.WECHAT_PLATFORM_CERT || ""
  );
  const privateKey = resolvePemContent(process.env.WECHAT_PRIVATE_KEY || "");

  wechatPayClient = new WxPay({
    appid: process.env.WECHAT_APP_ID!,
    mchid: process.env.WECHAT_MCH_ID!,
    publicKey: Buffer.from(publicKey),
    privateKey: Buffer.from(privateKey),
    key: process.env.WECHAT_API_V3_KEY!,
    serial_no: process.env.WECHAT_SERIAL_NO,
  });

  return wechatPayClient;
}

export interface WechatNativeOrderInput {
  paymentId: string;
  description: string;
  amount: number;
  notifyUrl?: string;
}

export interface WechatNativeOrderResult {
  outTradeNo: string;
  codeUrl: string;
}

export async function createWechatNativeOrder(
  input: WechatNativeOrderInput
): Promise<WechatNativeOrderResult> {
  const pay = getWechatPayClient();
  const outTradeNo = generateOutTradeNo(input.paymentId);
  const notifyUrl =
    input.notifyUrl || `${getAppUrl()}/api/payment/wechat/notify`;

  const result = await pay.transactions_native({
    appid: process.env.WECHAT_APP_ID!,
    mchid: process.env.WECHAT_MCH_ID!,
    description: input.description,
    out_trade_no: outTradeNo,
    notify_url: notifyUrl,
    amount: {
      total: yuanToFen(input.amount),
      currency: "CNY",
    },
  });

  const codeUrl = result?.data?.code_url || result?.code_url;
  if (!codeUrl) {
    throw new Error("微信支付下单失败，未返回二维码链接");
  }

  return { outTradeNo, codeUrl };
}

export async function queryWechatOrder(outTradeNo: string) {
  const pay = getWechatPayClient();
  const result = await pay.query({
    out_trade_no: outTradeNo,
  });

  return result?.data || result;
}

export async function verifyWechatNotify(headers: Headers, body: string) {
  const pay = getWechatPayClient();
  return pay.verifySign({
    timestamp: headers.get("wechatpay-timestamp") || "",
    nonce: headers.get("wechatpay-nonce") || "",
    body,
    serial: headers.get("wechatpay-serial") || "",
    signature: headers.get("wechatpay-signature") || "",
  });
}

export function decryptWechatNotifyResource(resource: {
  ciphertext: string;
  associated_data: string;
  nonce: string;
}) {
  const pay = getWechatPayClient();
  return pay.decipher_gcm<{
    out_trade_no: string;
    transaction_id: string;
    trade_state: string;
    trade_state_desc?: string;
  }>(
    resource.ciphertext,
    resource.associated_data,
    resource.nonce
  );
}
