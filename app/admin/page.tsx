"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  Sparkles,
  Users,
  User,
  Shield,
  ArrowLeft,
  Loader2,
  BarChart3,
  Download,
  Eye,
  FileText,
  CheckSquare,
  Square,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { StatsCard } from "@/components/admin/stats-card";
import { UserActions } from "@/components/admin/user-actions";
import { ChatModal } from "@/components/admin/chat-modal";
import { DocumentsModal } from "@/components/admin/documents-modal";
import { BatchActions } from "@/components/admin/batch-actions";

interface UserData {
  id: string;
  email: string;
  nickname: string | null;
  isAdmin: boolean;
  isDisabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  _count: { characters: number };
}

interface CharacterData {
  id: string;
  nickname: string;
  analysisStatus: string;
  createdAt: string;
  userId: string | null;
  user: {
    email: string;
    nickname: string | null;
  } | null;
}

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

export default function AdminPage() {
  const [tab, setTab] = useState<"users" | "characters" | "stats">("users");
  const { data: users, mutate: mutateUsers } = useSWR<UserData[]>("/api/admin/users", fetcher);
  const { data: characters, mutate: mutateCharacters } = useSWR<CharacterData[]>("/api/admin/characters", fetcher);
  const { data: stats, mutate: mutateStats } = useSWR<StatsData>("/api/admin/stats", fetcher);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // 角色管理相关状态
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [chatModal, setChatModal] = useState<{ isOpen: boolean; characterId: string; characterName: string }>({
    isOpen: false,
    characterId: "",
    characterName: "",
  });
  const [documentsModal, setDocumentsModal] = useState<{ isOpen: boolean; characterId: string; characterName: string }>({
    isOpen: false,
    characterId: "",
    characterName: "",
  });

  // 获取当前用户 ID
  useState(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.id) setCurrentUserId(data.id);
      });
  });

  const handleDeleteCharacter = async (id: string) => {
    if (!confirm("确定要删除这个角色吗？此操作不可恢复。")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/characters/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
      mutateCharacters();
      toast.success("角色已删除");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败");
    } finally {
      setLoading(false);
    }
  };

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
    } catch (error) {
      toast.error("导出失败");
    }
  };

  const toggleCharacterSelection = (id: string) => {
    setSelectedCharacters((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCharacters.length === characters?.length) {
      setSelectedCharacters([]);
    } else {
      setSelectedCharacters(characters?.map((c) => c.id) || []);
    }
  };

  const analysisStatsData = stats
    ? [
        { name: "未开始", value: stats.analysisStats.notStarted },
        { name: "分析中", value: stats.analysisStats.running },
        { name: "已完成", value: stats.analysisStats.done },
        { name: "失败", value: stats.analysisStats.failed },
      ]
    : [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <Toaster position="top-right" />

      <header className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-600/20">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                管理员面板
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Admin Dashboard
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setTab("users")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all ${
            tab === "users"
              ? "border-b-2 border-red-600 text-red-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Users className="h-4 w-4" />
          用户管理
        </button>
        <button
          onClick={() => setTab("characters")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all ${
            tab === "characters"
              ? "border-b-2 border-red-600 text-red-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          全部角色
        </button>
        <button
          onClick={() => setTab("stats")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all ${
            tab === "stats"
              ? "border-b-2 border-red-600 text-red-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          数据统计
        </button>
      </div>

      {/* 用户管理 */}
      {tab === "users" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {!users || users.length === 0 ? (
            <div className="py-12 text-center text-slate-500">暂无用户</div>
          ) : (
            <div className="grid gap-4">
              {users.map((u) => (
                <div
                  key={u.id}
                  className={`flex items-center justify-between rounded-xl border bg-white p-4 dark:border-slate-700 dark:bg-slate-800 ${
                    u.isDisabled ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        u.isDisabled
                          ? "bg-red-100 dark:bg-red-900"
                          : "bg-slate-100 dark:bg-slate-700"
                      }`}
                    >
                      <User
                        className={`h-5 w-5 ${
                          u.isDisabled ? "text-red-500" : "text-slate-500"
                        }`}
                      />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {u.nickname || u.email}
                        {u.isAdmin && (
                          <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                            管理员
                          </span>
                        )}
                        {u.isDisabled && (
                          <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                            已禁用
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500">{u.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm text-slate-500">
                      <div>{u._count.characters} 个角色</div>
                      <div className="text-xs">
                        {u.lastLoginAt
                          ? `最后登录: ${new Date(u.lastLoginAt).toLocaleDateString()}`
                          : "从未登录"}
                      </div>
                    </div>
                    <UserActions
                      userId={u.id}
                      isAdmin={u.isAdmin}
                      isDisabled={u.isDisabled}
                      isCurrentUser={u.id === currentUserId}
                      onUpdate={mutateUsers}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* 角色管理 */}
      {tab === "characters" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* 批量操作 */}
          <BatchActions
            selectedIds={selectedCharacters}
            onActionComplete={mutateCharacters}
            onClearSelection={() => setSelectedCharacters([])}
          />

          {!characters || characters.length === 0 ? (
            <div className="py-12 text-center text-slate-500">暂无数据</div>
          ) : (
            <>
              {/* 全选按钮 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
                >
                  {selectedCharacters.length === characters.length ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  全选
                </button>
                <span className="text-sm text-slate-400">
                  ({selectedCharacters.length}/{characters.length})
                </span>
              </div>

              <div className="grid gap-4">
                {characters.map((c) => (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between rounded-xl border bg-white p-4 dark:border-slate-700 dark:bg-slate-800 ${
                      selectedCharacters.includes(c.id)
                        ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/10"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleCharacterSelection(c.id)}
                        className="text-slate-400 hover:text-blue-600"
                      >
                        {selectedCharacters.includes(c.id) ? (
                          <CheckSquare className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {c.nickname}
                        </div>
                        <div className="text-sm text-slate-500">
                          所有者：{c.user?.nickname || c.user?.email || "未知"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setChatModal({
                            isOpen: true,
                            characterId: c.id,
                            characterName: c.nickname,
                          })
                        }
                        title="查看聊天记录"
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          setDocumentsModal({
                            isOpen: true,
                            characterId: c.id,
                            characterName: c.nickname,
                          })
                        }
                        title="查看源文档"
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <Link
                        href={`/chat/${c.id}`}
                        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
                      >
                        <Sparkles className="h-4 w-4" />
                        查看
                      </Link>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          c.analysisStatus === "DONE"
                            ? "bg-green-100 text-green-600"
                            : c.analysisStatus === "RUNNING"
                              ? "bg-yellow-100 text-yellow-600"
                              : c.analysisStatus === "FAILED"
                                ? "bg-red-100 text-red-600"
                                : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {c.analysisStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* 数据统计 */}
      {tab === "stats" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          {/* 导出按钮 */}
          <div className="flex justify-end">
            <button
              onClick={handleExportStats}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              导出 Excel
            </button>
          </div>

          {/* 概览卡片 */}
          {stats && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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

          {/* 图表 */}
          {stats && (
            <div className="grid gap-8 lg:grid-cols-2">
              {/* 用户增长趋势 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
                <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
                  用户增长趋势（近30天）
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.slice(5)}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 角色创建趋势 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
                <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
                  角色创建趋势（近30天）
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.characterGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.slice(5)}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 分析状态分布 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 lg:col-span-2">
                <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
                  分析状态分布
                </h3>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analysisStatsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analysisStatsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
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
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {item.name}: {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* 模态框 */}
      <ChatModal
        characterId={chatModal.characterId}
        characterName={chatModal.characterName}
        isOpen={chatModal.isOpen}
        onClose={() => setChatModal({ isOpen: false, characterId: "", characterName: "" })}
      />
      <DocumentsModal
        characterId={documentsModal.characterId}
        characterName={documentsModal.characterName}
        isOpen={documentsModal.isOpen}
        onClose={() => setDocumentsModal({ isOpen: false, characterId: "", characterName: "" })}
      />
    </main>
  );
}
