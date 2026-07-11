"use client";

import Link from "next/link";
import { Sparkles, X, Crown, Zap } from "lucide-react";

const PAYMENT_ENABLED = process.env.NEXT_PUBLIC_PAYMENT_ENABLED === "true";

interface LimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  remaining: number;
  limit: number;
}

export function LimitModal({ isOpen, onClose, feature, remaining, limit }: LimitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-slate-900">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/20">
            <Zap className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {feature}已达上限
            </h3>
            <p className="text-sm text-slate-500">
              今日剩余 {remaining} / {limit}
            </p>
          </div>
        </div>

        {PAYMENT_ENABLED ? (
          <>
            <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 p-6 mb-6 dark:from-indigo-900/20 dark:to-purple-900/20">
              <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Crown className="h-5 w-5 text-indigo-500" />
                升级到专业版
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  无限制使用所有功能
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  高级AI模型
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  自动记忆更新
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Link
                href="/pricing"
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-sm font-bold text-white hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
              >
                <Crown className="h-4 w-4" />
                查看套餐
              </Link>
              <button
                onClick={onClose}
                className="rounded-2xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                稍后再说
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              今日额度已用完，请明天再试。
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors dark:bg-white dark:text-slate-900"
            >
              知道了
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
