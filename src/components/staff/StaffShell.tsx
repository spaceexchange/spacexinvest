import { type ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Menu, X, LogOut, Shield, Headphones, Users2 } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { UserMenu } from "@/components/site/UserMenu";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserRoles, resolvePortal, type Portal, type AppRole } from "@/lib/auth/roles";
import { toast } from "sonner";

export type NavItem = { to: string; label: string; icon: any };
export type NavGroup = { group: string; items: NavItem[] };

const portalMeta: Record<Portal, { label: string; sub: string; icon: any; accent: string }> = {
  admin: { label: "ADMIN CONSOLE", sub: "MISSION CONTROL", icon: Shield, accent: "text-amber-400" },
  support: { label: "SUPPORT DESK", sub: "CUSTOMER OPS", icon: Headphones, accent: "text-emerald-400" },
  compliance: { label: "COMPLIANCE DESK", sub: "KYC & AML", icon: Shield, accent: "text-violet-400" },
  finance: { label: "FINANCE DESK", sub: "TREASURY OPS", icon: Shield, accent: "text-emerald-400" },
  employee: { label: "STAFF WORKSPACE", sub: "INTERNAL OPS", icon: Users2, accent: "text-accent-blue" },
  investor: { label: "INVESTOR PORTAL", sub: "—", icon: Users2, accent: "text-accent-blue" },
};

export function StaffShell({
  portal,
  nav,
  allowedRoles,
  children,
}: {
  portal: Portal;
  nav: NavGroup[];
  allowedRoles: AppRole[];
  children: ReactNode;
}) {
  const router = useRouter();
  const navigate = useNavigate();
  const path = router.state.location.pathname;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const meta = portalMeta[portal];
  const Icon = meta.icon;

  // Close drawer on route change / resize to desktop.
  useEffect(() => { setMobileOpen(false); }, [path]);
  useEffect(() => {
    function onResize() { if (window.innerWidth >= 1024) setMobileOpen(false); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        if (active) navigate({ to: "/auth/login", search: { redirect: path } });
        return;
      }
      const roles = await fetchUserRoles(data.user.id);
      const ok = roles.some((r) => allowedRoles.includes(r));
      if (!ok) {
        if (active) {
          toast.error("Access denied", { description: `Your account does not have ${portal} access.` });
          const target = resolvePortal(roles);
          navigate({
            to: target === "admin" ? "/admin/dashboard"
              : target === "support" ? "/support/dashboard"
              : target === "employee" ? "/employee/dashboard"
              : "/account/dashboard",
          });
        }
        return;
      }
      if (active) {
        setAuthorized(true);
        setChecking(false);
      }
    })();
    return () => { active = false; };
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-4 w-4 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
          <span className="text-xs font-mono tracking-[0.25em]">VERIFYING CLEARANCE…</span>
        </div>
      </div>
    );
  }
  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="px-4 lg:px-6 flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden h-9 w-9 grid place-items-center rounded-md border border-border bg-surface/60" aria-label="Open menu">
              <Menu className="h-4 w-4" />
            </button>
            <Link to="/" className="flex items-center gap-3 min-w-0">
              <Logo className="h-8 w-8 shrink-0" />
              <div className="hidden sm:block leading-none truncate">
                <div className="font-display text-[12px] tracking-[0.25em] silver-text">SPACEX IPO</div>
                <div className={`font-mono text-[10px] tracking-[0.3em] mt-0.5 ${meta.accent}`}>{meta.label}</div>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-surface/40 ${meta.accent}`}>
              <Icon className="h-3.5 w-3.5" />
              <span className="font-mono text-[10px] tracking-[0.25em]">{meta.sub}</span>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden lg:block w-64 shrink-0 border-r border-border bg-surface/30 min-h-[calc(100vh-4rem)] sticky top-16">
          <Sidebar nav={nav} path={path} />
        </aside>

        {mobileOpen && (
          <>
            <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
            <aside className="fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-background lg:hidden overflow-y-auto">
              <div className="h-16 flex items-center justify-between px-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Logo className="h-7 w-7" />
                  <span className={`font-mono text-[10px] tracking-[0.25em] ${meta.accent}`}>{meta.label}</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="h-9 w-9 grid place-items-center rounded-md border border-border">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div onClick={() => setMobileOpen(false)}>
                <Sidebar nav={nav} path={path} />
              </div>
            </aside>
          </>
        )}

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function Sidebar({ nav, path }: { nav: NavGroup[]; path: string }) {
  return (
    <nav className="p-3">
      {nav.map((g) => (
        <div key={g.group} className="mb-5">
          <div className="px-3 mb-2 text-[10px] font-mono tracking-[0.25em] text-muted-foreground/70">{g.group}</div>
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const active = path === it.to || path.startsWith(it.to + "/");
              const I = it.icon;
              return (
                <li key={it.to}>
                  <Link
                    to={it.to}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      active ? "bg-accent-blue/10 text-accent-blue border border-accent-blue/20" : "text-foreground/80 hover:bg-surface/60 hover:text-foreground border border-transparent"
                    }`}
                  >
                    <I className="h-4 w-4 shrink-0" />
                    <span className="truncate">{it.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <div className="px-3 pt-4 border-t border-border mt-4">
        <Link to="/account/dashboard" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
          <LogOut className="h-3.5 w-3.5" /> Exit to investor view
        </Link>
      </div>
    </nav>
  );
}
