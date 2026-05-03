"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
  useRef,
  type KeyboardEvent,
} from "react";
import { Toaster, toast } from "react-hot-toast";
import {
  Send,
  Trash2,
  RotateCcw,
  Sparkles,
  Info,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CharacterSummary } from "@/components/character-summary";
import { Character, ChatMessage } from "@/lib/types";

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [character, setCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const load = useCallback(async () => {
    try {
      const [charRes, msgRes] = await Promise.all([
        fetch(`/api/characters/${id}`),
        fetch(`/api/chat/${id}`),
      ]);

      const charData = await charRes.json();
      const msgData = await msgRes.json();

      if (!charRes.ok) throw new Error(charData.error ?? "角色加载失败");
      if (!charData.analysis) throw new Error("请先完成人物分析");

      setCharacter(charData);
      setMessages(msgData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "加载失败");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const send = async () => {
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setInput("");
    try {
      const response = await fetch(`/api/chat/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "发送失败");

      setMessages((prev) => [...prev, payload.user, payload.assistant]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "发送失败");
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const clearSession = async () => {
    if (!confirm("确定要清空所有对话记录吗？")) return;
    try {
      const res = await fetch(`/api/chat/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("清空失败");
      setMessages([]);
      toast.success("会话已清空");
    } catch (error) {
      toast.error("清空失败");
    }
  };

  const regenerate = async () => {
    if (messages.length === 0 || sending) return;
    setSending(true);
    try {
      const response = await fetch(`/api/chat/${id}/regenerate`, {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "重新生成失败");
      setMessages((prev) => [...prev.slice(0, -1), payload]);
    } catch (error) {
      toast.error("重新生成失败");
    } finally {
      setSending(false);
    }
  };

  if (!character) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-4 text-slate-400">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest">
          Initialising Connection...
        </p>
      </div>
    );
  }

  return (
    <main className="mx-auto flex h-[calc(100vh-64px)] w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 overflow-hidden">
      <Toaster position="top-right" />

      <div className="flex flex-1 gap-6 overflow-hidden relative">
        <aside
          className={`
          fixed inset-y-0 left-0 z-40 w-80 shrink-0 flex-col gap-6 bg-slate-50 p-6 transition-transform lg:static lg:flex lg:translate-x-0 dark:bg-slate-950
          ${showSidebar ? "translate-x-0" : "-translate-x-full"}
        `}
        >
          <section className="animate-fade-in flex flex-col items-center rounded-[2.5rem] bg-slate-900 p-8 text-center text-white shadow-xl dark:bg-slate-900/50">
            <div className="relative h-24 w-24 overflow-hidden rounded-3xl bg-white/10 ring-4 ring-white/5 shadow-2xl">
              {character.avatarUrl ? (
                <img
                  src={character.avatarUrl}
                  alt={character.nickname}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl font-black text-blue-400">
                  {character.nickname[0]}
                </div>
              )}
            </div>
            <h2 className="mt-4 text-xl font-black">{character.nickname}</h2>
            <p className="mt-1 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">
              Soul Authenticated
            </p>
            <Link
              href={`/analysis/${id}`}
              className="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
            >
              查看画像分析 <ChevronLeft className="h-3 w-3 rotate-180" />
            </Link>
          </section>

          <section className="flex-1 rounded-[2.5rem] bg-white border border-slate-200 p-8 shadow-sm overflow-y-auto dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-6">
              <Info className="h-4 w-4 text-slate-400" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                人格摘要
              </h3>
            </div>
            <CharacterSummary character={character} />
          </section>
        </aside>

        {showSidebar && (
          <div
            className="fixed inset-0 z-30 bg-slate-950/20 backdrop-blur-sm lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        <section className="flex flex-1 flex-col overflow-hidden rounded-[2.5rem] bg-white border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <header className="flex items-center justify-between border-b border-slate-100 px-8 py-5 dark:border-slate-800/50">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                title="查看人物摘要"
                className="lg:hidden p-2 rounded-xl bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              >
                <Info className="h-5 w-5" />
              </button>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white">
                  {character.nickname}
                </h3>
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                  Active Connection
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearSession}
                title="清空会话"
                className="p-2.5 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all dark:hover:bg-rose-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={regenerate}
                disabled={sending || messages.length === 0}
                title="重新生成"
                className="p-2.5 rounded-xl text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all dark:hover:bg-blue-600/10 disabled:opacity-20"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-8 overflow-y-auto p-8 scroll-smooth scrollbar-hide">
            <AnimatePresence mode="popLayout">
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex h-full flex-col items-center justify-center text-center opacity-40"
                >
                  <div className="h-20 w-20 flex items-center justify-center rounded-[2rem] bg-blue-50 dark:bg-blue-900/20 mb-6">
                    <Sparkles className="h-10 w-10 text-blue-600" />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white">
                    开启灵魂对话
                  </h4>
                  <p className="mt-2 max-w-xs text-sm font-medium text-slate-500 dark:text-slate-400">
                    AI 已经加载了 {character.nickname}{" "}
                    的所有特质，试着说点什么...
                  </p>
                </motion.div>
              ) : (
                messages.map((message) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex max-w-[85%] items-start gap-4 ${message.role === "user" ? "flex-row-reverse text-right" : "flex-row"}`}
                    >
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-2xl shadow-lg ring-2 ring-white dark:ring-slate-800">
                        {message.role === "user" ? (
                          character.userAvatarUrl ? (
                            <img
                              src={character.userAvatarUrl}
                              alt="User"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-blue-600 text-white font-black">
                              U
                            </div>
                          )
                        ) : character.avatarUrl ? (
                          <img
                            src={character.avatarUrl}
                            alt={character.nickname}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-900 text-blue-400 font-black">
                            {character.nickname[0]}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <div
                          className={`relative px-5 py-3.5 text-sm font-medium leading-relaxed shadow-sm transition-all ${
                            message.role === "user"
                              ? "bg-blue-600 text-white rounded-[1.5rem] rounded-tr-none shadow-blue-500/10"
                              : "bg-slate-50 text-slate-800 border border-slate-100 rounded-[1.5rem] rounded-tl-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                          }`}
                        >
                          {message.content}
                        </div>
                        <p
                          className={`text-[9px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600 ${message.role === "user" ? "text-right" : "text-left"}`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
              {sending && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    </div>
                    <div className="rounded-[1.5rem] rounded-tl-none bg-slate-50 border border-slate-100 px-6 py-3.5 text-sm text-slate-400 font-black uppercase tracking-widest animate-pulse dark:bg-slate-800 dark:border-slate-700">
                      Processing...
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          <footer className="border-t border-slate-100 p-6 lg:p-10 dark:border-slate-800/50">
            <div className="relative flex items-center gap-4">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={`与 ${character.nickname} 进行灵魂对话...`}
                className="flex-1 rounded-2xl border-2 border-slate-200 bg-white px-6 py-4 text-sm font-medium !text-slate-900 outline-none transition-all focus:border-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:!text-white dark:focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => void send()}
                disabled={sending || !input.trim()}
                title="发送消息"
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/20 transition-all hover:bg-blue-500 disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
              >
                <Send className="h-5 w-5" />
              </motion.button>
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 opacity-30">
              <div className="h-px w-12 bg-slate-300 dark:bg-slate-700" />
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                Encrypted Digital Soul Lab
              </p>
              <div className="h-px w-12 bg-slate-300 dark:bg-slate-700" />
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}
