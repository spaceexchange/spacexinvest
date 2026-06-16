import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Logo } from "./Logo";

const COLS = [
  {
    titleKey: "footer.cols.invest",
    links: [
      { to: "/spacex", key: "footer.links.spacex" },
      { to: "/tesla-stock", key: "footer.links.teslaStock" },
      { to: "/why-invest", key: "footer.links.whyInvest" },
      { to: "/education", key: "footer.links.education" },
    ],
  },
  {
    titleKey: "footer.cols.commerce",
    links: [
      { to: "/tesla-vehicles", key: "footer.links.teslaVehicles" },
      { to: "/starlink", key: "footer.links.starlink" },
    ],
  },
  {
    titleKey: "footer.cols.company",
    links: [
      { to: "/about", key: "footer.links.about" },
      { to: "/news", key: "footer.links.newsCenter" },
      { to: "/contact", key: "footer.links.contact" },
      { to: "/faq", key: "footer.links.faq" },
    ],
  },
  {
    titleKey: "footer.cols.legal",
    links: [
      { to: "/terms", key: "footer.links.terms" },
      { to: "/privacy", key: "footer.links.privacy" },
    ],
  },
] as const;

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="relative border-t border-border bg-surface/40">
      <div className="container-x py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_3fr]">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <Logo className="h-10 w-10" />
              <div>
                <div className="font-display text-sm tracking-[0.25em] silver-text">SPACEX</div>
                <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground mt-1">EXCHANGE</div>
              </div>
            </Link>
            <p className="mt-5 text-sm text-muted-foreground max-w-sm leading-relaxed">
              {t("footer.tagline")}
            </p>
            <div className="mt-6 flex flex-wrap gap-2 font-mono text-[10px] tracking-widest text-muted-foreground">
              <span className="px-2 py-1 border border-border rounded">SEC ALIGNED</span>
              <span className="px-2 py-1 border border-border rounded">SOC 2</span>
              <span className="px-2 py-1 border border-border rounded">256-BIT TLS</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {COLS.map((col) => (
              <div key={col.titleKey}>
                <div className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground mb-4 uppercase">
                  {t(col.titleKey)}
                </div>
                <ul className="space-y-3">
                  {col.links.map((l) => (
                    <li key={l.to}>
                      <Link to={l.to} className="text-sm text-foreground/85 hover:text-accent-blue transition-colors">
                        {t(l.key)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>{t("footer.copyright", { year: new Date().getFullYear() })}</div>
          <div className="font-mono tracking-widest">{t("footer.status")}</div>
        </div>
      </div>
    </footer>
  );
}
