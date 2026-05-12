"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save, Camera } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { useUser } from "@/lib/use-user";
import { mutate } from "swr";

export default function ProfileEditPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useUser();
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
    if (user) {
      setNickname(user.nickname || "");
      setAvatarUrl(user.avatarUrl);
    }
  }, [user, userLoading, router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("头像图片不能超过 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      toast.error("昵称不能为空");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim(), avatarUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存失败");
      await mutate("/api/user/profile");
      toast.success("保存成功");
      router.push("/profile");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (userLoading || !user) {
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
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <Toaster position="top-right" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          返回个人中心
        </Link>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-[2rem] bg-white border border-slate-200 p-8 shadow-sm dark:bg-slate-900 dark:border-slate-800"
      >
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-8">
          编辑个人资料
        </h1>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            <div className="h-32 w-32 overflow-hidden rounded-3xl bg-slate-100 dark:bg-slate-800 ring-4 ring-slate-200 dark:ring-slate-700">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl font-black text-blue-600">
                  {(nickname || user.email)[0].toUpperCase()}
                </div>
              )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="h-8 w-8 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>
          <p className="mt-3 text-sm text-slate-500">点击更换头像</p>
        </div>

        {/* Nickname */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            昵称
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="设置你的昵称"
            className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500"
          />
        </div>

        {/* Email (readonly) */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            邮箱
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
          />
          <p className="mt-1 text-xs text-slate-400">邮箱地址不可修改</p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          保存修改
        </button>
      </motion.section>
    </main>
  );
}
