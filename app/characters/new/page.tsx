"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";
import { Plus, X, Tag as TagIcon } from "lucide-react";

type PreviewItem = { filename: string; text: string };
type Tag = { id: string; name: string; color: string };

const ALLOWED_EXTENSIONS = ["txt", "md", "json", "csv"];

export default function NewCharacterPage() {
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [relationship, setRelationship] = useState("");
  const [background, setBackground] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [impression, setImpression] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userAvatarUrl, setUserAvatarUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<PreviewItem[]>([]);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTags(data);
      })
      .catch(() => {});
  }, []);

  const totalBytes = useMemo(
    () => files.reduce((sum, f) => sum + f.size, 0),
    [files],
  );

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTags((prev) => [...prev, data]);
      setSelectedTagIds((prev) => [...prev, data.id]);
      setNewTagName("");
      setShowTagInput(false);
      toast.success("标签已创建");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建失败");
    }
  };

  const handleAvatarChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "char" | "user",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("头像图片不能超过 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === "char") setAvatarUrl(base64);
        else setUserAvatarUrl(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    const filtered = selected.filter((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      return ext ? ALLOWED_EXTENSIONS.includes(ext) : false;
    });

    if (filtered.length !== selected.length) {
      toast.error("仅支持 txt / md / json / csv 文件");
    }

    setFiles(filtered);
  };

  const submit = async () => {
    if (!nickname.trim()) {
      toast.error("请填写人物昵称");
      return;
    }

    if (files.length === 0 && !pastedText.trim()) {
      toast.error("请上传文件或粘贴文本");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.set("nickname", nickname);
      formData.set("relationship", relationship);
      formData.set("background", background);
      formData.set("timeframe", timeframe);
      formData.set("impression", impression);
      formData.set("avatarUrl", avatarUrl);
      formData.set("userAvatarUrl", userAvatarUrl);
      formData.set("pastedText", pastedText);
      selectedTagIds.forEach((tagId) => formData.append("tagIds", tagId));
      files.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/characters", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        id?: string;
        preview?: PreviewItem[];
        error?: string;
      };

      if (!response.ok || !payload.id) {
        throw new Error(payload.error ?? "创建失败");
      }

      setCreatedId(payload.id);
      setPreview(payload.preview ?? []);
      setShowPreview(true);
      toast.success("资料上传并解析成功");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "上传失败");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <Toaster position="top-center" />

      {/* Header */}
      <section className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-5 sm:p-6 shadow-xl">
        <div className="relative">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            ✨ 创建人物数字画像
          </h1>
          <p className="mt-2 text-sm text-indigo-100">
            上传聊天记录或粘贴文本，系统将自动分析并生成人物画像
          </p>
        </div>
      </section>

      {/* 隐私提示 */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <span className="text-xl">🔒</span>
        <p className="text-sm text-blue-700">
          <strong>隐私提示：</strong>
          请勿上传身份证号、银行卡等敏感信息。所有数据仅用于本地分析，不会被上传至任何服务器。
        </p>
      </div>

      {/* 主表单 */}
      <div className="space-y-5">
        {/* 基础信息 */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <span>📝</span> 基础信息
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                人物昵称 <span className="text-rose-500">*</span>
              </label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="例如：小明、姐姐"
                className="input mt-1.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                与你的关系
              </label>
              <input
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="例如：朋友、前女友、同事"
                className="input mt-1.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                相识背景
              </label>
              <input
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="例如：大学同学、公司同事"
                className="input mt-1.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                认识时间跨度
              </label>
              <input
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                placeholder="例如：2年、半年"
                title="输入认识时间跨度"
                className="input mt-1.5"
              />
            </div>
          </div>
        </section>

        {/* 标签分组 */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <TagIcon className="h-4 w-4" />
            标签分组
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            为角色添加标签，方便分类管理（可选）
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  selectedTagIds.includes(tag.id)
                    ? "text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                }`}
                style={
                  selectedTagIds.includes(tag.id)
                    ? { backgroundColor: tag.color }
                    : undefined
                }
              >
                {tag.name}
                {selectedTagIds.includes(tag.id) && (
                  <X className="h-3 w-3" />
                )}
              </button>
            ))}

            {showTagInput ? (
              <div className="flex items-center gap-1.5">
                <input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createTag()}
                  placeholder="标签名称"
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-indigo-500 w-24"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={createTag}
                  className="rounded-full bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100"
                >
                  添加
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTagInput(false);
                    setNewTagName("");
                  }}
                  className="rounded-full p-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowTagInput(true)}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500 hover:border-indigo-400 hover:text-indigo-600"
              >
                <Plus className="h-3 w-3" />
                新建标签
              </button>
            )}
          </div>
        </section>

        {/* 头像设置 */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <span>🖼️</span> 头像设置
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            设置头像让对话更有沉浸感（可选）
          </p>

          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 overflow-hidden rounded-xl border-2 border-slate-200 bg-gradient-to-br from-slate-100 to-slate-50 shadow-sm">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl text-slate-300">
                      👤
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">角色头像</p>
                <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">
                  <span>📤</span> 上传图片
                  <input
                    type="file"
                    accept="image/*"
                    title="选择角色头像"
                    onChange={(e) => handleAvatarChange(e, "char")}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 overflow-hidden rounded-xl border-2 border-slate-200 bg-gradient-to-br from-slate-100 to-slate-50 shadow-sm">
                  {userAvatarUrl ? (
                    <img
                      src={userAvatarUrl}
                      alt="User"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl text-slate-300">
                      😊
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">你的头像</p>
                <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">
                  <span>📤</span> 上传图片
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleAvatarChange(e, "user")}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* 主观印象 */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <span>💭</span> 你的主观印象
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            描述你对这个人的整体印象，帮助 AI 更准确地把握人物特点
          </p>

          <textarea
            value={impression}
            onChange={(e) => setImpression(e.target.value)}
            placeholder="例如：她是一个很有主见的人，说话直接但很有分寸..."
            rows={3}
            className="input mt-4"
          />
        </section>

        {/* 资料输入 */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <span>📄</span> 聊天资料 <span className="text-rose-500">*</span>
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            上传文件或直接粘贴聊天记录文本
          </p>

          {/* 文件上传 */}
          <div className="mt-4">
            <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 transition-colors hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer">
              <span className="text-3xl mb-2">📁</span>
              <p className="text-sm font-medium text-slate-700">
                点击或拖拽上传文件
              </p>
              <p className="mt-1 text-xs text-slate-500">
                支持 txt / md / json / csv
              </p>
              <input
                type="file"
                onChange={onFileChange}
                multiple
                accept=".txt,.md,.json,.csv"
                className="hidden"
              />
            </label>
            {files.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {files.map((file, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                  >
                    📄 {file.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-xs text-slate-400">或者</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* 粘贴文本 */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">
              粘贴聊天记录
            </label>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder={`粘贴格式示例：

[2024年1月1日 10:30]
小明：早啊，今天天气真好
你：是啊，要不要出去逛逛？
小明：好啊，去哪里？
你：去公园吧
小明：可以，顺便买杯咖啡

[2024年1月1日 11:00]
小明：到哪了？
...`}
              rows={8}
              className="input mt-1.5 font-mono text-sm"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              {pastedText.length} 字符
            </p>
          </div>

          {/* 状态 */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                isUploading
                  ? "bg-amber-50 text-amber-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {isUploading ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                  解析中...
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                  待上传
                </>
              )}
            </span>
            <span className="text-xs text-slate-500">
              {files.length} 个文件 · {(totalBytes / 1024).toFixed(1)} KB
            </span>
          </div>
        </section>

        {/* 提交按钮 */}
        <button
          onClick={submit}
          disabled={isUploading}
          className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
        >
          {isUploading ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
              上传并解析中...
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <span>🚀</span> 上传并解析
            </span>
          )}
        </button>

        {/* 解析预览 */}
        {showPreview && (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <span>👁️</span> 解析预览
              </h2>
              <span className="text-xs text-emerald-600 font-medium">
                ✓ 解析成功
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              确认系统提取到的文本后再进入分析
            </p>

            {preview.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">暂无解析结果</p>
            ) : (
              <div className="mt-4 space-y-3">
                {preview.map((item) => (
                  <article
                    key={item.filename}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                  >
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <span>📄</span> {item.filename}
                    </p>
                    <p className="mt-2 line-clamp-6 text-sm text-slate-600 whitespace-pre-wrap">
                      {item.text}
                    </p>
                  </article>
                ))}
              </div>
            )}

            {createdId && (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/analysis/${createdId}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5"
                >
                  <span>🤖</span> 开始 AI 分析
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  返回首页
                </Link>
              </div>
            )}
          </section>
        )}

        {/* 返回链接 */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}
