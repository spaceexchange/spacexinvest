import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/site/Logo";

interface Props {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, eyebrow, children, footer }: Props) {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="absolute inset-0 starfield opacity-40 pointer-events-none" aria-hidden />
      <header className="relative z-10 border-b border-border/60 bg-background/60 backdrop-blur-xl">
        <div className="container-x flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Logo className="h-8 w-8" />
            <div className="hidden sm:block leading-none">
              <div className="font-display text-[12px] tracking-[0.25em] silver-text">SPACEX IPO</div>
              <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground mt-0.5">EXCHANGE</div>
            </div>
          </Link>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {t("cta.backToSite")}
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            {eyebrow && <div className="font-mono text-[10px] tracking-[0.3em] text-accent-blue">{eyebrow}</div>}
            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-semibold silver-text">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="glass-card rounded-xl p-6 sm:p-8 shadow-2xl shadow-black/40">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </main>

      <footer className="relative z-10 border-t border-border/60 py-4">
        <div className="container-x text-center text-[11px] font-mono tracking-[0.2em] text-muted-foreground">
          ENCRYPTED · SOC 2 · GDPR
        </div>
      </footer>
    </div>
  );
}
