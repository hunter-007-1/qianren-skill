"use client";

import { LogOut } from "lucide-react";
import { mutate } from "swr";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  email?: string | null;
  nickname?: string | null;
}

export function AdminHeader({ title, subtitle, email, nickname }: AdminHeaderProps) {
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    mutate("/api/auth/me", null, { revalidate: false });
    window.location.href = "/admin/login";
  };

  return (
    <header className="flex items-center justify-between border-b border-slate-800/80 bg-[#0c1220]/80 px-6 py-4 backdrop-blur">
      <div>
        <h1 className="text-lg font-black text-white">{title}</h1>
        {subtitle && (
          <p className="text-xs font-medium text-slate-500">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm font-semibold text-slate-200">
            {nickname || email || "管理员"}
          </div>
          {nickname && email && (
            <div className="text-xs text-slate-500">{email}</div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-medium text-slate-400 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          退出
        </button>
      </div>
    </header>
  );
}
