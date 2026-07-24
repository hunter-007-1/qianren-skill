"use client";

import { useState, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

/**
 * 聊天输入框组件
 */
export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "输入消息...",
  maxLength = 2000,
}: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    const content = input.trim();
    if (!content || disabled) return;

    onSend(content);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const characterCount = input.length;
  const isNearLimit = characterCount > maxLength * 0.8;

  return (
    <div className="space-y-2">
      <div className="relative flex items-center gap-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, maxLength))}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          aria-label="消息输入框"
          aria-describedby="character-count"
          className="flex-1 rounded-2xl border-2 border-slate-200 bg-white px-6 py-4 text-sm font-medium !text-slate-900 outline-none transition-all focus:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900 dark:!text-white dark:focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          aria-label="发送消息"
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/20 transition-all hover:bg-blue-500 disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
        >
          <Send className="h-5 w-5" />
        </motion.button>
      </div>

      {/* 字数统计 */}
      {characterCount > 0 && (
        <div
          id="character-count"
          className="text-right"
          role="status"
          aria-live="polite"
        >
          <span
            className={`text-xs font-medium ${
              isNearLimit
                ? "text-amber-600 dark:text-amber-400"
                : "text-slate-400 dark:text-slate-500"
            }`}
          >
            {characterCount} / {maxLength}
          </span>
        </div>
      )}
    </div>
  );
}