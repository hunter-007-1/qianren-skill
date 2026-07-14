"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";

const PREV_USER_TOKEN_KEY = "previous-user-token";
const LEGACY_ADMIN_TOKEN_KEY = "admin-token";

export function ImpersonationBanner() {
  const router = useRouter();
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsImpersonating(
      localStorage.getItem(PREV_USER_TOKEN_KEY) !== null ||
        localStorage.getItem(LEGACY_ADMIN_TOKEN_KEY) !== null
    );
  }, []);

  const handleStopImpersonate = async () => {
    setLoading(true);
    try {
      const previousUserToken =
        localStorage.getItem(PREV_USER_TOKEN_KEY) ??
        localStorage.getItem(LEGACY_ADMIN_TOKEN_KEY);

      const res = await fetch("/api/admin/stop-impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ previousUserToken }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 401) {
          localStorage.removeItem(PREV_USER_TOKEN_KEY);
          localStorage.removeItem(LEGACY_ADMIN_TOKEN_KEY);
          toast.error(data.error || "管理员会话已过期，请重新登录后台");
          router.push("/admin/login");
          return;
        }
        throw new Error(data.error || "恢复失败");
      }

      localStorage.removeItem(PREV_USER_TOKEN_KEY);
      localStorage.removeItem(LEGACY_ADMIN_TOKEN_KEY);

      toast.success("已恢复前台登录状态");
      router.push("/admin");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "恢复失败");
    } finally {
      setLoading(false);
    }
  };

  if (!isImpersonating) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between bg-yellow-500 px-4 py-2 text-white">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">当前以其他用户身份登录</span>
      </div>
      <button
        onClick={handleStopImpersonate}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-1.5 text-sm font-medium hover:bg-white/30 disabled:opacity-50"
      >
        <ArrowLeft className="h-4 w-4" />
        {loading ? "恢复中..." : "返回管理员身份"}
      </button>
    </div>
  );
}
