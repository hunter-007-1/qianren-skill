"use client";

import Link from "next/link";
import { Character } from "@/lib/types";
import { CharacterCard } from "@/components/character-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Plus, Sparkles, LayoutGrid, ArrowRight, Lightbulb, User, Zap, Shield, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { toast, Toaster } from "react-hot-toast";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const { data: characters, mutate, isLoading } = useSWR<Character[]>("/api/characters", fetcher, {
    refreshInterval: (data) => {
      const hasRunning = data?.some((c: Character) => c.analysisStatus === "RUNNING");
      return hasRunning ? 3000 : 0;
    },
  });

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/characters/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
      await mutate();
      toast.success("角色已删除");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败");
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Toaster position="top-right" />
      
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 shadow-2xl sm:p-12"
      >
        {/* Decorative orbs */}
        <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-indigo-500/15 blur-[120px]" />
        <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/5 blur-[80px]" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-300 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            AI Persona Generator
          </div>
          
          <h1 className="mt-8 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            赋予聊天记录
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              第二次生命
            </span>
          </h1>
          
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300/90">
            通过深度学习分析历史对话，还原真实的人格特质、语言风格与情感模式，构建可永久保存的数字灵魂。
          </p>

          {/* Feature pills */}
          <div className="mt-8 flex flex-wrap gap-3">
            {[
              { icon: Zap, label: "AI 深度分析" },
              { icon: Shield, label: "隐私安全" },
              { icon: Clock, label: "永久保存" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
                <item.icon className="h-3.5 w-3.5 text-indigo-400" />
                {item.label}
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link
              href="/characters/new"
              className="group inline-flex items-center gap-2.5 rounded-2xl bg-white px-8 py-4 text-sm font-bold text-slate-900 shadow-xl shadow-black/20 transition-all hover:bg-slate-50 hover:shadow-2xl active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              创建新角色
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Characters Section */}
      <section className="space-y-8">
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                数字化身库
              </h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                管理你的数字画像与对话记录
              </p>
            </div>
          </div>
          {characters && characters.length > 0 && (
            <div className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {characters.length} 个角色
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800/50" />
            ))}
          </div>
        ) : !characters || characters.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-gradient-to-b from-white to-slate-50/50 p-12 text-center dark:border-slate-800 dark:from-slate-900/50 dark:to-slate-950/50"
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-100 shadow-inner dark:bg-slate-800">
              <User className="h-12 w-12 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="mt-8 text-xl font-bold text-slate-900 dark:text-white">
              暂无角色数据
            </h3>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              上传聊天记录或文字资料，即可开始生成你的第一个 AI 数字化身。系统将自动分析并提取人格特征。
            </p>
            <Link 
              href="/characters/new" 
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 hover:shadow-xl active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              创建第一个角色
            </Link>
          </motion.div>
        ) : (
          <motion.div 
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            initial="hidden"
            animate="show"
            variants={{
              show: {
                transition: {
                  staggerChildren: 0.08
                }
              }
            }}
          >
            <AnimatePresence mode="popLayout">
              {characters.map((item) => (
                <CharacterCard 
                  key={item.id} 
                  character={item} 
                  onDelete={handleDelete} 
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      {/* Footer tip */}
      <div className="text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-xs text-slate-400 dark:bg-slate-900 dark:text-slate-500">
          <Lightbulb className="h-3.5 w-3.5" />
          提示：上传的聊天记录越多，分析结果越准确
        </p>
      </div>
    </main>
  );
}
