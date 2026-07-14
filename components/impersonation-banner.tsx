"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";

export function ImpersonationBanner() {
  const router = useRouter();
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 检查是否处于模拟登录状态
    const adminToken = localStorage.getItem("admin-token");
    setIsImpersonating(!!adminToken);
  }, []);

  const handleStopImpersonate = async () => {
    setLoading(true);
    try {
      const adminToken = localStorage.getItem("admin-token");
      if (!adminToken) {
        toast.error("无法恢复管理员身份，请重新登录");
        router.push("/admin/login");
        return;
      }

      // 调用 stop-impersonate API，服务端恢复 admin cookie
      const res = await fetch("/api/admin/stop-impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminToken }),
      });

      if (!res.ok) {
        const data = await res.json();
        // 如果 token 过期，清除 localStorage 并跳转登录
        if (res.status === 400) {
          localStorage.removeItem("admin-token");
          toast.error(data.error || "管理员会话已过期，请重新登录");
          router.push("/admin/login");
          return;
        }
        throw new Error(data.error || "恢复失败");
      }

      // 清除 localStorage 中的 admin token
      localStorage.removeItem("admin-token");

      toast.success("已恢复管理员身份");
      router.push("/admin");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "恢复管理员身份失败");
    } finally {
      setLoading(false);
    }
  };

  if (!isImpersonating) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between bg-yellow-500 px-4 py-2 text-white">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">
          当前以其他用户身份登录
        </span>
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
