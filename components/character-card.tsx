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
import { getContrastColor } from "@/lib/color-utils";

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
      color: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
      dot: "bg-emerald-500",
      icon: <ShieldCheck className="h-3.5 w-3.5" />,
    },
    RUNNING: {
      label: "正在分析",
      color: "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
      dot: "bg-amber-500 animate-pulse",
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    },
    FAILED: {
      label: "分析失败",
      color: "text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
      dot: "bg-rose-500",
      icon: <AlertCircle className="h-3.5 w-3.5" />,
    },
    NOT_STARTED: {
      label: "等待分析",
      color: "text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
      dot: "bg-slate-400",
      icon: <Clock className="h-3.5 w-3.5" />,
    },
  };

  const config = statusConfig[character.analysisStatus];

  return (
    <>
      <motion.article
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/20"
      >
        {/* Card header with avatar */}
        <div className="p-6 pb-0">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-2 ring-slate-100 dark:bg-slate-800 dark:ring-slate-800">
              {character.avatarUrl ? (
                <img
                  src={character.avatarUrl}
                  alt={character.nickname}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-xl font-black text-white">
                  {character.nickname[0]}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {character.nickname}
              </h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                <User className="h-3 w-3" />
                {new Date(character.createdAt).toLocaleDateString("zh-CN")}
              </p>
            </div>
          </div>
        </div>

        {/* Status badge and tags */}
        <div className="px-6 pt-4 flex flex-wrap gap-1.5">
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${config.color}`}
          >
            <div className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
            {config.label}
          </div>
          {character.characterTags?.map((ct) => (
            <span
              key={ct.tag.id}
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ 
                backgroundColor: ct.tag.color,
                color: getContrastColor(ct.tag.color)
              }}
            >
              {ct.tag.name}
            </span>
          ))}
        </div>

        {/* Action buttons */}
        <div className="p-6 pt-4">
          <div className="grid grid-cols-2 gap-2.5">
            <Link
              href={`/analysis/${character.id}`}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750 dark:hover:border-slate-600"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              查看画像
            </Link>
            <Link
              href={`/chat/${character.id}`}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all ${
                character.analysisStatus === "DONE"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98]"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              开启聊天
            </Link>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-100 px-6 py-4 dark:border-slate-800/60">
          <div className="flex items-center justify-center gap-6">
            <Link
              href={`/characters/${character.id}/edit`}
              className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400"
            >
              <Pencil className="h-3 w-3" />
              编辑
            </Link>
            <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400"
            >
              <Trash2 className="h-3 w-3" />
              删除
            </button>
          </div>
        </div>
      </motion.article>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        type="danger"
        title="删除确认"
        description={`确定要删除"${character.nickname}"吗？此操作将永久移除所有相关的聊天记录和分析报告，且无法恢复。`}
        confirmText="确认删除"
      />
    </>
  );
}
