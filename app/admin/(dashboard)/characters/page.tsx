"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  Sparkles,
  Loader2,
  Eye,
  FileText,
  CheckSquare,
  Square,
  Search,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { AdminHeader } from "@/components/admin/admin-header";
import { ChatModal } from "@/components/admin/chat-modal";
import { DocumentsModal } from "@/components/admin/documents-modal";
import { BatchActions } from "@/components/admin/batch-actions";
import { useUser } from "@/lib/use-user";

interface CharacterData {
  id: string;
  nickname: string;
  analysisStatus: string;
  createdAt: string;
  userId: string | null;
  user: {
    email: string;
    nickname: string | null;
  } | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminCharactersPage() {
  const { data: me } = useUser();
  const { data: characters, mutate, isLoading } = useSWR<CharacterData[]>(
    "/api/admin/characters",
    fetcher
  );
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatModal, setChatModal] = useState({
    isOpen: false,
    characterId: "",
    characterName: "",
  });
  const [documentsModal, setDocumentsModal] = useState({
    isOpen: false,
    characterId: "",
    characterName: "",
  });

  const filtered = useMemo(() => {
    if (!characters) return [];
    const q = query.trim().toLowerCase();
    if (!q) return characters;
    return characters.filter(
      (c) =>
        c.nickname.toLowerCase().includes(q) ||
        c.user?.email?.toLowerCase().includes(q) ||
        c.user?.nickname?.toLowerCase().includes(q)
    );
  }, [characters, query]);

  const toggleCharacterSelection = (id: string) => {
    setSelectedCharacters((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCharacters.length === filtered.length) {
      setSelectedCharacters([]);
    } else {
      setSelectedCharacters(filtered.map((c) => c.id));
    }
  };

  const handleDeleteCharacter = async (id: string) => {
    if (!confirm("确定要删除这个角色吗？此操作不可恢复。")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/characters/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
      mutate();
      toast.success("角色已删除");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AdminHeader
        title="角色管理"
        subtitle="查看聊天、源文档与批量操作"
        email={me?.email}
        nickname={me?.nickname}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <BatchActions
          selectedIds={selectedCharacters}
          onActionComplete={() => mutate()}
          onClearSelection={() => setSelectedCharacters([])}
        />

        <div className="mb-4 mt-4 flex items-center gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索角色名或所有者..."
              className="w-full rounded-xl border border-slate-700 bg-[#12182a] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#00D4FF]"
            />
          </div>
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
            disabled={!filtered.length}
          >
            {selectedCharacters.length === filtered.length && filtered.length > 0 ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            全选
          </button>
          <span className="text-sm text-slate-500">
            ({selectedCharacters.length}/{filtered.length})
          </span>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            加载中...
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="py-12 text-center text-slate-500">暂无数据</div>
        )}

        <div className="grid gap-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              className={`flex items-center justify-between rounded-xl border bg-[#12182a] p-4 ${
                selectedCharacters.includes(c.id)
                  ? "border-[#00D4FF]/50 bg-cyan-950/20"
                  : "border-slate-800"
              }`}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleCharacterSelection(c.id)}
                  className="text-slate-500 hover:text-[#00D4FF]"
                >
                  {selectedCharacters.includes(c.id) ? (
                    <CheckSquare className="h-5 w-5 text-[#00D4FF]" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                </button>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7B2FFF]/20">
                  <Sparkles className="h-5 w-5 text-[#7B2FFF]" />
                </div>
                <div>
                  <div className="font-bold text-white">{c.nickname}</div>
                  <div className="text-sm text-slate-500">
                    所有者：{c.user?.nickname || c.user?.email || "未知"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setChatModal({
                      isOpen: true,
                      characterId: c.id,
                      characterName: c.nickname,
                    })
                  }
                  title="查看聊天记录"
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() =>
                    setDocumentsModal({
                      isOpen: true,
                      characterId: c.id,
                      characterName: c.nickname,
                    })
                  }
                  title="查看源文档"
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white"
                >
                  <FileText className="h-4 w-4" />
                </button>
                <Link
                  href={`/chat/${c.id}`}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-[#00D4FF] hover:bg-cyan-500/10"
                >
                  <Sparkles className="h-4 w-4" />
                  查看
                </Link>
                <button
                  onClick={() => handleDeleteCharacter(c.id)}
                  disabled={loading}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                >
                  删除
                </button>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    c.analysisStatus === "DONE"
                      ? "bg-green-500/15 text-green-400"
                      : c.analysisStatus === "RUNNING"
                        ? "bg-yellow-500/15 text-yellow-400"
                        : c.analysisStatus === "FAILED"
                          ? "bg-red-500/15 text-red-400"
                          : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {c.analysisStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ChatModal
        characterId={chatModal.characterId}
        characterName={chatModal.characterName}
        isOpen={chatModal.isOpen}
        onClose={() =>
          setChatModal({ isOpen: false, characterId: "", characterName: "" })
        }
      />
      <DocumentsModal
        characterId={documentsModal.characterId}
        characterName={documentsModal.characterName}
        isOpen={documentsModal.isOpen}
        onClose={() =>
          setDocumentsModal({
            isOpen: false,
            characterId: "",
            characterName: "",
          })
        }
      />
    </>
  );
}
