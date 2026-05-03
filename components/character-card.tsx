"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  MessageSquare,
  Pencil,
  Trash2,
  Clock,
  User,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Modal } from "./modal";
import { Character } from "@/lib/types";

interface CharacterCardProps {
  character: Character;
  onDelete: (id: string) => Promise<void>;
}

export function CharacterCard({ character, onDelete }: CharacterCardProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(character.id);
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const statusConfig = {
    DONE: {
      label: "画像就绪",
      color:
        "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400",
      dot: "bg-emerald-500",
      icon: <ShieldCheck className="h-3 w-3" />,
    },
    RUNNING: {
      label: "正在分析",
      color:
        "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400",
      dot: "bg-amber-500 animate-pulse",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
    },
    FAILED: {
      label: "分析失败",
      color: "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400",
      dot: "bg-rose-500",
      icon: <AlertCircle className="h-3 w-3" />,
    },
    NOT_STARTED: {
      label: "等待分析",
      color: "text-slate-500 bg-slate-50 dark:bg-slate-800 dark:text-slate-400",
      dot: "bg-slate-400",
      icon: <Clock className="h-3 w-3" />,
    },
  };

  const config = statusConfig[character.analysisStatus];

  return (
    <>
      <motion.article
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        className="group relative flex flex-col rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center gap-5">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-4 ring-slate-50 dark:bg-slate-800 dark:ring-slate-800/50">
            {character.avatarUrl ? (
              <img
                src={character.avatarUrl}
                alt={character.nickname}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-black text-white">
                {character.nickname[0]}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xl font-black text-slate-900 tracking-tight dark:text-white">
              {character.nickname}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <User className="h-3 w-3" />
              AUTHENTICATED {new Date(character.createdAt).getFullYear()}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <div
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${config.color}`}
          >
            <div className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
            {config.label}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <Link
            href={`/analysis/${character.id}`}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 py-3 text-xs font-black uppercase tracking-widest text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <BarChart3 className="h-4 w-4" />
            查看画像
          </Link>
          <Link
            href={`/chat/${character.id}`}
            className={`flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black uppercase tracking-widest transition-all ${
              character.analysisStatus === "DONE"
                ? "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/30"
                : "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            开启聊天
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 dark:border-slate-800/50">
          <Link
            href={`/characters/${character.id}/edit`}
            className="flex items-center justify-center gap-2 rounded-xl py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
          >
            <Pencil className="h-3 w-3" />
            修改资料
          </Link>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400"
          >
            <Trash2 className="h-3 w-3" />
            删除角色
          </button>
        </div>
      </motion.article>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        type="danger"
        title="删除确认"
        description={`确定要删除“${character.nickname}”吗？此操作将永久移除所有相关的聊天记录和分析报告，且无法恢复。`}
        confirmText="确认删除"
      />
    </>
  );
}
