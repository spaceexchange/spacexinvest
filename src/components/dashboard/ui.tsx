import { type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 mb-5 sm:mb-6">
      <div className="min-w-0">
        <div className="text-[10px] font-mono tracking-[0.3em] text-muted-foreground mb-1">{t("dashboard.portal")}</div>
        <h1 className="text-xl sm:text-3xl font-semibold text-foreground truncate">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function StatCard({ label, value, change, icon }: { label: string; value: string; change?: number; icon?: ReactNode }) {
  const { t } = useTranslation();
  const positive = (change ?? 0) >= 0;
  return (
    <div className="glass-card rounded-xl p-3 sm:p-4">
      <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
        <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.2em] sm:tracking-[0.25em] text-muted-foreground uppercase truncate">{label}</span>
        {icon && <span className="text-accent-blue shrink-0">{icon}</span>}
      </div>
      <div className="text-lg sm:text-2xl font-semibold text-foreground tabular-nums truncate">{value}</div>
      {change !== undefined && (
        <div className={`mt-1.5 sm:mt-2 flex items-center gap-1 text-[11px] sm:text-xs font-medium ${positive ? "text-emerald-400" : "text-red-400"}`}>
          {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {positive ? "+" : ""}{change.toFixed(1)}%
          <span className="text-muted-foreground font-normal ml-1 truncate">{t("dashboard.vsLastMonth")}</span>
        </div>
      )}
    </div>
  );
}

export function Panel({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`glass-card rounded-xl p-3.5 sm:p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
          {title && <h2 className="text-sm font-semibold text-foreground tracking-wide truncate">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Pill({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "success" | "warning" | "info" | "danger" }) {
  const tones: Record<string, string> = {
    default: "bg-secondary text-foreground/80 border-border",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    info: "bg-blue-500/10 text-accent-blue border-blue-500/20",
    danger: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-medium tracking-wide uppercase ${tones[tone]}`}>{children}</span>;
}

export const inputCls = "w-full h-10 rounded-md border border-border bg-surface/60 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-blue/40";
