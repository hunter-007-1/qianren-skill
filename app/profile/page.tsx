"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  User as UserIcon,
  Edit3,
  Shield,
  Settings,
  MessageSquare,
  Loader2,
  Brain,
  Calendar,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { useUser } from "@/lib/use-user";

interface UserProfile {
  id: string;
  email: string;
  nickname: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  _count: { characters: number };
}

interface UserCharacter {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  relationship: string | null;
  analysisStatus: string;
  createdAt: string;
  _count: { chatMessages: number };
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: authUser, isLoading: userLoading } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [characters, setCharacters] = useState<UserCharacter[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingCharacters, setLoadingCharacters] = useState(true);

  useEffect(() => {
    if (!userLoading && !authUser) {
      router.push("/login");
    }
  }, [authUser, userLoading, router]);

  useEffect(() => {
    if (authUser) {
      fetch("/api/user/profile")
        .then((res) => res.json())
        .then((data) => {
          setProfile(data);
          setLoadingProfile(false);
        })
        .catch(() => setLoadingProfile(false));

      fetch("/api/user/characters")
        .then((res) => res.json())
        .then((data) => {
          setCharacters(data);
          setLoadingCharacters(false);
        })
        .catch(() => setLoadingCharacters(false));
    }
  }, [authUser]);

  if (userLoading || !authUser || loadingProfile || !profile) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Loading...
        </p>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <Toaster position="top-right" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </Link>
      </motion.div>

      {/* User Info Card */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white shadow-xl mb-8 dark:from-slate-950 dark:to-slate-900"
      >
        <div className="flex items-center gap-6">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-3xl bg-white/10 ring-4 ring-white/5 shadow-2xl">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.nickname || "User"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl font-black text-blue-400">
                {(profile.nickname || profile.email)[0].toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              {profile.nickname || "未设置昵称"}
            </h1>
            <p className="mt-1 text-sm text-slate-400">{profile.email}</p>
            <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                注册时间: {new Date(profile.createdAt).toLocaleDateString("zh-CN")}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                创建角色: {profile._count?.characters ?? 0} 个
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Menu Items */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-[2rem] bg-white border border-slate-200 shadow-sm mb-8 dark:bg-slate-900 dark:border-slate-800 overflow-hidden"
      >
        <Link
          href="/profile/edit"
          className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/20">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">编辑个人资料</h3>
              <p className="text-sm text-slate-500">修改昵称、头像等信息</p>
            </div>
          </div>
          <ArrowLeft className="h-5 w-5 text-slate-400 rotate-180" />
        </Link>

        <Link
          href="/profile/security"
          className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">账号安全</h3>
              <p className="text-sm text-slate-500">修改密码、登录安全</p>
            </div>
          </div>
          <ArrowLeft className="h-5 w-5 text-slate-400 rotate-180" />
        </Link>

        <Link
          href="/profile/settings"
          className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-900/20">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">偏好设置</h3>
              <p className="text-sm text-slate-500">主题切换等设置</p>
            </div>
          </div>
          <ArrowLeft className="h-5 w-5 text-slate-400 rotate-180" />
        </Link>
      </motion.section>

      {/* My Characters */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            我的角色
          </h2>
          <Link
            href="/characters/new"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
          >
            创建新角色
          </Link>
        </div>

        {loadingCharacters ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : characters.length === 0 ? (
          <div className="rounded-[2rem] bg-white border border-slate-200 p-12 text-center dark:bg-slate-900 dark:border-slate-800">
            <Brain className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              还没有创建角色
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              创建你的第一个数字灵魂，开始对话吧
            </p>
            <Link
              href="/characters/new"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
            >
              创建角色
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {characters.map((char) => (
              <Link
                key={char.id}
                href={`/chat/${char.id}`}
                className="group rounded-[2rem] bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700"
              >
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                    {char.avatarUrl ? (
                      <img
                        src={char.avatarUrl}
                        alt={char.nickname}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-black text-blue-600">
                        {char.nickname[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate">
                      {char.nickname}
                    </h3>
                    <p className="text-sm text-slate-500 truncate">
                      {char.relationship || "未设置关系"}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <span className={`rounded-full px-2 py-0.5 ${
                        char.analysisStatus === "DONE"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                      }`}>
                        {char.analysisStatus === "DONE" ? "已分析" : "待分析"}
                      </span>
                      <span>{char._count.chatMessages} 条消息</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.section>
    </main>
  );
}
