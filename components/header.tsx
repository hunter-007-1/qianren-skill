"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, Sparkles, Crown } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { useUser } from "@/lib/use-user";
import { useEffect, useState } from "react";

const PAYMENT_ENABLED = process.env.NEXT_PUBLIC_PAYMENT_ENABLED === "true";

const navItems = [
  { href: "/", label: "首页", icon: Home },
  { href: "/characters/new", label: "创建", icon: PlusCircle },
];

export function Header() {
  const pathname = usePathname();
  const { data: user } = useUser();
  const [userPlan, setUserPlan] = useState("free");

  useEffect(() => {
    if (user) {
      fetch("/api/subscription/current")
        .then((res) => res.json())
        .then((data) => {
          if (data.plan) setUserPlan(data.plan);
        })
        .catch(() => {});
    }
  }, [user]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-all active:scale-[0.97]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              千人智聊
            </span>
            <span className="hidden text-[10px] font-medium text-slate-400 dark:text-slate-500 sm:block">
              Digital Soul Lab
            </span>
          </div>
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all
                    ${
                      isActive
                        ? "bg-indigo-50 text-indigo-600 shadow-sm dark:bg-indigo-500/10 dark:text-indigo-400"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          {PAYMENT_ENABLED && user && userPlan !== "pro" && (
            <Link
              href="/pricing"
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:shadow-md hover:shadow-indigo-500/20 transition-all"
            >
              <Crown className="h-3 w-3" />
              升级
            </Link>
          )}
          <div className="mx-1.5 h-6 w-px bg-slate-200 dark:bg-slate-800" />
          <UserMenu />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
