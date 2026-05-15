"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, CreditCard, CheckCircle } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { useUser } from "@/lib/use-user";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const period = searchParams.get("period") || "monthly";
  const { data: user, isLoading: userLoading } = useUser();

  const [plan, setPlan] = useState<any>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"alipay" | "wechat">("alipay");
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "pending" | "success" | "failed">("idle");
  const [paymentId, setPaymentId] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    fetch("/api/subscription/plans")
      .then((res) => res.json())
      .then((data) => {
        const proPlan = data.find((p: any) => p.name === "pro");
        if (proPlan) setPlan(proPlan);
      });
  }, []);

  useEffect(() => {
    if (plan && user) {
      fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, period }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.subscriptionId) {
            setSubscriptionId(data.subscriptionId);
          }
        })
        .catch(() => toast.error("创建订阅失败"));
    }
  }, [plan, user, period]);

  const handlePay = async () => {
    if (!subscriptionId) return;

    setLoading(true);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId, paymentMethod }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "支付失败");

      setPaymentId(data.paymentId);
      setPaymentStatus("pending");

      const checkStatus = setInterval(async () => {
        const statusRes = await fetch(`/api/payment/callback?id=${data.paymentId}`);
        const statusData = await statusRes.json();

        if (statusData.status === "success") {
          clearInterval(checkStatus);
          setPaymentStatus("success");
          toast.success("支付成功！");
        } else if (statusData.status === "failed") {
          clearInterval(checkStatus);
          setPaymentStatus("failed");
          toast.error("支付失败");
        }
      }, 1000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "支付失败");
    } finally {
      setLoading(false);
    }
  };

  if (userLoading || !plan) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="text-sm font-bold text-slate-400">加载中...</p>
      </div>
    );
  }

  if (paymentStatus === "success") {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <Toaster position="top-right" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl bg-white p-8 text-center shadow-xl dark:bg-slate-900"
        >
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
        </motion.div>
      </main>
    );
  }

  const amount = period === "yearly" && plan.yearlyPrice ? plan.yearlyPrice : plan.price;

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <Toaster position="top-right" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          返回套餐页
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl bg-white p-8 shadow-xl dark:bg-slate-900"
      >
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-8">
          确认订阅
        </h1>

        <div className="mb-8 rounded-2xl bg-slate-50 p-6 dark:bg-slate-800">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-500">套餐</span>
            <span className="font-bold text-slate-900 dark:text-white">{plan.displayName}</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-500">周期</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {period === "yearly" ? "年付" : "月付"}
            </span>
          </div>
          <div className="h-px bg-slate-200 dark:bg-slate-700 my-4" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900 dark:text-white">金额</span>
            <span className="text-2xl font-black text-indigo-600">¥{amount}</span>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
            选择支付方式
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setPaymentMethod("alipay")}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
                paymentMethod === "alipay"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              <div className="text-2xl">💳</div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">支付宝</span>
            </button>
            <button
              onClick={() => setPaymentMethod("wechat")}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
                paymentMethod === "wechat"
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              <div className="text-2xl">💬</div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">微信支付</span>
            </button>
          </div>
        </div>

        <button
          onClick={handlePay}
          disabled={loading || paymentStatus === "pending"}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-4 text-sm font-bold text-white hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : paymentStatus === "pending" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              等待支付结果...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              确认支付 ¥{amount}
            </>
          )}
        </button>

        <p className="mt-4 text-center text-xs text-slate-400">
          支付即表示同意《服务条款》和《隐私政策》
        </p>
      </motion.div>
    </main>
  );
}
