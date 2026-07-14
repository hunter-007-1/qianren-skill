"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, User as UserIcon, ChevronDown, Shield, Settings } from "lucide-react";
import { useUser } from "@/lib/use-user";
import { mutate } from "swr";

export function UserMenu() {
  const { data: user, isLoading } = useUser();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    mutate("/api/auth/me", null, { revalidate: false });
    window.location.href = "/";
  };

  if (!isLoading && !user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <UserIcon className="h-4 w-4" />
        <span className="hidden sm:inline">登录</span>
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <UserIcon className="h-4 w-4" />
        <span className="hidden sm:inline">{user?.nickname || user?.email}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Settings className="h-4 w-4" />
            个人中心
          </Link>
          {user?.isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Shield className="h-4 w-4" />
              管理后台
            </Link>
          )}
          <div className="my-1 h-px bg-slate-200 dark:bg-slate-700" />
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
