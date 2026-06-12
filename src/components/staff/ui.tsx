import { type ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export function PageHeader({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 mb-6">
      <div className="min-w-0">
        {eyebrow && <div className="text-[10px] font-mono tracking-[0.3em] text-muted-foreground mb-1">{eyebrow}</div>}
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground truncate">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </header>
  );
}

export function StatCard({ label, value, change, icon, tone }: { label: string; value: string | number; change?: number; icon?: ReactNode; tone?: "default" | "warning" | "danger" | "success" }) {
  const positive = (change ?? 0) >= 0;
  const accent = tone === "warning" ? "text-yellow-400" : tone === "danger" ? "text-red-400" : tone === "success" ? "text-emerald-400" : "text-accent-blue";
  return (
    <div className="glass-card rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono tracking-[0.25em] text-muted-foreground uppercase">{label}</span>
        {icon && <span className={accent}>{icon}</span>}
      </div>
      <div className="text-xl sm:text-2xl font-semibold text-foreground">{value}</div>
      {change !== undefined && (
        <div className={`mt-1.5 flex items-center gap-1 text-[11px] font-medium ${positive ? "text-emerald-400" : "text-red-400"}`}>
          {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {positive ? "+" : ""}{change.toFixed(1)}%
          <span className="text-muted-foreground font-normal ml-1">vs last week</span>
        </div>
      )}
    </div>
  );
}

export function Panel({ title, action, children, className = "", padded = true }: { title?: string; action?: ReactNode; children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={`glass-card rounded-xl ${padded ? "p-5" : ""} ${className}`}>
      {(title || action) && (
        <div className={`flex items-center justify-between ${padded ? "mb-4" : "px-5 pt-5 pb-3"}`}>
          {title && <h2 className="text-sm font-semibold text-foreground tracking-wide">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Pill({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "success" | "warning" | "info" | "danger" | "neutral" }) {
  const tones: Record<string, string> = {
    default: "bg-secondary text-foreground/80 border-border",
    neutral: "bg-secondary text-muted-foreground border-border",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    info: "bg-blue-500/10 text-accent-blue border-blue-500/20",
    danger: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-medium tracking-wide uppercase ${tones[tone]}`}>{children}</span>;
}

export function statusTone(status: string): "success" | "warning" | "danger" | "info" | "default" {
  const s = status.toLowerCase();
  if (["active", "approved", "completed", "verified", "resolved", "closed", "done", "open"].includes(s)) return s === "open" ? "info" : "success";
  if (["pending", "processing", "review", "in progress", "in review", "todo", "paused"].includes(s)) return "warning";
  if (["rejected", "banned", "suspended", "frozen", "escalated", "failed"].includes(s)) return s === "escalated" ? "warning" : "danger";
  return "default";
}

export const inputCls = "h-9 rounded-md border border-border bg-surface/60 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-blue/40";
export const btnPrimary = "inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md bg-accent-blue text-white text-sm font-medium hover:bg-accent-blue/90 transition-colors";
export const btnSecondary = "inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md border border-border bg-surface/40 text-sm hover:bg-surface/70 transition-colors";
export const btnGhost = "inline-flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-surface/60 transition-colors";

export function DataTable({ columns, children }: { columns: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-sm min-w-[700px]">
        <thead>
          <tr className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase border-b border-border">
            {columns.map((c) => <th key={c} className="text-left font-medium px-5 py-3">{c}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-5 py-3 ${className}`}>{children}</td>;
}
