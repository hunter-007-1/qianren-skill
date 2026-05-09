"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import {
  ArrowLeft,
  Sparkles,
  MessageSquare,
  Database,
  Settings,
  User,
  Heart,
  MessageCircle,
  Brain,
  History,
  ChevronDown,
  ChevronUp,
  Loader2,
  Gem,
  Languages,
  Zap,
  Users,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Character, AnalysisResult, analysisSchema } from "@/lib/types";

export default function AnalysisPage() {
  const { id } = useParams();
  const router = useRouter();

  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/characters/${id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "加载失败");
      setCharacter(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  // 轮询分析状态
  useEffect(() => {
    if (character?.analysisStatus === "RUNNING") {
      const interval = setInterval(() => {
        void load();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [character?.analysisStatus, load]);

  const runAnalysis = async () => {
    try {
      const response = await fetch(`/api/analysis/${id}`, { method: "POST" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "分析失败");
      }

      toast.success("AI 深度分析已开启");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "分析失败");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Loading Report...
        </p>
      </div>
    );
  }

  if (!character) return null;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <Toaster position="top-right" />

      {/* Header Area */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6 rounded-[2.5rem] bg-slate-900 p-8 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between lg:p-10 dark:bg-slate-950"
      >
        <div className="flex items-center gap-6">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-3xl bg-white/10 ring-4 ring-white/5 shadow-2xl">
            {character.avatarUrl ? (
              <img
                src={character.avatarUrl}
                alt={character.nickname}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-black text-blue-400">
                {character.nickname[0]}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight">
                {character.nickname}
              </h1>
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  character.analysisStatus === "DONE"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-blue-500/20 text-blue-400"
                }`}
              >
                {character.analysisStatus === "DONE"
                  ? "画像就绪"
                  : character.analysisStatus === "RUNNING"
                    ? "深度分析中"
                    : "等待分析"}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-400">
              基于 {character.sourceDocuments?.length ?? 0}{" "}
              份原始资料生成的数字人格报告
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Link
            href={`/chat/${id}`}
            className={`flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-black transition-all ${
              character.analysisStatus === "DONE"
                ? "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/30 active:scale-95"
                : "bg-white/5 text-slate-600 cursor-not-allowed"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>进入聊天室</span>
          </Link>
          <Link
            href="/"
            className="rounded-2xl bg-white/5 px-6 py-3.5 text-sm font-bold text-slate-300 hover:bg-white/10 transition-colors"
          >
            返回列表
          </Link>
        </div>
      </motion.section>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Left: Main Analysis */}
        <div className="lg:col-span-8 space-y-8">
          {character.analysisStatus !== "DONE" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex min-h-[500px] flex-col items-center justify-center rounded-[3rem] bg-white border border-slate-200 shadow-sm p-12 text-center dark:bg-slate-900 dark:border-slate-800"
            >
              <div
                className={`relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-blue-50 text-5xl dark:bg-blue-900/20`}
              >
                {character.analysisStatus === "RUNNING" ? (
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                ) : (
                  <Brain className="h-12 w-12 text-blue-600" />
                )}
              </div>
              <h3 className="mt-8 text-2xl font-black text-slate-900 dark:text-white">
                {character.analysisStatus === "RUNNING"
                  ? "AI 正在构建数字灵魂..."
                  : "待生成的数字化身"}
              </h3>
              <p className="mt-4 max-w-sm text-sm font-medium text-slate-500 leading-relaxed dark:text-slate-400">
                {character.analysisStatus === "RUNNING"
                  ? "系统正在深度阅读每一份聊天记录，通过语言模式、情感共鸣与记忆碎片还原真实的人格特质。这通常需要 10-30 秒。"
                  : "点击下方按钮，我们将利用大语言模型对您上传的原始资料进行多维度结构化分析，构建详细的数字人格报告。"}
              </p>
              {character.analysisStatus !== "RUNNING" && (
                <button
                  onClick={runAnalysis}
                  className="group mt-10 flex items-center gap-3 rounded-full bg-slate-900 px-10 py-5 text-sm font-black text-white transition-all hover:bg-blue-600 hover:shadow-2xl hover:shadow-blue-600/20 active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-blue-500 dark:hover:text-white"
                >
                  <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
                  开启深度画像分析
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              className="grid gap-6 sm:grid-cols-2"
              initial="hidden"
              animate="show"
              variants={{
                show: { transition: { staggerChildren: 0.1 } },
              }}
            >
              <ResultCard
                title="人格特质 (Persona)"
                icon={<User className="h-5 w-5" />}
                data={character.analysis?.persona}
                color="blue"
              />
              <ResultCard
                title="核心记忆 (Memories)"
                icon={<Gem className="h-5 w-5" />}
                data={character.analysis?.memories}
                color="indigo"
              />
              <ResultCard
                title="说话风格 (Speaking Style)"
                icon={<Languages className="h-5 w-5" />}
                data={character.analysis?.speakingStyle}
                color="cyan"
              />
              <ResultCard
                title="情感模式 (Emotion Pattern)"
                icon={<Heart className="h-5 w-5" />}
                data={character.analysis?.emotionPattern}
                color="rose"
              />
              <div className="sm:col-span-2">
                <ResultCard
                  title="关系互动模式 (Relationship Pattern)"
                  icon={<Users className="h-5 w-5" />}
                  data={character.analysis?.relationshipPattern}
                  color="emerald"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Right: Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <section className="rounded-[2.5rem] bg-white border border-slate-200 p-8 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-slate-400" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                原始设定
              </h3>
            </div>
            <div className="mt-8 space-y-6">
              <InfoItem
                label="关系说明"
                value={character.relationship}
                icon={<Users className="h-3 w-3" />}
              />
              <InfoItem
                label="时间跨度"
                value={character.timeframe}
                icon={<History className="h-3 w-3" />}
              />
              <InfoItem
                label="背景设定"
                value={character.background}
                icon={<Database className="h-3 w-3" />}
              />
              <InfoItem
                label="主观印象"
                value={character.impression}
                icon={<Brain className="h-3 w-3" />}
              />
            </div>
            <Link
              href={`/characters/${id}/edit`}
              className="group mt-10 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-50 py-4 text-xs font-black text-slate-600 transition-all hover:bg-slate-100 hover:text-blue-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-blue-400"
            >
              修改基础设定
            </Link>
          </section>

          <section className="rounded-[2.5rem] bg-slate-50 border border-slate-200 p-8 dark:bg-slate-900/50 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-slate-400" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                数据源文档
              </h3>
            </div>
            <div className="mt-8 space-y-3">
              {character.sourceDocuments?.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-2xl bg-white p-4 border border-slate-100 shadow-sm transition-transform hover:scale-[1.02] dark:bg-slate-800 dark:border-slate-700"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-700 dark:text-slate-300">
                      {doc.filename}
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      {doc.fileType}
                    </p>
                  </div>
                  <span className="ml-3 rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-mono font-black text-slate-400 dark:bg-slate-900">
                    {(doc.content.length / 1000).toFixed(1)}K
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function ResultCard({
  title,
  icon,
  data,
  color,
}: {
  title: string;
  icon: React.ReactNode;
  data: unknown;
  color: "blue" | "indigo" | "cyan" | "rose" | "emerald";
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const colorMap = {
    blue: "border-blue-100 bg-blue-50/20 text-blue-600 dark:border-blue-900/30 dark:bg-blue-900/10 dark:text-blue-400",
    indigo:
      "border-indigo-100 bg-indigo-50/20 text-indigo-600 dark:border-indigo-900/30 dark:bg-indigo-900/10 dark:text-indigo-400",
    cyan: "border-cyan-100 bg-cyan-50/20 text-cyan-600 dark:border-cyan-900/30 dark:bg-cyan-900/10 dark:text-cyan-400",
    rose: "border-rose-100 bg-rose-50/20 text-rose-600 dark:border-rose-900/30 dark:bg-rose-900/10 dark:text-rose-400",
    emerald:
      "border-emerald-100 bg-emerald-50/20 text-emerald-600 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-400",
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
      }}
      className="group flex flex-col rounded-[2.5rem] bg-white border border-slate-200 p-8 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700"
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm border ${colorMap[color]}`}
        >
          {icon}
        </div>
        <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
          {title}
        </h3>
      </div>

      <div
        className={`mt-6 space-y-4 overflow-hidden transition-all duration-500 ${isExpanded ? "max-h-[3000px]" : "max-h-[220px]"}`}
      >
        {Array.isArray(data) ? (
          <ul className="space-y-4">
            {data.map((item, i) => (
              <li
                key={i}
                className="flex gap-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400"
              >
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300 dark:bg-slate-700`}
                />
                <span className="flex-1">
                  {typeof item === "string" ? (
                    item
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(item as object).map(([k, v]) => (
                        <div key={k}>
                          <span className="text-[10px] font-black uppercase text-slate-400 mr-2">
                            {k}:
                          </span>
                          <span>{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : typeof data === "object" && data !== null ? (
          <div className="space-y-6">
            {Object.entries(data).map(([key, value]) => (
              <div key={key}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {key}
                </p>
                <div className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {Array.isArray(value) ? (
                    <div className="flex flex-wrap gap-2">
                      {value.map((v, i) => (
                        <span
                          key={i}
                          className="rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        >
                          {String(v)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    String(value)
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {String(data || "数据正在计算中...")}
          </p>
        )}
      </div>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="group/btn mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-blue-600"
      >
        {isExpanded ? (
          <>
            收起报告{" "}
            <ChevronUp className="h-3 w-3 transition-transform group-hover/btn:-translate-y-0.5" />
          </>
        ) : (
          <>
            查看完整报告{" "}
            <ChevronDown className="h-3 w-3 transition-transform group-hover/btn:translate-y-0.5" />
          </>
        )}
      </button>
    </motion.div>
  );
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 dark:bg-slate-800">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {label}
        </p>
        <p className="mt-1 truncate text-sm font-bold text-slate-700 dark:text-slate-300">
          {value || "未填写"}
        </p>
      </div>
    </div>
  );
}
