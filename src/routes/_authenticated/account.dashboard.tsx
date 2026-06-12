import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Wallet, Briefcase, TrendingUp, Clock, ArrowRight, Plus, Upload, HelpCircle, Banknote, Sparkles, Users, Award } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader, StatCard, Panel, Pill } from "@/components/dashboard/ui";
import { getMyWallet, getMyInvestments, getMyWalletTransactions, getOpportunities, getMyNotifications } from "@/lib/data/portal";
import { getMyPoints, getMyReferrals, getMyReferralRewards } from "@/lib/m9";
import { supabase } from "@/integrations/supabase/client";
import { useFormatters } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/account/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — SpaceX IPO Exchange" }] }),
  component: DashboardHome,
});

function DashboardHome() {
  const { t } = useTranslation();
  const { formatCurrency, formatNumber, formatDateTime } = useFormatters();
  const [wallet, setWallet] = useState<any>(null);
  const [invs, setInvs] = useState<any[]>([]);
  const [txs, setTxs] = useState<any[]>([]);
  const [opps, setOpps] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [points, setPoints] = useState<any>(null);
  const [refs, setRefs] = useState<any[]>([]);
  const [refRewards, setRefRewards] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [stockShares, setStockShares] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const [w, i, txns, o, n, p, r, rr, ua, th, sh] = await Promise.all([
        getMyWallet(), getMyInvestments(), getMyWalletTransactions(5), getOpportunities(), getMyNotifications(5),
        getMyPoints(), getMyReferrals(), getMyReferralRewards(),
        user ? supabase.from("user_achievements").select("id, earned_at, achievement:achievements(code,title,icon,points)").eq("user_id", user.id).order("earned_at", { ascending: false }).limit(5).then(r => r.data ?? []) : Promise.resolve([]),
        user ? supabase.from("tesla_holdings").select("shares").eq("user_id", user.id).then(r => r.data ?? []) : Promise.resolve([]),
        user ? supabase.from("spacex_holdings").select("shares").eq("user_id", user.id).then(r => r.data ?? []) : Promise.resolve([]),
      ]);
      setWallet(w); setInvs(i); setTxs(txns); setOpps(o); setNotes(n);
      setPoints(p); setRefs(r); setRefRewards(rr); setAchievements(ua as any[]);
      const sum = [...(th as any[]), ...(sh as any[])].reduce((a, b) => a + Number(b.shares || 0), 0);
      setStockShares(sum);
    })();
  }, []);


  const totalShares = stockShares + invs.filter((i) => i.status === "active").reduce((a, b) => a + Number(b.shares || 0), 0);
  const totalValue = invs.filter((i) => i.status === "active").reduce((a, b) => a + Number(b.amount || 0), 0);
  const pending = invs.filter((i) => i.approval_status === "pending").reduce((a, b) => a + Number(b.amount || 0), 0);
  const cash = Number(wallet?.balance ?? 0);

  const growth = (() => {
    if (!txs.length) return [{ m: t("common.loading"), v: totalValue + cash }];
    const sorted = [...txs].reverse();
    return sorted.map((tx, i) => ({ m: new Date(tx.created_at).toLocaleString(undefined, { month: "short" }), v: Number(tx.balance_after) + totalValue * ((i + 1) / sorted.length) }));
  })();

  return (
    <div>
      <PageHeader title={t("dashboard.title")} subtitle={t("dashboard.subtitle")} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4">
        <Link to="/account/holdings"><StatCard label={t("dashboard.stats.portfolioValue")} value={formatCurrency(totalValue + cash)} icon={<TrendingUp className="h-4 w-4" />} /></Link>
        <Link to="/account/holdings"><StatCard label={t("dashboard.stats.sharesOwned")} value={formatNumber(Math.round(totalShares))} icon={<Briefcase className="h-4 w-4" />} /></Link>
        <Link to="/account/investments"><StatCard label={t("dashboard.stats.pending")} value={formatCurrency(pending)} icon={<Clock className="h-4 w-4" />} /></Link>
        <Link to="/account/wallet"><StatCard label={t("dashboard.stats.wallet")} value={formatCurrency(cash)} icon={<Wallet className="h-4 w-4" />} /></Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <Link to="/account/spacex" className="glass-card rounded-lg p-3 flex flex-col items-center justify-center gap-1.5 text-center hover:border-accent-blue/40 transition-colors">
          <Sparkles className="h-4 w-4 text-accent-blue" /><span className="text-xs font-medium">{t("dashboard.quickLinks.spacexStock")}</span>
        </Link>
        <Link to="/account/tesla" className="glass-card rounded-lg p-3 flex flex-col items-center justify-center gap-1.5 text-center hover:border-accent-blue/40 transition-colors">
          <TrendingUp className="h-4 w-4 text-accent-blue" /><span className="text-xs font-medium">{t("dashboard.quickLinks.teslaStock")}</span>
        </Link>
        <Link to="/account/tesla-vehicles" className="glass-card rounded-lg p-3 flex flex-col items-center justify-center gap-1.5 text-center hover:border-accent-blue/40 transition-colors">
          <Sparkles className="h-4 w-4 text-accent-blue" /><span className="text-xs font-medium">{t("dashboard.quickLinks.teslaVehicles")}</span>
        </Link>
        <Link to="/account/holdings" className="glass-card rounded-lg p-3 flex flex-col items-center justify-center gap-1.5 text-center hover:border-accent-blue/40 transition-colors">
          <Briefcase className="h-4 w-4 text-accent-blue" /><span className="text-xs font-medium">{t("dashboard.quickLinks.holdings")}</span>
        </Link>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4 mb-4">
        <Link to="/account/rewards" className="glass-card rounded-xl p-3.5 sm:p-4 hover:border-accent-blue/40 transition-colors">
          <div className="flex items-center gap-2 text-xs font-mono tracking-[0.2em] text-muted-foreground uppercase mb-2"><Sparkles className="h-3.5 w-3.5 text-accent-blue" />{t("dashboard.summary.rewards")}</div>
          <div className="text-xl sm:text-2xl font-semibold tabular-nums">{formatNumber(Number(points?.points ?? 0))} <span className="text-xs text-muted-foreground font-normal">{t("dashboard.summary.points")}</span></div>
          <div className="text-[11px] text-muted-foreground mt-1">{t("dashboard.summary.lifetime", { count: formatNumber(Number(points?.lifetime_points ?? 0)) as unknown as number })}</div>
        </Link>
        <Link to="/account/referrals" className="glass-card rounded-xl p-3.5 sm:p-4 hover:border-accent-blue/40 transition-colors">
          <div className="flex items-center gap-2 text-xs font-mono tracking-[0.2em] text-muted-foreground uppercase mb-2"><Users className="h-3.5 w-3.5 text-accent-blue" />{t("dashboard.summary.referrals")}</div>
          <div className="text-xl sm:text-2xl font-semibold tabular-nums">{refs.length}</div>
          <div className="text-[11px] text-muted-foreground mt-1">{t("dashboard.summary.earned", { amount: formatCurrency(refRewards.reduce((s, r: any) => s + Number(r.amount || 0), 0)) })}</div>
        </Link>
        <Link to="/account/achievements" className="glass-card rounded-xl p-3.5 sm:p-4 hover:border-accent-blue/40 transition-colors">
          <div className="flex items-center gap-2 text-xs font-mono tracking-[0.2em] text-muted-foreground uppercase mb-2"><Award className="h-3.5 w-3.5 text-accent-blue" />{t("dashboard.summary.achievements")}</div>
          <div className="text-xl sm:text-2xl font-semibold tabular-nums">{achievements.length}</div>
          <div className="text-[11px] text-muted-foreground mt-1 truncate">
            {achievements[0]?.achievement?.title ? t("dashboard.summary.latest", { name: achievements[0].achievement.title }) : t("dashboard.summary.firstBadge")}
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-5 gap-2 mb-4">
        <QuickAction to="/account/funding" icon={<Plus className="h-4 w-4" />} label={t("dashboard.actions.fund")} />
        <QuickAction to="/account/opportunities" icon={<TrendingUp className="h-4 w-4" />} label={t("dashboard.actions.invest")} />
        <QuickAction to="/account/funding" icon={<Banknote className="h-4 w-4" />} label={t("dashboard.actions.withdraw")} />
        <QuickAction to="/account/documents" icon={<Upload className="h-4 w-4" />} label={t("dashboard.actions.documents")} />
        <QuickAction to="/account/support" icon={<HelpCircle className="h-4 w-4" />} label={t("dashboard.actions.support")} />
      </div>


      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Panel title={t("dashboard.panels.growth")} className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={growth} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="m" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v, undefined, { maximumFractionDigits: 0, notation: "compact" })} />
                <Tooltip contentStyle={{ background: "rgba(15,18,28,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title={t("dashboard.panels.notifications")} action={<Link to="/account/notifications" className="text-xs text-accent-blue hover:underline">{t("common.viewAll")}</Link>}>
          <ul className="space-y-3">
            {notes.length === 0 && <li className="text-xs text-muted-foreground">{t("dashboard.panels.empty.notifications")}</li>}
            {notes.map((n) => (
              <li key={n.id} className="border-b border-border last:border-0 pb-3 last:pb-0">
                <div className="text-sm text-foreground leading-snug">{n.title}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{formatDateTime(n.created_at)}</div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Panel title={t("dashboard.panels.recentActivity")} className="lg:col-span-2" action={<Link to="/account/transactions" className="text-xs text-accent-blue hover:underline flex items-center gap-1">{t("common.viewAll")} <ArrowRight className="h-3 w-3" /></Link>}>
          <ul className="divide-y divide-border">
            {txs.length === 0 && <li className="py-6 text-center text-xs text-muted-foreground">{t("dashboard.panels.empty.transactions")}</li>}
            {txs.map((tx) => (
              <li key={tx.id} className="py-3 grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center">
                <div className="min-w-0">
                  <div className="text-sm text-foreground truncate capitalize">{t(`transactions.types.${tx.transaction_type}`, { defaultValue: tx.transaction_type })} · <span className="text-muted-foreground">{tx.reference}</span></div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{formatDateTime(tx.created_at)}</div>
                </div>
                <div className={`text-sm font-medium ${["deposit", "dividend"].includes(tx.transaction_type) ? "text-emerald-400" : "text-foreground"}`}>
                  {["deposit", "dividend"].includes(tx.transaction_type) ? "+" : "−"}{formatCurrency(Number(tx.amount))}
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title={t("dashboard.panels.latestOpportunities")} action={<Link to="/account/opportunities" className="text-xs text-accent-blue hover:underline">{t("common.viewAll")}</Link>}>
          <ul className="space-y-3">
            {opps.slice(0, 3).map((o) => (
              <li key={o.id} className="rounded-lg border border-border p-3 hover:border-accent-blue/40 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="text-sm font-medium text-foreground truncate">{o.title}</div>
                  <Pill tone="info">{o.category}</Pill>
                </div>
                <div className="text-[11px] text-muted-foreground">{t("dashboard.panels.minTarget", { min: formatCurrency(Number(o.minimum_investment)), target: formatCurrency(Number(o.target_amount)) })}</div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function QuickAction({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="glass-card rounded-lg p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1 sm:gap-1.5 text-center hover:border-accent-blue/40 hover:text-accent-blue transition-colors min-w-0">
      <span className="text-accent-blue">{icon}</span>
      <span className="text-[10px] sm:text-xs font-medium text-foreground leading-tight truncate w-full">{label}</span>
    </Link>
  );
}
