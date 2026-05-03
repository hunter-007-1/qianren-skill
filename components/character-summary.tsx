import { Character } from "@/lib/types";

interface CharacterSummaryProps {
  character: Character;
}

export function CharacterSummary({ character }: CharacterSummaryProps) {
  if (!character || !character.analysis) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-center dark:border-slate-800 dark:bg-slate-900/30">
        <p className="text-xs text-slate-400">暂无人物画像数据</p>
      </div>
    );
  }

  const analysis = character.analysis;
  const personaSummary = analysis.persona?.summary || "暂无性格摘要";
  const tone = Array.isArray(analysis.speakingStyle?.tone) 
    ? analysis.speakingStyle.tone.join("、") 
    : "未知语气";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-blue-50 bg-blue-50/30 p-4 dark:border-blue-900/20 dark:bg-blue-900/10">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400">性格核心</h4>
        <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{personaSummary}</p>
      </div>
      <div className="rounded-2xl border border-emerald-50 bg-emerald-50/30 p-4 dark:border-emerald-900/20 dark:bg-emerald-900/10">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">言谈举止</h4>
        <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          经常以 <span className="font-bold text-emerald-600 dark:text-emerald-400">{tone}</span> 的语气交谈。
        </p>
      </div>
    </div>
  );
}
