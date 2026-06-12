import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth/AuthProvider";

interface InvestorCTAProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  variant?: "panel" | "banner" | "inline";
}

/**
 * Auth-aware investor call-to-action. Renders different copy/buttons
 * depending on whether the visitor is logged in.
 */
export function InvestorCTA({
  eyebrow,
  title,
  description,
  variant = "panel",
}: InvestorCTAProps) {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const _eyebrow = eyebrow ?? t("investorCta.eyebrow");
  const _title = title ?? t("investorCta.title");
  const _description = description ?? t("investorCta.description");

  if (variant === "inline") {
    if (loading) return null;
    return (
      <div className="flex flex-wrap gap-3">
        {user ? (
          <>
            <Link to="/account/dashboard" className="btn-primary">{t("cta.goToPortal")} <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/contact" className="btn-ghost">{t("cta.talkAdvisor")}</Link>
          </>
        ) : (
          <>
            <Link to="/auth/register" className="btn-primary">{t("cta.createAccount")} <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/auth/login" className="btn-ghost">{t("cta.loginToInvest")}</Link>
          </>
        )}
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <section className="border-y border-border bg-surface/40">
        <div className="container-x py-10 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-start gap-4 max-w-2xl">
            <ShieldCheck className="h-6 w-6 text-accent-blue mt-0.5 shrink-0" />
            <div>
              <div className="font-mono text-[10px] tracking-[0.3em] text-accent-blue">{_eyebrow}</div>
              <h3 className="font-display text-xl sm:text-2xl mt-1">{_title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{_description}</p>
            </div>
          </div>
          <InvestorCTA variant="inline" />
        </div>
      </section>
    );
  }

  return (
    <section className="section-y">
      <div className="container-x">
        <div className="glass-card p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 starfield opacity-20" />
          <Sparkles className="h-7 w-7 text-accent-blue mx-auto relative" />
          <div className="font-mono text-[11px] tracking-[0.3em] text-accent-blue mt-4 relative">{_eyebrow}</div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-3 relative">{_title}</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto relative">{_description}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 relative">
            <InvestorCTA variant="inline" />
          </div>
        </div>
      </div>
    </section>
  );
}
