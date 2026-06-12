// Authenticated layout — gates /account/* with sidebar navigation for the investor portal.
import { createFileRoute, Outlet, redirect, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/Logo";
import { UserMenu } from "@/components/site/UserMenu";
import { LanguageSelector, CountrySelector } from "@/components/site/LocaleSelectors";
import {
  LayoutDashboard, Wallet, PieChart, Briefcase, Sparkles, Receipt, Banknote,
  Coins, FolderLock, ShieldCheck, Bell, Users2, Headphones, Settings, User as UserIcon,
  ShieldAlert, Menu, X, Award, BookOpen, TrendingUp, Rocket, Car, BarChart3,
} from "lucide-react";


export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth/login" });
    return { user: data.user };
  },
  component: AccountLayout,
});

const nav = [
  { group: "OVERVIEW", items: [
    { to: "/account/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/account/portfolio", label: "Portfolio", icon: PieChart },
    { to: "/account/investments", label: "My Investments", icon: Briefcase },
    { to: "/account/holdings", label: "Holdings", icon: BarChart3 },

    { to: "/account/spacex", label: "SpaceX Stock", icon: Rocket },
    { to: "/account/tesla", label: "Tesla Stock", icon: TrendingUp },
    { to: "/account/tesla-vehicles", label: "Tesla Vehicles", icon: Car },
    { to: "/account/opportunities", label: "Opportunities", icon: Sparkles },
  ]},
  { group: "MONEY", items: [
    { to: "/account/funding", label: "Funding Center", icon: Banknote },
    { to: "/account/wallet", label: "Wallet", icon: Wallet },
    { to: "/account/transactions", label: "Transactions", icon: Receipt },
    { to: "/account/invoices", label: "Invoices", icon: Receipt },
    { to: "/account/referrals", label: "Referrals", icon: Coins },
    { to: "/account/affiliate", label: "Affiliate", icon: Users2 },
    { to: "/account/rewards", label: "Rewards", icon: Sparkles },
    { to: "/account/achievements", label: "Achievements", icon: Award },
  ]},
  { group: "ACCOUNT", items: [
    { to: "/account/verification", label: "Verification", icon: ShieldCheck },
    { to: "/account/documents", label: "Document Vault", icon: FolderLock },
    { to: "/account/notifications", label: "Notifications", icon: Bell },
    { to: "/account/notification-preferences", label: "Notification Preferences", icon: Bell },
    { to: "/account/announcements", label: "Announcements", icon: Bell },
    { to: "/account/profile", label: "Profile", icon: UserIcon },
    { to: "/account/security", label: "Security", icon: ShieldAlert },
    { to: "/account/settings", label: "Settings", icon: Settings },
    { to: "/account/support", label: "Support", icon: Headphones },
    { to: "/help", label: "Help Center", icon: BookOpen },
  ]},
];

function AccountLayout() {
  const router = useRouter();
  const path = router.state.location.pathname;
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change or viewport resize to desktop.
  useEffect(() => { setMobileOpen(false); }, [path]);
  useEffect(() => {
    function onResize() { if (window.innerWidth >= 1024) setMobileOpen(false); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);


  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="px-4 lg:px-6 flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden h-9 w-9 grid place-items-center rounded-md border border-border bg-surface/60"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <Link to="/" className="flex items-center gap-3 min-w-0">
              <Logo className="h-8 w-8 shrink-0" />
              <div className="hidden sm:block leading-none truncate">
                <div className="font-display text-[12px] tracking-[0.25em] silver-text">SPACEX IPO</div>
                <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground mt-0.5">INVESTOR PORTAL</div>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <div className="hidden sm:flex"><LanguageSelector /></div>
            <div className="hidden sm:flex"><CountrySelector /></div>
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-border bg-surface/30 min-h-[calc(100vh-4rem)] sticky top-16">
          <SidebarNav path={path} />
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <>
            <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
            <aside className="fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-background lg:hidden overflow-y-auto">
              <div className="h-16 flex items-center justify-between px-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Logo className="h-7 w-7" />
                  <span className="font-display text-[11px] tracking-[0.25em] silver-text">SPACEX IPO</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="h-9 w-9 grid place-items-center rounded-md border border-border">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div onClick={() => setMobileOpen(false)}>
                <SidebarNav path={path} />
              </div>
            </aside>
          </>
        )}

        <main className="flex-1 min-w-0 px-3 sm:px-4 lg:px-8 py-5 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarNav({ path }: { path: string }) {
  return (
    <nav className="p-4 space-y-6">
      {nav.map((section) => (
        <div key={section.group}>
          <div className="text-[10px] font-mono tracking-[0.3em] text-muted-foreground px-3 pb-2">{section.group}</div>
          <div className="space-y-0.5">
            {section.items.map((it) => {
              const active = path === it.to || path.startsWith(it.to + "/");
              const Icon = it.icon;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors ${active ? "bg-accent-blue/10 text-accent-blue border-l-2 border-accent-blue" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border-l-2 border-transparent"}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{it.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
