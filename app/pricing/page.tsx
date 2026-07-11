"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  X,
  Sparkles,
  MessageSquare,
  Brain,
  Database,
  Download,
  Zap,
  Loader2,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { useUser } from "@/lib/use-user";

const PAYMENT_ENABLED = process.env.NEXT_PUBLIC_PAYMENT_ENABLED === "true";

interface Plan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  yearlyPrice: number | null;
  features: string;
}

export default function PricingPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useUser();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState("free");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    fetch("/api/subscription/plans")
      .then((res) => res.json())
      .then((data) => {
        setPlans(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    if (user) {
      fetch("/api/subscription/current")
        .then((res) => res.json())
        .then((data) => {
          if (data.plan) setCurrentPlan(data.plan);
        })
        .catch(() => {});
    }
  }, [user]);

  const handleSubscribe = (planId: string) => {
    if (!PAYMENT_ENABLED) return;
    if (!user) {
      router.push("/login");
      return;
    }
    router.push(`/payment/${planId}?period=${billingPeriod}`);
  };

  if (!PAYMENT_ENABLED) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-24 sm:px-6 lg:px-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </Link>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
          付费功能暂未开放
        </h1>
        <p className="text-slate-500">
          目前所有用户均可免费使用基础功能，感谢支持。
        </p>
      </main>
    );
  }

  const freePlan = plans.find((p) => p.name === "free");
  const proPlan = plans.find((p) => p.name === "pro");

  const freeFeatures = [
    { name: "3个角色", included: true },
    { name: "每日20次对话", included: true },
    { name: "基础AI模型", included: true },
    { name: "基础人物分析", included: true },
    { name: "手动记忆更新", included: true },
    { name: "TXT导出", included: true },
    { name: "高级AI模型", included: false },
    { name: "自动记忆更新", included: false },
    { name: "PDF导出", included: false },
    { name: "优先客服", included: false },
  ];

  const proFeatures = [
    { name: "无限制角色", included: true },
    { name: "无限制对话", included: true },
    { name: "高级AI模型", included: true },
    { name: "深度人物分析", included: true },
    { name: "自动记忆更新", included: true },
    { name: "全格式导出", included: true },
    { name: "优先客服", included: true },
    { name: "专属功能", included: true },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <Toaster position="top-right" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">
          选择适合你的套餐
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400">
          解锁全部功能，创造更真实的数字灵魂
        </p>

        <div className="mt-8 inline-flex items-center rounded-full bg-slate-100 p-1 dark:bg-slate-800">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={`rounded-full px-6 py-2 text-sm font-bold transition-all ${
              billingPeriod === "monthly"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            月付
          </button>
          <button
            onClick={() => setBillingPeriod("yearly")}
            className={`rounded-full px-6 py-2 text-sm font-bold transition-all ${
              billingPeriod === "yearly"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            年付
            <span className="ml-1 text-xs text-emerald-500">省26%</span>
          </button>
        </div>
      </motion.div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Free Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border-2 border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              免费版
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              体验基础功能，了解数字灵魂
            </p>
          </div>

          <div className="mb-8">
            <span className="text-5xl font-black text-slate-900 dark:text-white">
              ¥0
            </span>
            <span className="text-slate-500">/永久</span>
          </div>

          <ul className="mb-8 space-y-4">
            {freeFeatures.map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                {feature.included ? (
                  <Check className="h-5 w-5 text-emerald-500 shrink-0" />
                ) : (
                  <X className="h-5 w-5 text-slate-300 dark:text-slate-600 shrink-0" />
                )}
                <span className={`text-sm ${feature.included ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"}`}>
                  {feature.name}
                </span>
              </li>
            ))}
          </ul>

          <button
            disabled={currentPlan === "free"}
            className={`w-full rounded-2xl py-4 text-sm font-bold transition-all ${
              currentPlan === "free"
                ? "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
                : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            }`}
          >
            {currentPlan === "free" ? "当前套餐" : "降级到免费版"}
          </button>
        </motion.div>

        {/* Pro Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative rounded-3xl border-2 border-indigo-500 bg-white p-8 shadow-xl shadow-indigo-500/10 dark:border-indigo-400 dark:bg-slate-900"
        >
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1 text-xs font-bold text-white">
              <Sparkles className="h-3 w-3" />
              推荐
            </span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              专业版
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              解锁全部功能，创造无限可能
            </p>
          </div>

          <div className="mb-8">
            <span className="text-5xl font-black text-slate-900 dark:text-white">
              ¥{billingPeriod === "yearly" ? "22" : "29"}
            </span>
            <span className="text-slate-500">/月</span>
            {billingPeriod === "yearly" && (
              <p className="mt-1 text-sm text-emerald-500 font-bold">
                年付 ¥268，省 ¥80
              </p>
            )}
          </div>

          <ul className="mb-8 space-y-4">
            {proFeatures.map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <Check className="h-5 w-5 text-indigo-500 shrink-0" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {feature.name}
                </span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => proPlan && handleSubscribe(proPlan.id)}
            disabled={currentPlan === "pro"}
            className={`w-full rounded-2xl py-4 text-sm font-bold transition-all ${
              currentPlan === "pro"
                ? "bg-emerald-100 text-emerald-600 cursor-not-allowed dark:bg-emerald-900/20 dark:text-emerald-400"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98]"
            }`}
          >
            {currentPlan === "pro" ? "当前套餐" : "立即订阅"}
          </button>
        </motion.div>
      </div>

      {/* FAQ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-16 rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900"
      >
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">
          常见问题
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">
              可以随时取消订阅吗？
            </h3>
            <p className="text-sm text-slate-500">
              是的，您可以随时取消订阅。取消后，您的专业版功能将持续到当前订阅期结束。
            </p>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">
              支持哪些支付方式？
            </h3>
            <p className="text-sm text-slate-500">
              目前支持微信扫码支付，安全便捷。
            </p>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">
              有试用期吗？
            </h3>
            <p className="text-sm text-slate-500">
              新用户注册即享7天专业版试用，无需绑定支付方式。
            </p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
