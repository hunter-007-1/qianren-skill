"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
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
  Download,
  Copy,
  Check,
  FileText,
  FileCode,
  FileDown,
  Search,
  X,
  Brain,
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
  const [typing, setTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [copied, setCopied] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchRole, setSearchRole] = useState<"all" | "user" | "assistant">("all");
  const [updatingMemory, setUpdatingMemory] = useState(false);
  const [exportingMemory, setExportingMemory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const filteredMessages = useMemo(() => {
    let result = messages;
    if (searchRole !== "all") {
      result = result.filter((m) => m.role === searchRole);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((m) => m.content.toLowerCase().includes(query));
    }
    return result;
  }, [messages, searchQuery, searchRole]);

  const displayMessages = showSearch ? filteredMessages : messages;

  const highlightText = useCallback(
    (text: string): React.ReactNode => {
      if (!searchQuery.trim()) return text;
      const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escaped})`, "gi");
      const parts = text.split(regex);
      return parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-yellow-200 dark:bg-yellow-900/50 rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          part
        )
      );
    },
    [searchQuery]
  );

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
  }, [messages, sending, typing]);

  const send = async () => {
    const content = input.trim();
    if (!content || sending) return;

    const optimisticUser: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content,
      createdAt: new Date(),
      characterId: id,
    };

    setInput("");
    setSending(true);
    setTyping(true);
    setMessages((prev) => [...prev, optimisticUser]);

    try {
      const response = await fetch(`/api/chat/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "发送失败");

      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== optimisticUser.id);
        return [...filtered, payload.user, payload.assistant];
      });
      setTyping(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "发送失败");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
      setInput(content);
      setTyping(false);
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
    setTyping(true);
    try {
      const response = await fetch(`/api/chat/${id}/regenerate`, {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "重新生成失败");
      setMessages((prev) => [...prev.slice(0, -1), payload]);
      setTyping(false);
    } catch (error) {
      toast.error("重新生成失败");
    } finally {
      setSending(false);
    }
  };

  const exportAsTxt = () => {
    if (!character || messages.length === 0) return;

    const lines = messages.map((msg) => {
      const time = new Date(msg.createdAt).toLocaleString("zh-CN");
      const sender = msg.role === "user" ? "我" : character.nickname;
      return `[${time}] ${sender}：${msg.content}`;
    });

    const header = `与 ${character.nickname} 的对话记录\n导出时间：${new Date().toLocaleString("zh-CN")}\n共 ${messages.length} 条消息\n${"=".repeat(40)}\n\n`;
    const text = header + lines.join("\n\n");

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${character.nickname}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("导出成功");
  };

  const copyToClipboard = async () => {
    if (!character || messages.length === 0) return;

    const lines = messages.map((msg) => {
      const sender = msg.role === "user" ? "我" : character.nickname;
      return `${sender}：${msg.content}`;
    });

    await navigator.clipboard.writeText(lines.join("\n\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("已复制到剪贴板");
  };

  const exportAsHtml = () => {
    if (!character || messages.length === 0) return;

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>与 ${character.nickname} 的对话记录</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; }
    .header h1 { font-size: 24px; margin-bottom: 8px; }
    .header p { font-size: 14px; opacity: 0.9; }
    .messages { padding: 20px; }
    .message { margin-bottom: 16px; display: flex; gap: 12px; }
    .message.user { flex-direction: row-reverse; }
    .avatar { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; flex-shrink: 0; }
    .message.user .avatar { background: #3b82f6; color: white; }
    .message.assistant .avatar { background: #1e293b; color: #818cf8; }
    .bubble { max-width: 70%; padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.6; }
    .message.user .bubble { background: #3b82f6; color: white; border-bottom-right-radius: 4px; }
    .message.assistant .bubble { background: #f1f5f9; color: #1e293b; border-bottom-left-radius: 4px; }
    .time { font-size: 11px; color: #94a3b8; margin-top: 4px; }
    .message.user .time { text-align: right; }
    .footer { text-align: center; padding: 20px; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>与 ${character.nickname} 的对话记录</h1>
      <p>导出时间：${new Date().toLocaleString("zh-CN")} · 共 ${messages.length} 条消息</p>
    </div>
    <div class="messages">
      ${messages.map(msg => `
        <div class="message ${msg.role}">
          <div class="avatar">${msg.role === "user" ? "我" : character.nickname[0]}</div>
          <div>
            <div class="bubble">${msg.content.replace(/\n/g, '<br>')}</div>
            <div class="time">${new Date(msg.createdAt).toLocaleString("zh-CN")}</div>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="footer">
      由千人智聊生成 · Digital Soul Lab
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${character.nickname}-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("HTML 导出成功");
  };

  const exportAsPdf = async () => {
    if (!character || messages.length === 0) return;

    // 动态加载 jsPDF
    const { default: jsPDF } = await import('jspdf');

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // 设置中文字体（使用内置字体）
    doc.setFont('helvetica');

    let y = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;

    // 标题
    doc.setFontSize(20);
    doc.setTextColor(99, 102, 241);
    doc.text(`Chat with ${character.nickname}`, margin, y);
    y += 10;

    // 导出信息
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`Export: ${new Date().toLocaleString("zh-CN")} | ${messages.length} messages`, margin, y);
    y += 5;

    // 分隔线
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // 消息内容
    for (const msg of messages) {
      const sender = msg.role === "user" ? "Me" : character.nickname;
      const time = new Date(msg.createdAt).toLocaleString("zh-CN");

      // 检查是否需要换页
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      // 发送者和时间
      doc.setFontSize(10);
      if (msg.role === "user") {
        doc.setTextColor(59, 130, 246);
      } else {
        doc.setTextColor(99, 102, 241);
      }
      doc.text(`[${time}] ${sender}:`, margin, y);
      y += 5;

      // 消息内容
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      const lines = doc.splitTextToSize(msg.content, maxWidth - 10);
      doc.text(lines, margin + 5, y);
      y += lines.length * 5 + 8;
    }

    // 页脚
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text('Digital Soul Lab', pageWidth / 2, 290, { align: 'center' });
    }

    doc.save(`chat-${character.nickname}-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("PDF 导出成功");
  };

  const generateSummary = async () => {
    if (messages.length === 0) return;
    setSummarizing(true);
    try {
      const res = await fetch(`/api/chat/${id}/summary`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "生成摘要失败");
      setSummary(data);
      setShowSummary(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "生成摘要失败");
    } finally {
      setSummarizing(false);
    }
  };

  const updateMemory = async () => {
    if (messages.length < 5) {
      toast.error("对话记录不足，至少需要 5 条消息");
      return;
    }
    setUpdatingMemory(true);
    try {
      const res = await fetch(`/api/chat/${id}/update-memory`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "记忆更新失败");
      const newCount = data.newMemories?.length ?? 0;
      const totalCount = data.memoryCount ?? 0;
      toast.success(
        (t) => (
          <div className="flex flex-col gap-1">
            <div className="font-bold">记忆更新完成！</div>
            <div className="text-sm">
              新增 {newCount} 条记忆，共 {totalCount} 条
            </div>
            <div className="text-xs text-slate-500">
              角色画像已同步更新
            </div>
          </div>
        ),
        { duration: 5000 }
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "记忆更新失败");
    } finally {
      setUpdatingMemory(false);
    }
  };

  const exportMemoryFile = async () => {
    if (!character) return;
    setExportingMemory(true);
    try {
      const res = await fetch(`/api/chat/${id}/memories`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "导出失败");

      const memories = data.memories || [];
      const nickname = data.nickname || character.nickname;

      // 生成 TXT 内容
      const grouped: Record<string, typeof memories> = {
        偏好: [],
        事件: [],
        情感: [],
        习惯: [],
        关系: [],
      };

      memories.forEach((m: any) => {
        const cat = grouped[m.category] ? m.category : "事件";
        grouped[cat].push(m);
      });

      const now = new Date().toLocaleString("zh-CN");
      let txt = `==========================================\n`;
      txt += `  ${nickname} 的记忆档案\n`;
      txt += `==========================================\n\n`;
      txt += `最后更新: ${now}\n`;
      txt += `记忆总数: ${memories.length} 条\n\n`;
      txt += `------------------------------------------\n`;
      txt += `  记忆概览\n`;
      txt += `------------------------------------------\n`;
      Object.entries(grouped).forEach(([cat, items]) => {
        txt += `  ${cat}: ${(items as any[]).length} 条\n`;
      });
      txt += `\n------------------------------------------\n`;
      txt += `  详细记忆\n`;
      txt += `------------------------------------------\n\n`;

      Object.entries(grouped).forEach(([cat, items]) => {
        if ((items as any[]).length > 0) {
          txt += `【${cat}】\n\n`;
          (items as any[])
            .sort((a, b) => b.importance - a.importance)
            .forEach((m, i) => {
              const sentimentText =
                m.sentiment === "positive"
                  ? "积极"
                  : m.sentiment === "negative"
                    ? "消极"
                    : "中性";
              const anchor = m.emotionalAnchor
                ? `\n    情感印记: ${m.emotionalAnchor}`
                : "";
              txt += `  ${i + 1}. ${m.content}\n`;
              txt += `     重要性: ${m.importance}/10 | 情感: ${sentimentText}${anchor}\n\n`;
            });
        }
      });

      txt += `==========================================\n`;
      txt += `  千人智聊 · 数字灵魂实验室\n`;
      txt += `==========================================\n`;

      // 下载文件
      const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `记忆档案-${nickname}-${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("记忆文件导出成功");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "导出失败");
    } finally {
      setExportingMemory(false);
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
                onClick={() => {
                  setShowSearch(!showSearch);
                  if (showSearch) {
                    setSearchQuery("");
                    setSearchRole("all");
                  }
                }}
                title="搜索聊天记录"
                className={`p-2.5 rounded-xl transition-all ${
                  showSearch
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-600/10"
                    : "text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-600/10"
                }`}
              >
                {showSearch ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              </button>
              <button
                onClick={updateMemory}
                disabled={updatingMemory || messages.length < 5}
                title="更新角色记忆"
                className="p-2.5 rounded-xl text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-all dark:hover:bg-amber-600/10 disabled:opacity-20"
              >
                {updatingMemory ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={generateSummary}
                disabled={summarizing || messages.length === 0}
                title="生成对话摘要"
                className="p-2.5 rounded-xl text-slate-400 hover:bg-purple-50 hover:text-purple-600 transition-all dark:hover:bg-purple-600/10 disabled:opacity-20"
              >
                {summarizing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
              </button>
              <div className="relative group">
                <button
                  disabled={messages.length === 0}
                  title="导出对话"
                  className="p-2.5 rounded-xl text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all dark:hover:bg-emerald-600/10 disabled:opacity-20"
                >
                  <Download className="h-4 w-4" />
                </button>
                <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50">
                  <div className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800 min-w-[180px]">
                    <button
                      onClick={exportAsTxt}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <FileText className="h-4 w-4" />
                      导出为 TXT
                    </button>
                    <button
                      onClick={exportAsHtml}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <FileCode className="h-4 w-4" />
                      导出为 HTML
                    </button>
                    <button
                      onClick={exportAsPdf}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <FileDown className="h-4 w-4" />
                      导出为 PDF
                    </button>
                    <div className="my-1 h-px bg-slate-200 dark:bg-slate-700" />
                    <button
                      onClick={copyToClipboard}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copied ? "已复制" : "复制到剪贴板"}
                    </button>
                    <div className="my-1 h-px bg-slate-200 dark:bg-slate-700" />
                    <button
                      onClick={exportMemoryFile}
                      disabled={exportingMemory}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      {exportingMemory ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Brain className="h-4 w-4" />
                      )}
                      导出记忆档案
                    </button>
                  </div>
                </div>
              </div>
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

          {/* Search Bar */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-b border-slate-100 px-8 py-4 dark:border-slate-800 overflow-hidden"
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜索聊天记录..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-10 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      autoFocus
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        <X className="h-4 w-4 text-slate-400" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
                    {(
                      [
                        { value: "all", label: "全部" },
                        { value: "user", label: "用户" },
                        { value: "assistant", label: "助手" },
                      ] as const
                    ).map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSearchRole(option.value)}
                        className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                          searchRole === option.value
                            ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                {searchQuery && (
                  <div className="mt-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                    找到 {filteredMessages.length} 条结果
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

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
              ) : showSearch && filteredMessages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex h-full flex-col items-center justify-center text-center opacity-40"
                >
                  <div className="h-20 w-20 flex items-center justify-center rounded-[2rem] bg-slate-50 dark:bg-slate-800 mb-6">
                    <Search className="h-10 w-10 text-slate-400" />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white">
                    未找到匹配结果
                  </h4>
                  <p className="mt-2 max-w-xs text-sm font-medium text-slate-500 dark:text-slate-400">
                    尝试使用不同的关键词或筛选条件
                  </p>
                </motion.div>
              ) : (
                displayMessages.map((message) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
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
                          {showSearch && searchQuery
                            ? highlightText(message.content)
                            : message.content}
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
              {typing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                      {character.avatarUrl ? (
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
                    <div className="flex items-center gap-1 rounded-[1.5rem] rounded-tl-none bg-slate-50 border border-slate-100 px-5 py-3.5 dark:bg-slate-800 dark:border-slate-700">
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
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

      {/* Summary Modal */}
      {showSummary && summary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setShowSummary(false)}
          />
          <div className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl dark:bg-slate-900">
            <button
              onClick={() => setShowSummary(false)}
              className="absolute right-5 top-5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <span className="sr-only">关闭</span>
              ✕
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  对话摘要
                </h3>
                <p className="text-xs text-slate-500">
                  AI 自动生成的对话总结
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  整体摘要
                </h4>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                  {summary.summary}
                </p>
              </div>

              {summary.keyPoints?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    关键要点
                  </h4>
                  <ul className="space-y-2">
                    {summary.keyPoints.map((point: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400"
                      >
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.actionItems?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    待办事项
                  </h4>
                  <ul className="space-y-2">
                    {summary.actionItems.map((item: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400"
                      >
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.emotionalTone && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    情感基调
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                    {summary.emotionalTone}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowSummary(false)}
              className="mt-6 w-full rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
