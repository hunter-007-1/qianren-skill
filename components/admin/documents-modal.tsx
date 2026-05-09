"use client";

import { useState, useEffect } from "react";
import { X, FileText, Loader2 } from "lucide-react";

interface SourceDocument {
  id: string;
  filename: string;
  fileType: string;
  content: string;
  createdAt: string;
}

interface DocumentsModalProps {
  characterId: string;
  characterName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentsModal({
  characterId,
  characterName,
  isOpen,
  onClose,
}: DocumentsModalProps) {
  const [documents, setDocuments] = useState<SourceDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<SourceDocument | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDocuments();
    }
  }, [isOpen, characterId]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/characters/${characterId}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
        if (data.length > 0) {
          setSelectedDoc(data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative flex h-[80vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                源文档
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {characterName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Document List */}
          <div className="w-64 overflow-y-auto border-r border-slate-200 dark:border-slate-700">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : documents.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-4 text-slate-400">
                <FileText className="h-8 w-8 mb-2" />
                <p className="text-sm">暂无文档</p>
              </div>
            ) : (
              <div className="p-2">
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`w-full rounded-lg p-3 text-left transition-all ${
                      selectedDoc?.id === doc.id
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="truncate text-sm font-medium">
                        {doc.filename}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {doc.fileType} · {(doc.content.length / 1024).toFixed(1)}KB
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Document Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedDoc ? (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {selectedDoc.filename}
                  </h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500 dark:bg-slate-700">
                    {selectedDoc.fileType}
                  </span>
                </div>
                <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-800 dark:bg-slate-900 dark:text-slate-200">
                  {selectedDoc.content}
                </pre>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-slate-400">
                <FileText className="h-12 w-12 mb-4" />
                <p>选择一个文档查看内容</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 dark:border-slate-700">
          <p className="text-center text-sm text-slate-400">
            共 {documents.length} 个文档
          </p>
        </div>
      </div>
    </div>
  );
}
