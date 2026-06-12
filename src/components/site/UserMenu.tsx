import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { LogOut, Shield, User as UserIcon, ChevronDown, LayoutDashboard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth/AuthProvider";

export function UserMenu() {
  const { t } = useTranslation();
  const { user, signOut, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (loading) return <div className="h-9 w-9 rounded-full bg-secondary animate-pulse" />;

  if (!user) {
    return (
      <div className="flex items-center gap-1">
        <Link to="/auth/login" className="inline-flex h-9 items-center px-3 text-xs font-medium text-foreground hover:text-accent-blue rounded-md transition-colors">
          {t("cta.login")}
        </Link>
        <Link to="/auth/register" className="btn-primary !min-h-[36px] !py-1.5 !px-3 !text-xs">
          {t("cta.signUp")}
        </Link>
      </div>
    );
  }

  const initials = (user.email ?? "U").slice(0, 2).toUpperCase();
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-full border border-border bg-surface/60 hover:bg-surface transition-colors"
      >
        <span className="h-7 w-7 rounded-full bg-gradient-to-br from-accent-blue to-purple-500 grid place-items-center text-[10px] font-bold text-white">
          {initials}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-60 rounded-lg border border-border bg-background shadow-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <div className="text-xs text-muted-foreground">{t("userMenu.signedInAs")}</div>
            <div className="text-sm font-medium text-foreground truncate">{user.email}</div>
          </div>
          <div className="py-1">
            <Link to="/account/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary">
              <LayoutDashboard className="h-4 w-4" /> {t("userMenu.dashboard")}
            </Link>

            <Link to="/account/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary">
              <UserIcon className="h-4 w-4" /> {t("userMenu.profile")}
            </Link>
            <Link to="/account/security" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary">
              <Shield className="h-4 w-4" /> {t("cta.security")}
            </Link>
            <button
              onClick={async () => {
                setOpen(false);
                await signOut();
                navigate({ to: "/auth/login" });
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary"
            >
              <LogOut className="h-4 w-4" /> {t("cta.signOut")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
