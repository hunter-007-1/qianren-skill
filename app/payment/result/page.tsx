"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const PAYMENT_ENABLED = process.env.NEXT_PUBLIC_PAYMENT_ENABLED === "true";

function PaymentResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("id");
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");

  useEffect(() => {
    if (!PAYMENT_ENABLED) {
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    if (!PAYMENT_ENABLED || !paymentId) return;

    const checkStatus = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/callback?id=${paymentId}`);
        const data = await res.json();

        if (data.status === "success") {
          clearInterval(checkStatus);
          setStatus("success");
        } else if (data.status === "failed") {
          clearInterval(checkStatus);
          setStatus("failed");
        }
      } catch {
        clearInterval(checkStatus);
        setStatus("failed");
      }
    }, 1000);

    return () => clearInterval(checkStatus);
  }, [paymentId]);

  if (!PAYMENT_ENABLED) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-3xl bg-white p-8 text-center shadow-xl dark:bg-slate-900"
    >
      {status === "loading" && (
        <>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            等待支付结果
          </h1>
          <p className="text-slate-500">
            正在确认您的支付，请稍候...
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            支付成功
          </h1>
          <p className="text-slate-500 mb-8">
            您已成功升级到专业版，享受全部功能
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-bold text-white hover:bg-indigo-500 transition-colors"
          >
            开始使用
          </Link>
        </>
      )}

      {status === "failed" && (
        <>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            支付失败
          </h1>
          <p className="text-slate-500 mb-8">
            支付过程中出现问题，请重试
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-8 py-4 text-sm font-bold text-white hover:bg-slate-800 transition-colors dark:bg-white dark:text-slate-900"
          >
            返回重试
          </Link>
        </>
      )}
    </motion.div>
  );
}

export default function PaymentResultPage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }>
        <PaymentResultContent />
      </Suspense>
    </main>
  );
}
