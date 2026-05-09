"use client";

import { useState } from "react";
import { Trash2, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface BatchActionsProps {
  selectedIds: string[];
  onActionComplete: () => void;
  onClearSelection: () => void;
}

export function BatchActions({
  selectedIds,
  onActionComplete,
  onClearSelection,
}: BatchActionsProps) {
  const [loading, setLoading] = useState(false);

  const handleBatchDelete = async () => {
    if (!confirm(`确定要删除选中的 ${selectedIds.length} 个角色吗？此操作不可恢复。`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/characters/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action: "delete" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "批量删除失败");
      }

      const data = await res.json();
      toast.success(data.message);
      onClearSelection();
      onActionComplete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "批量删除失败");
    } finally {
      setLoading(false);
    }
  };

  const handleBatchReanalyze = async () => {
    if (!confirm(`确定要重新分析选中的 ${selectedIds.length} 个角色吗？`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/characters/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action: "reanalyze" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "批量重置失败");
      }

      const data = await res.json();
      toast.success(data.message);
      onClearSelection();
      onActionComplete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "批量重置失败");
    } finally {
      setLoading(false);
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
        已选择 {selectedIds.length} 个角色
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={handleBatchDelete}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          批量删除
        </button>
        <button
          onClick={handleBatchReanalyze}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          批量重新分析
        </button>
        <button
          onClick={onClearSelection}
          disabled={loading}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          取消选择
        </button>
      </div>
    </div>
  );
}
