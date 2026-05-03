import { ReactNode } from "react";

interface PanelProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  icon?: string;
}

export function Panel({ title, description, children, className = "", icon }: PanelProps) {
  return (
    <section className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all ${className}`}>
      <header className="mb-4">
        <div className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        </div>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </header>
      {children}
    </section>
  );
}
