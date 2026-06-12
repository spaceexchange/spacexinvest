import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel } from "@/components/staff/ui";
import { executiveDashboard } from "@/lib/m7";
import { moneyc } from "@/lib/data/portal";
import { Users, TrendingUp, Wallet, BarChart3, ArrowDownToLine, ArrowUpFromLine, Briefcase, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/admin/analytics")({ component: ExecAnalytics });

function ExecAnalytics() {
  const [d, setD] = useState<any>(null);
  useEffect(() => { executiveDashboard().then(setD); }, []);

  if (!d) return <div className="text-sm text-muted-foreground">Loading executive dashboard…</div>;

  const conv = d.leadCount > 0 ? ((d.convertedLeads / d.leadCount) * 100).toFixed(1) : "0";
  const net30 = d.deposits30d - d.withdrawals30d;

  return (
    <div>
      <PageHeader eyebrow="EXECUTIVE" title="Executive Analytics" subtitle="Top-level KPIs across the platform." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat icon={<Users />} label="Investors" value={d.investorCount.toLocaleString()} sub={`${d.kycApproved} KYC verified`} />
        <Stat icon={<Wallet />} label="AUM" value={moneyc(d.aum)} sub="Wallets + invested" tone="accent" />
        <Stat icon={<TrendingUp />} label="Invested" value={moneyc(d.totalInvested)} sub={`${d.opportunityCount} opportunities`} />
        <Stat icon={<BarChart3 />} label="Conversion" value={`${conv}%`} sub={`${d.convertedLeads}/${d.leadCount} leads`} />
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-5">
        <Stat icon={<ArrowDownToLine />} label="Deposits (30d)" value={moneyc(d.deposits30d)} tone="success" />
        <Stat icon={<ArrowUpFromLine />} label="Withdrawals (30d)" value={moneyc(d.withdrawals30d)} tone="warning" />
        <Stat icon={<BarChart3 />} label="Net cashflow" value={moneyc(net30)} tone={net30 >= 0 ? "success" : "danger"} />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Panel title="Customer ops">
          <Row icon={<MessageCircle className="h-4 w-4" />} label="Open support tickets" value={d.openTickets} />
          <Row icon={<Briefcase className="h-4 w-4" />} label="Active opportunities" value={d.opportunityCount} />
        </Panel>
        <Panel title="Funnel">
          <Row label="Total leads" value={d.leadCount} />
          <Row label="Converted" value={d.convertedLeads} />
          <Row label="Conversion rate" value={`${conv}%`} />
        </Panel>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, sub, tone }: any) {
  const color = tone === "success" ? "text-emerald-400" : tone === "warning" ? "text-yellow-400" : tone === "danger" ? "text-red-400" : tone === "accent" ? "text-accent-blue" : "text-foreground";
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono tracking-[0.25em] text-muted-foreground uppercase">{label}</span>
        <span className="text-accent-blue">{icon}</span>
      </div>
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function Row({ icon, label, value }: any) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex items-center gap-2 text-sm text-foreground/80">{icon}{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
