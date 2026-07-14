"use client";

import Link from "next/link";
import useSWR from "swr";
import { Users, Sparkles, BarChart3, User, ArrowRight, Loader2 } from "lucide-react";
import { StatsCard } from "@/components/admin/stats-card";
import { AdminHeader } from "@/components/admin/admin-header";
import { useUser } from "@/lib/use-user";

interface StatsData {
  overview: {
    totalUsers: number;
    totalCharacters: number;
    totalAnalyses: number;
    analysisSuccessRate: number;
    activeUsersToday: number;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const shortcuts = [
  { href: "/admin/users", label: "用户管理", desc: "角色、禁用、模拟登录", icon: Users },
  { href: "/admin/characters", label: "角色管理", desc: "查看聊天、批量重分析", icon: Sparkles },
  { href: "/admin/stats", label: "数据统计", desc: "增长趋势与导出", icon: BarChart3 },
];

export default function AdminOverviewPage() {
  const { data: user } = useUser();
  const { data: stats, isLoading } = useSWR<StatsData>("/api/admin/stats", fetcher);

  return (
    <>
      <AdminHeader
        title="概览"
        subtitle="管理后台仪表盘"
        email={user?.email}
        nickname={user?.nickname}
      />
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            加载中...
          </div>
        )}

        {stats?.overview && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatsCard
              title="用户总数"
              value={stats.overview.totalUsers}
              icon={<Users className="h-6 w-6" />}
            />
            <StatsCard
              title="角色总数"
              value={stats.overview.totalCharacters}
              icon={<Sparkles className="h-6 w-6" />}
            />
            <StatsCard
              title="分析总数"
              value={stats.overview.totalAnalyses}
              icon={<BarChart3 className="h-6 w-6" />}
            />
            <StatsCard
              title="分析成功率"
              value={`${stats.overview.analysisSuccessRate}%`}
              icon={<BarChart3 className="h-6 w-6" />}
            />
            <StatsCard
              title="今日活跃用户"
              value={stats.overview.activeUsersToday}
              icon={<User className="h-6 w-6" />}
            />
          </div>
        )}

        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">
          快捷入口
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {shortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center justify-between rounded-2xl border border-slate-800 bg-[#12182a] p-5 transition hover:border-[#00D4FF]/40 hover:bg-[#151c30]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00D4FF]/10 text-[#00D4FF]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white">{item.label}</div>
                    <div className="text-xs text-slate-500">{item.desc}</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600 transition group-hover:text-[#00D4FF]" />
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
