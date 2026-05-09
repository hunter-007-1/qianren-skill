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
        toast.error("无法恢复管理员身份");
        return;
      }

      // 恢复管理员 token
      document.cookie = `qianren-session=${adminToken}; path=/; max-age=${7 * 24 * 60 * 60}`;
      localStorage.removeItem("admin-token");

      toast.success("已恢复管理员身份");
      router.push("/admin");
      router.refresh();
    } catch (error) {
      toast.error("恢复管理员身份失败");
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
        返回管理员身份
      </button>
    </div>
  );
}
