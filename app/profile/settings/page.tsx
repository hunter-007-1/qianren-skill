"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, Loader2, Settings, Sun, Moon, Monitor } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useUser } from "@/lib/use-user";

export default function SettingsPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useUser();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [user, userLoading, router]);

  if (userLoading || !user) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Loading...
        </p>
      </div>
    );
  }

  const themes = [
    { value: "light", label: "浅色模式", icon: Sun, description: "始终使用浅色主题" },
    { value: "dark", label: "深色模式", icon: Moon, description: "始终使用深色主题" },
    { value: "system", label: "跟随系统", icon: Monitor, description: "根据系统设置自动切换" },
  ];

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <Toaster position="top-right" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          返回个人中心
        </Link>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-[2rem] bg-white border border-slate-200 p-8 shadow-sm dark:bg-slate-900 dark:border-slate-800"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-900/20">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              偏好设置
            </h1>
            <p className="text-sm text-slate-500">自定义你的使用体验</p>
          </div>
        </div>

        {/* Theme Selection */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            主题外观
          </h2>
          <div className="grid gap-3">
            {themes.map((t) => {
              const Icon = t.icon;
              const isActive = theme === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`flex items-center gap-4 rounded-2xl border-2 p-4 transition-all ${
                    isActive
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                  }`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    isActive
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-400"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className={`font-bold ${
                      isActive
                        ? "text-blue-700 dark:text-blue-400"
                        : "text-slate-900 dark:text-white"
                    }`}>
                      {t.label}
                    </h3>
                    <p className="text-sm text-slate-500">{t.description}</p>
                  </div>
                  {isActive && (
                    <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </motion.section>
    </main>
  );
}
