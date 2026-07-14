"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import { mutate } from "swr";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "forbidden") {
      toast.error("需要管理员权限");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "登录失败");
      }

      toast.success("管理员登录成功");
      await mutate("/api/auth/me");
      router.push("/admin");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md"
    >
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00D4FF] to-[#7B2FFF] text-white shadow-lg shadow-cyan-500/20">
          <Shield className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          管理后台
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          仅限管理员账号登录
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">
            管理员邮箱
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-[#12182a] px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF]"
            placeholder="admin@example.com"
            required
            autoComplete="username"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">
            密码
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-[#12182a] px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF]"
            placeholder="输入密码"
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#7B2FFF] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              登录中...
            </>
          ) : (
            "进入后台"
          )}
        </button>
      </form>
    </motion.div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-10">
      <Toaster position="top-right" />
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            加载中...
          </div>
        }
      >
        <AdminLoginForm />
      </Suspense>
    </main>
  );
}
