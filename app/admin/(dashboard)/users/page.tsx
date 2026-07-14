"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { User, Loader2, Search } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { UserActions } from "@/components/admin/user-actions";
import { useAdminUser } from "@/lib/use-admin";

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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminUsersPage() {
  const { data: me } = useAdminUser();
  const { data: users, mutate, isLoading } = useSWR<UserData[]>("/api/admin/users", fetcher);
  const [currentUserId, setCurrentUserId] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (me?.id) setCurrentUserId(me.id);
  }, [me]);

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.nickname && u.nickname.toLowerCase().includes(q))
    );
  }, [users, query]);

  return (
    <>
      <AdminHeader
        title="用户管理"
        subtitle="角色权限、禁用与模拟登录"
        email={me?.email}
        nickname={me?.nickname}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索邮箱或昵称..."
              className="w-full rounded-xl border border-slate-700 bg-[#12182a] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#00D4FF]"
            />
          </div>
          <span className="text-sm text-slate-500">
            {filtered.length} / {users?.length ?? 0}
          </span>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            加载中...
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="py-12 text-center text-slate-500">暂无用户</div>
        )}

        <div className="grid gap-3">
          {filtered.map((u) => (
            <div
              key={u.id}
              className={`flex items-center justify-between rounded-xl border bg-[#12182a] p-4 ${
                u.isDisabled
                  ? "border-red-800/50 bg-red-950/20"
                  : "border-slate-800"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    u.isDisabled ? "bg-red-900/40" : "bg-slate-800"
                  }`}
                >
                  <User
                    className={`h-5 w-5 ${
                      u.isDisabled ? "text-red-400" : "text-slate-400"
                    }`}
                  />
                </div>
                <div>
                  <div className="font-bold text-white">
                    {u.nickname || u.email}
                    {u.isAdmin && (
                      <span className="ml-2 rounded-full bg-cyan-500/15 px-2 py-0.5 text-xs text-[#00D4FF]">
                        管理员
                      </span>
                    )}
                    {u.isDisabled && (
                      <span className="ml-2 rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
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
                  onUpdate={() => mutate()}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
