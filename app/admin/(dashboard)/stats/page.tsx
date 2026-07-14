"use client";

import useSWR from "swr";
import {
  Users,
  Sparkles,
  BarChart3,
  User,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { StatsCard } from "@/components/admin/stats-card";
import { AdminHeader } from "@/components/admin/admin-header";
import { useAdminUser } from "@/lib/use-admin";

interface StatsData {
  overview: {
    totalUsers: number;
    totalCharacters: number;
    totalAnalyses: number;
    analysisSuccessRate: number;
    activeUsersToday: number;
  };
  userGrowth: Array<{ date: string; count: number }>;
  characterGrowth: Array<{ date: string; count: number }>;
  analysisStats: {
    notStarted: number;
    running: number;
    done: number;
    failed: number;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const COLORS = ["#94a3b8", "#3b82f6", "#22c55e", "#ef4444"];

export default function AdminStatsPage() {
  const { data: me } = useAdminUser();
  const { data: stats, isLoading } = useSWR<StatsData>("/api/admin/stats", fetcher);

  const analysisStatsData = stats
    ? [
        { name: "未开始", value: stats.analysisStats.notStarted },
        { name: "分析中", value: stats.analysisStats.running },
        { name: "已完成", value: stats.analysisStats.done },
        { name: "失败", value: stats.analysisStats.failed },
      ]
    : [];

  const handleExportStats = async () => {
    try {
      const res = await fetch("/api/admin/stats/export");
      if (!res.ok) throw new Error("导出失败");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qianren-stats-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("导出成功");
    } catch {
      toast.error("导出失败");
    }
  };

  return (
    <>
      <AdminHeader
        title="数据统计"
        subtitle="增长趋势、分析分布与导出"
        email={me?.email}
        nickname={me?.nickname}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleExportStats}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            <Download className="h-4 w-4" />
            导出 Excel
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            加载中...
          </div>
        )}

        {stats && (
          <>
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

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-[#12182a] p-6">
                <h3 className="mb-4 text-lg font-bold text-white">
                  用户增长趋势（近30天）
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      tickFormatter={(value) => value.slice(5)}
                    />
                    <YAxis tick={{ fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{
                        background: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="count" fill="#00D4FF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#12182a] p-6">
                <h3 className="mb-4 text-lg font-bold text-white">
                  角色创建趋势（近30天）
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.characterGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      tickFormatter={(value) => value.slice(5)}
                    />
                    <YAxis tick={{ fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{
                        background: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="count" fill="#7B2FFF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#12182a] p-6 lg:col-span-2">
                <h3 className="mb-4 text-lg font-bold text-white">分析状态分布</h3>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analysisStatsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analysisStatsData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: 8,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex justify-center gap-6">
                  {analysisStatsData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[index] }}
                      />
                      <span className="text-sm text-slate-400">
                        {item.name}: {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
