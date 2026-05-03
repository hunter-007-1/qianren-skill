"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";
import { Panel } from "@/components/panel";

export default function EditCharacterPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [nickname, setNickname] = useState("");
  const [relationship, setRelationship] = useState("");
  const [background, setBackground] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [impression, setImpression] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userAvatarUrl, setUserAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

  const loadCharacter = useCallback(async () => {
    try {
      const response = await fetch(`/api/characters/${id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "加载失败");

      setNickname(data.nickname || "");
      setRelationship(data.relationship || "");
      setBackground(data.background || "");
      setTimeframe(data.timeframe || "");
      setImpression(data.impression || "");
      setAvatarUrl(data.avatarUrl || "");
      setUserAvatarUrl(data.userAvatarUrl || "");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadCharacter();
  }, [loadCharacter]);

  const save = async () => {
    if (!nickname.trim()) {
      toast.error("请填写人物昵称");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/characters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          relationship,
          background,
          timeframe,
          impression,
          avatarUrl,
          userAvatarUrl,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "保存失败");
      }

      toast.success("保存成功");
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">正在加载资料...</div>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Toaster position="top-right" />
      <section className="rounded-3xl bg-slate-900 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">编辑角色资料</h1>
        <p className="mt-2 text-sm text-slate-300">
          修改角色的基础信息、关系背景或头像链接。
        </p>
      </section>

      <Panel
        title="基础资料"
        description="这些信息将影响 AI 对角色的理解和扮演风格。"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-slate-700">
            人物昵称 *
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </label>
          <label className="text-sm text-slate-700">
            关系说明
            <input
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </label>
          <label className="text-sm text-slate-700">
            相识背景
            <input
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </label>
          <label className="text-sm text-slate-700">
            时间跨度
            <input
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </label>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">角色头像</span>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    👤
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                title="选择角色头像"
                onChange={(e) => handleAvatarChange(e, "char")}
                className="text-xs text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">我的头像</span>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
                {userAvatarUrl ? (
                  <img
                    src={userAvatarUrl}
                    alt="User"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    👤
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                title="选择我的头像"
                onChange={(e) => handleAvatarChange(e, "user")}
                className="text-xs text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
              />
            </div>
          </div>
        </div>

        <label className="mt-4 block text-sm text-slate-700">
          用户主观印象
          <textarea
            value={impression}
            onChange={(e) => setImpression(e.target.value)}
            rows={4}
            placeholder="例如：性格开朗，说话幽默..."
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          />
        </label>

        <div className="mt-6 flex gap-3">
          <button
            onClick={save}
            disabled={isSaving}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-400"
          >
            {isSaving ? "正在保存..." : "保存修改"}
          </button>
          <Link
            href="/"
            className="rounded-lg border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            取消
          </Link>
        </div>
      </Panel>
    </main>
  );
}
