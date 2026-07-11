"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, CreditCard, CheckCircle, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Toaster, toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { useUser } from "@/lib/use-user";

const PAYMENT_ENABLED = process.env.NEXT_PUBLIC_PAYMENT_ENABLED === "true";

type PaymentMethod = "wechat";
type PaymentStatus = "idle" | "pending" | "success" | "failed";

interface Plan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  yearlyPrice: number | null;
}

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const planId = params.planId as string;
  const period = searchParams.get("period") || "monthly";
  const { data: user, isLoading: userLoading } = useUser();

  useEffect(() => {
    if (!PAYMENT_ENABLED) {
      router.replace("/");
    }
  }, [router]);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creatingSubscription, setCreatingSubscription] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [codeUrl, setCodeUrl] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<"mock" | "wechat">("mock");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    fetch("/api/subscription/plans")
      .then((res) => res.json())
      .then((data: Plan[]) => {
        const selectedPlan = data.find((p) => p.id === planId) || data.find((p) => p.name === "pro");
        if (selectedPlan) setPlan(selectedPlan);
      })
      .catch(() => toast.error("加载套餐失败"));
  }, [planId]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const startPolling = (paymentId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const statusRes = await fetch(`/api/payment/callback?id=${paymentId}`);
        const statusData = await statusRes.json();

        if (statusData.status === "success") {
          if (pollRef.current) clearInterval(pollRef.current);
          setPaymentStatus("success");
          toast.success("支付成功！");
        } else if (statusData.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          setPaymentStatus("failed");
          toast.error("支付失败");
        }
      } catch {
        if (pollRef.current) clearInterval(pollRef.current);
        setPaymentStatus("failed");
        toast.error("查询支付状态失败");
      }
    }, 2000);
  };

  const ensureSubscription = async () => {
    if (subscriptionId) return subscriptionId;
    if (!plan) throw new Error("套餐信息未加载");

    setCreatingSubscription(true);
    try {
      const res = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, period }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "创建订阅失败");
      setSubscriptionId(data.subscriptionId);
      return data.subscriptionId as string;
    } finally {
      setCreatingSubscription(false);
    }
  };

  const handlePay = async () => {
    if (!plan) return;

    setLoading(true);
    try {
      const activeSubscriptionId = await ensureSubscription();

      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: activeSubscriptionId,
          paymentMethod: "wechat" satisfies PaymentMethod,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "支付失败");

      setPaymentMode(data.paymentMode || "mock");
      setPaymentId(data.paymentId);
      if (data.codeUrl) setCodeUrl(data.codeUrl);
      setPaymentStatus("pending");
      startPolling(data.paymentId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "支付失败");
    } finally {
      setLoading(false);
    }
  };

  const handleMockComplete = async () => {
    if (!paymentId) return;

    setLoading(true);
    try {
      const confirmRes = await fetch("/api/payment/mock-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      const confirmData = await confirmRes.json();
      if (!confirmRes.ok) throw new Error(confirmData.error ?? "模拟支付失败");

      if (pollRef.current) clearInterval(pollRef.current);
      setPaymentStatus("success");
      toast.success("模拟支付成功！");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "模拟支付失败");
    } finally {
      setLoading(false);
    }
  };

  if (!PAYMENT_ENABLED) {
    return null;
  }

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
            href="/profile/subscription"
            className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-bold text-white hover:bg-indigo-500 transition-colors"
          >
            查看我的订阅
          </Link>
        </motion.div>
      </main>
    );
  }

  const amount =
    period === "yearly" && plan.yearlyPrice ? plan.yearlyPrice : plan.price;

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
          微信支付
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

        {paymentStatus === "pending" && codeUrl ? (
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900/20">
              <Smartphone className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              请使用微信扫码支付
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              打开微信 → 扫一扫 → 扫描下方二维码
            </p>
            <div className="mx-auto inline-flex rounded-2xl border-4 border-white bg-white p-4 shadow-lg dark:border-slate-700">
              <QRCodeSVG value={codeUrl} size={200} level="M" includeMargin />
            </div>
            <p className="mt-4 text-xs text-slate-400">
              支付完成后将自动跳转，请勿关闭页面
            </p>
          </div>
        ) : paymentStatus === "pending" && paymentMode === "mock" ? (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-800 dark:bg-amber-900/20">
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
              开发模式：微信支付未配置，可模拟支付完成
            </p>
            <button
              onClick={handleMockComplete}
              disabled={loading}
              className="rounded-xl bg-amber-600 px-6 py-2 text-sm font-bold text-white hover:bg-amber-500 disabled:opacity-50"
            >
              模拟支付成功
            </button>
          </div>
        ) : (
          <div className="mb-8 rounded-2xl border-2 border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
            <div className="flex items-center gap-3">
              <div className="text-3xl">💬</div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">微信支付</p>
                <p className="text-xs text-slate-500">安全便捷，支持扫码支付</p>
              </div>
            </div>
          </div>
        )}

        {paymentStatus !== "pending" && (
          <button
            onClick={handlePay}
            disabled={loading || creatingSubscription}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 py-4 text-sm font-bold text-white hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-50"
          >
            {loading || creatingSubscription ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                生成支付二维码 ¥{amount}
              </>
            )}
          </button>
        )}

        {paymentStatus === "pending" && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            等待支付结果...
          </div>
        )}

        <p className="mt-4 text-center text-xs text-slate-400">
          支付即表示同意《服务条款》和《隐私政策》
        </p>
      </motion.div>
    </main>
  );
}
