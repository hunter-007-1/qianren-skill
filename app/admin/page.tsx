"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Sparkles, Users, User, Shield, ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";

interface UserData {
  id: string;
  email: string;
  nickname: string | null;
  isAdmin: boolean;
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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminPage() {
  const [tab, setTab] = useState<"users" | "characters">("users");
  const { data: users, mutate: mutateUsers } = useSWR<UserData[]>("/api/admin/users", fetcher);
  const { data: characters, mutate: mutateCharacters } = useSWR<CharacterData[]>("/api/admin/characters", fetcher);
  const [loading, setLoading] = useState(false);

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
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">管理员面板</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Admin Dashboard</p>
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
          <User className="h-4 w-4" />
          全部角色
        </button>
      </div>

      {tab === "users" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {(!users || users.length === 0) ? (
            <div className="text-center text-slate-500 py-12">暂无用户</div>
          ) : (
            <div className="grid gap-4">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                      <User className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {u.nickname || u.email}
                        {u.isAdmin && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">管理员</span>}
                      </div>
                      <div className="text-sm text-slate-500">{u.email}</div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500">
                    {u._count.characters} 个角色 · {new Date(u.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {tab === "characters" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {(!characters || characters.length === 0) ? (
            <div className="text-center text-slate-500 py-12">暂无数</div>
          ) : (
            <div className="grid gap-4">
              {characters.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{c.nickname}</div>
                      <div className="text-sm text-slate-500">
                        所有者：{c.user?.nickname || c.user?.email || "未知"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/chat/${c.id}`}
                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
                    >
                      <Sparkles className="h-4 w-4" />
                      查看
                    </Link>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      c.analysisStatus === "DONE" ? "bg-green-100 text-green-600" :
                      c.analysisStatus === "RUNNING" ? "bg-yellow-100 text-yellow-600" :
                      c.analysisStatus === "FAILED" ? "bg-red-100 text-red-600" :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      {c.analysisStatus}
                    </span>
                    <button
                      onClick={() => handleDeleteCharacter(c.id)}
                      disabled={loading}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </main>
  );
}