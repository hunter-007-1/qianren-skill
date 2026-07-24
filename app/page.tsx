"use client";

import Link from "next/link";
import { Character } from "@/lib/types";
import { CharacterCard } from "@/components/character-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Plus, Sparkles, LayoutGrid, ArrowRight, Lightbulb, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { toast, Toaster } from "react-hot-toast";
import { CharacterCardSkeleton } from "@/components/ui/skeleton";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const { data: characters, mutate, isLoading } = useSWR<Character[]>("/api/characters", fetcher, {
    refreshInterval: (data) => {
      const hasRunning = data?.some((c: Character) => c.analysisStatus === "RUNNING");
      return hasRunning ? 3000 : 0;
    },
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
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
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <Toaster position="top-right" />
      
      <header className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <Sparkles className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Qianren Skill</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Digital Soul Lab</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/characters/new"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-all hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-blue-600 dark:hover:text-white sm:h-auto sm:w-auto sm:px-4 sm:py-2 sm:text-sm sm:font-bold"
            aria-label="创建新角色"
          >
            <Plus className="h-5 w-5 sm:mr-2 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">创建角色</span>
          </Link>
        </div>
      </header>

      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-8 shadow-2xl sm:p-12"
        aria-labelledby="hero-title"
      >
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-600/20 blur-[100px]" aria-hidden="true" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-cyan-600/10 blur-[100px]" aria-hidden="true" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-400 backdrop-blur-md">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            AI Persona Generator
          </div>
          <h1 id="hero-title" className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            赋予聊天记录 <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">第二次生命</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-300">
            通过深度学习分析历史对话，还原真实的人格特质、语言风格与情感模式，构建可永久保存的数字灵魂。
          </p>
          <div className="mt-10">
            <Link
              href="/characters/new"
              className="group inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]"
              aria-label="创建新角色"
            >
              <span>+ 创建新角色</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </motion.section>

      <section className="space-y-6" aria-labelledby="characters-title">
        <div className="flex items-end justify-between px-2">
          <div className="flex items-center gap-3">
            <LayoutGrid className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <div>
              <h2 id="characters-title" className="text-2xl font-bold text-slate-900 dark:text-white">数字化身库</h2>
              <p className="mt-0.5 text-sm text-slate-500">管理你的数字画像与对话记录</p>
            </div>
          </div>
          {characters && (
            <div className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-black text-slate-500 dark:bg-slate-800">
              {characters.length} CHARACTERS
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="status" aria-label="加载中">
            {[...Array(4)].map((_, i) => (
              <CharacterCardSkeleton key={i} />
            ))}
          </div>
        ) : !characters || characters.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex min-h-[400px] flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white/50 p-12 text-center dark:border-slate-800 dark:bg-slate-900/20"
            role="status"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 text-4xl shadow-sm dark:bg-slate-800">
              <User className="h-10 w-10 text-slate-300" aria-hidden="true" />
            </div>
            <h3 className="mt-6 text-lg font-bold text-slate-900 dark:text-white">暂无角色数据</h3>
            <p className="mt-2 max-w-xs text-sm text-slate-500">上传聊天记录或文字资料，即可开始生成你的第一个 AI 数字化身。</p>
            <Link href="/characters/new" className="mt-8 flex items-center gap-2 text-sm font-black text-blue-600 hover:text-blue-700">
              去创建一个 <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
                  staggerChildren: 0.1
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

      <div className="mt-8 text-center">
        <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <Lightbulb className="h-3 w-3" aria-hidden="true" />
          提示：上传的聊天记录越多，分析结果越准确
        </p>
      </div>
    </main>
  );
}