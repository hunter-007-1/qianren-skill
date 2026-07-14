"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  BarChart3,
  Shield,
  ExternalLink,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "概览", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "用户管理", icon: Users },
  { href: "/admin/characters", label: "角色管理", icon: Sparkles },
  { href: "/admin/stats", label: "数据统计", icon: BarChart3 },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-slate-800/80 bg-[#0c1220]">
      <div className="flex items-center gap-3 border-b border-slate-800/80 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#00D4FF] to-[#7B2FFF] text-white">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-black text-white">千人智聊</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Admin
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-[#00D4FF]/15 text-[#00D4FF]"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800/80 p-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-800/60 hover:text-slate-300"
        >
          <ExternalLink className="h-4 w-4" />
          返回前台
        </Link>
      </div>
    </aside>
  );
}
