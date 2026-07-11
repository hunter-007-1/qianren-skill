"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Crown,
  Calendar,
  CreditCard,
  Loader2,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { useUser } from "@/lib/use-user";

const PAYMENT_ENABLED = process.env.NEXT_PUBLIC_PAYMENT_ENABLED === "true";

export default function SubscriptionPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useUser();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (user) {
      fetch("/api/subscription/current")
        .then((res) => res.json())
        .then((data) => {
          setSubscription(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [user]);

  if (userLoading || loading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="text-sm font-bold text-slate-400">加载中...</p>
      </div>
    );
  }

  const isPro = subscription?.plan === "pro";
  const planName = isPro ? "专业版" : "免费版";

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <Toaster position="top-right" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          返回个人中心
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl bg-white p-8 shadow-sm dark:bg-slate-900"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            isPro
              ? "bg-gradient-to-r from-indigo-500 to-purple-500"
              : "bg-slate-100 dark:bg-slate-800"
          }`}>
            {isPro ? (
              <Crown className="h-6 w-6 text-white" />
            ) : (
              <Sparkles className="h-6 w-6 text-slate-500" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              我的订阅
            </h1>
            <p className="text-sm text-slate-500">
              {PAYMENT_ENABLED ? "管理你的订阅和付费功能" : "查看当前套餐与使用情况"}
            </p>
          </div>
        </div>

        <div className={`rounded-2xl p-6 mb-8 ${
          isPro
            ? "bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 dark:from-indigo-900/20 dark:to-purple-900/20 dark:border-indigo-800"
            : "bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700"
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {planName}
              </h2>
              {isPro && subscription?.planExpiresAt && (
                <p className="text-sm text-slate-500 mt-1">
                  到期时间：{new Date(subscription.planExpiresAt).toLocaleDateString("zh-CN")}
                </p>
              )}
            </div>
            {isPro && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                活跃
              </span>
            )}
          </div>

          {!isPro && PAYMENT_ENABLED && (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              升级到专业版
            </Link>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            当前使用情况
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="text-sm text-slate-500 mb-1">角色数量</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {subscription?.limits?.characters === -1 ? "无限制" : `${subscription?.limits?.characters || 3} 个`}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="text-sm text-slate-500 mb-1">每日对话</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {subscription?.limits?.chatPerDay === -1 ? "无限制" : `${subscription?.limits?.chatPerDay || 20} 次`}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
