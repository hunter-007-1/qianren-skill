"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { ChatMessage } from "@/lib/types";

interface MessageBubbleProps {
  message: ChatMessage;
  avatarUrl?: string | null;
  userAvatarUrl?: string | null;
  nickname: string;
  isTyping?: boolean;
}

/**
 * 消息气泡组件
 */
export const MessageBubble = memo(function MessageBubble({
  message,
  avatarUrl,
  userAvatarUrl,
  nickname,
  isTyping,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      role="article"
      aria-label={`${isUser ? "你的消息" : `${nickname}的消息`}`}
    >
      <div
        className={`flex max-w-[85%] items-start gap-4 ${
          isUser ? "flex-row-reverse text-right" : "flex-row"
        }`}
      >
        {/* 头像 */}
        <div
          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-2xl shadow-lg ring-2 ring-white dark:ring-slate-800"
          role="img"
          aria-label={isUser ? "你的头像" : `${nickname}的头像`}
        >
          {isUser ? (
            userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt="你的头像"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-blue-600 text-white font-black">
                U
              </div>
            )
          ) : avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${nickname}的头像`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-900 text-blue-400 font-black">
              {nickname[0]}
            </div>
          )}
        </div>

        {/* 消息内容 */}
        <div className="space-y-1.5">
          <div
            className={`relative px-5 py-3.5 text-sm font-medium leading-relaxed shadow-sm transition-all ${
              isUser
                ? "bg-blue-600 text-white rounded-[1.5rem] rounded-tr-none shadow-blue-500/10"
                : "bg-slate-50 text-slate-800 border border-slate-100 rounded-[1.5rem] rounded-tl-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
            }`}
          >
            {isTyping ? (
              <span className="inline-flex items-center gap-2">
                <span className="animate-pulse">正在输入...</span>
              </span>
            ) : (
              message.content
            )}
          </div>
          <p
            className={`text-[9px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600 ${
              isUser ? "text-right" : "text-left"
            }`}
          >
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </motion.div>
  );
});