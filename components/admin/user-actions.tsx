"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ShieldOff, Ban, CheckCircle, Trash2, LogIn } from "lucide-react";
import { toast } from "react-hot-toast";

interface UserActionsProps {
  userId: string;
  isAdmin: boolean;
  isDisabled: boolean;
  isCurrentUser: boolean;
  onUpdate: () => void;
}

export function UserActions({
  userId,
  isAdmin,
  isDisabled,
  isCurrentUser,
  onUpdate,
}: UserActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggleAdmin = async () => {
    if (isCurrentUser) {
      toast.error("不能修改自己的管理员状态");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: !isAdmin }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "操作失败");
      }

      toast.success(isAdmin ? "已取消管理员权限" : "已设置为管理员");
      onUpdate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "操作失败");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (isCurrentUser) {
      toast.error("不能禁用自己的账号");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDisabled: !isDisabled }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "操作失败");
      }

      toast.success(isDisabled ? "已启用用户" : "已禁用用户");
      onUpdate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "操作失败");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isCurrentUser) {
      toast.error("不能删除自己的账号");
      return;
    }

    if (!confirm("确定要删除该用户吗？该用户的所有数据将被永久删除，此操作不可恢复。")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "删除失败");
      }

      toast.success("用户已删除");
      onUpdate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败");
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/impersonate`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "模拟登录失败");
      }

      const data = await res.json();

      // 仅切换前台用户 Cookie；管理员 Cookie 保持不变
      if (data.previousUserToken) {
        localStorage.setItem("previous-user-token", data.previousUserToken);
      } else {
        // 标记正在模拟，停止时清除前台会话
        localStorage.setItem("previous-user-token", "");
      }
      localStorage.removeItem("admin-token");

      toast.success(`已切换到 ${data.user.nickname || data.user.email} 的账号`);
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "模拟登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggleAdmin}
        disabled={loading || isCurrentUser}
        title={isAdmin ? "取消管理员" : "设为管理员"}
        className={`rounded-lg p-2 transition-all ${
          isAdmin
            ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
            : "bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-400"
        } disabled:opacity-50`}
      >
        {isAdmin ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
      </button>

      <button
        onClick={handleToggleStatus}
        disabled={loading || isCurrentUser}
        title={isDisabled ? "启用用户" : "禁用用户"}
        className={`rounded-lg p-2 transition-all ${
          isDisabled
            ? "bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
            : "bg-yellow-50 text-yellow-600 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400"
        } disabled:opacity-50`}
      >
        {isDisabled ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
      </button>

      <button
        onClick={handleImpersonate}
        disabled={loading || isCurrentUser || isDisabled}
        title="以该用户身份登录"
        className="rounded-lg bg-blue-50 p-2 text-blue-600 transition-all hover:bg-blue-100 disabled:opacity-50 dark:bg-blue-900/20 dark:text-blue-400"
      >
        <LogIn className="h-4 w-4" />
      </button>

      <button
        onClick={handleDelete}
        disabled={loading || isCurrentUser}
        title="删除用户"
        className="rounded-lg bg-red-50 p-2 text-red-600 transition-all hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/20 dark:text-red-400"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
