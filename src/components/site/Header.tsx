import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Search, LayoutDashboard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Logo } from "./Logo";
import { LanguageSelector, CountrySelector } from "./LocaleSelectors";
import { UserMenu } from "./UserMenu";
import { useAuth } from "@/lib/auth/AuthProvider";

const NAV_ITEMS = [
  { to: "/", key: "home" },
  { to: "/spacex", key: "spacex" },
  { to: "/tesla-stock", key: "teslaStock" },
  { to: "/tesla-vehicles", key: "vehicles" },
  { to: "/starlink", key: "starlink" },
  { to: "/news", key: "news" },
  { to: "/education", key: "education" },
  { to: "/about", key: "about" },
] as const;

export function Header() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container-x flex h-16 items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2.5 group min-w-0" onClick={() => setOpen(false)}>
          <Logo className="h-12 w-12 shrink-0 transition-transform group-hover:scale-105" />
          <div className="hidden sm:block leading-none min-w-0">
            <div className="font-display text-[13px] tracking-[0.25em] silver-text truncate">SPACEX IPO</div>
            <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground mt-0.5">EXCHANGE</div>
          </div>
        </Link>

        <nav className="hidden xl:flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md transition-colors"
              activeProps={{ className: "px-3 py-2 text-sm font-semibold text-foreground rounded-md" }}
            >
              {t(`nav.${item.key}`)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setSearchOpen((s) => !s)}
            aria-label={t("common.search")}
            className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary transition-colors"
          >
            <Search className="h-4 w-4" />
          </button>
          <LanguageSelector />
          <CountrySelector />

          {/* Desktop auth area */}
          <div className="hidden md:flex items-center gap-2 ml-1">
            {!loading && user && (
              <Link
                to="/account/dashboard"
                className="hidden lg:inline-flex h-9 items-center gap-1.5 px-3 text-xs font-medium text-foreground border border-accent-blue/40 bg-accent-blue/10 hover:bg-accent-blue/20 rounded-md transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" /> {t("cta.investorPortal")}
              </Link>
            )}
            <UserMenu />
          </div>

          <button
            className="xl:hidden p-2.5 text-foreground rounded-md hover:bg-secondary"
            onClick={() => setOpen((o) => !o)}
            aria-label={t("common.menu")}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-border bg-surface/80 backdrop-blur-xl">
          <div className="container-x py-4">
            <div className="flex items-center gap-3 glass-panel rounded-md px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                autoFocus
                placeholder={t("common.searchPlaceholder")}
                aria-label={t("common.search")}
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
              />
              <kbd className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 border border-border rounded">ESC</kbd>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div className="xl:hidden border-t border-border bg-background">
          <nav className="container-x py-4 flex flex-col">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="py-3 text-base text-foreground border-b border-border last:border-0"
              >
                {t(`nav.${item.key}`)}
              </Link>
            ))}

            {/* Mobile auth block */}
            <div className="pt-4 mt-2 border-t border-border">
              {user ? (
                <div className="flex flex-col gap-2">
                  <Link to="/account/dashboard" onClick={() => setOpen(false)} className="btn-primary w-full">
                    <LayoutDashboard className="h-4 w-4" /> {t("cta.investorPortal")}
                  </Link>
                  <Link to="/account/security" onClick={() => setOpen(false)} className="btn-ghost w-full">{t("cta.security")}</Link>
                  <Link to="/auth/logout" onClick={() => setOpen(false)} className="btn-ghost w-full">{t("cta.signOut")}</Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link to="/auth/register" onClick={() => setOpen(false)} className="btn-primary w-full">{t("cta.createAccount")}</Link>
                  <Link to="/auth/login" onClick={() => setOpen(false)} className="btn-ghost w-full">{t("cta.login")}</Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
