type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

interface StatusBadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: string;
  pulse?: boolean;
}

const toneMap: Record<BadgeTone, { bg: string; text: string; dot?: string }> = {
  neutral: { bg: "bg-slate-100", text: "text-slate-700" },
  success: { bg: "bg-emerald-50", text: "text-emerald-700" },
  warning: { bg: "bg-amber-50", text: "text-amber-700" },
  danger: { bg: "bg-rose-50", text: "text-rose-700" },
  info: { bg: "bg-blue-50", text: "text-blue-700" },
};

export function StatusBadge({ label, tone = "neutral", icon, pulse = false }: StatusBadgeProps) {
  const { bg, text, dot } = toneMap[tone];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${bg} ${text}`}>
      {dot && (
        <span className={`h-1.5 w-1.5 rounded-full ${dot} ${pulse ? "animate-pulse" : ""}`}></span>
      )}
      {icon && <span>{icon}</span>}
      {label}
    </span>
  );
}
