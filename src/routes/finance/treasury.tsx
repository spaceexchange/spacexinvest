import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wallet, TrendingUp, ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle2, ShieldAlert, Activity } from "lucide-react";
import { PageHeader, StatCard, Panel, Pill } from "@/components/staff/ui";
import { financeGetTreasuryStats, staffGetAllFundingRequests, moneyc, useRealtimeChannel } from "@/lib/data/portal";

export const Route = createFileRoute("/finance/treasury")({
  head: () => ({ meta: [{ title: "Treasury Center — Finance Desk" }] }),
  component: TreasuryPage,
});

function TreasuryPage() {
  const [s, setS] = useState<any>(null);
  const [funding, setFunding] = useState<any[]>([]);

  async function load() {
    const [stats, f] = await Promise.all([financeGetTreasuryStats(), staffGetAllFundingRequests()]);
    setS(stats); setFunding(f);
  }
  useEffect(() => { load(); }, []);
  useRealtimeChannel("treasury-live", [
    { table: "funding_requests" }, { table: "wallets" }, { table: "wallet_transactions" },
  ], load);

  if (!s) return <div className="text-sm text-muted-foreground">Loading treasury…</div>;

  const stages = funding.reduce((acc: Record<string, number>, f) => {
    const k = f.workflow_stage ?? f.status;
    acc[k] = (acc[k] ?? 0) + 1; return acc;
  }, {});

  const recent = funding.slice(0, 10);

  return (
    <div>
      <PageHeader eyebrow="FINANCE DESK" title="Treasury Center" subtitle="Real-time platform liquidity, payment flows, and cashflow." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label="Platform USD" value={moneyc(s.totalAssets)} icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Assets Under Management" value={moneyc(s.aum)} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Pending Deposits" value={moneyc(s.pendingDeposits)} tone="warning" icon={<ArrowDownToLine className="h-4 w-4" />} />
        <StatCard label="Pending Withdrawals" value={moneyc(s.pendingWithdrawals)} tone="warning" icon={<ArrowUpFromLine className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="24h Volume" value={moneyc(s.volumeDaily)} icon={<Activity className="h-4 w-4" />} />
        <StatCard label="7d Volume" value={moneyc(s.volumeWeekly)} />
        <StatCard label="30d Volume" value={moneyc(s.volumeMonthly)} />
        <StatCard label="Compliance Queue" value={s.complianceQueue} tone={s.complianceQueue ? "danger" : "default"} icon={<ShieldAlert className="h-4 w-4" />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Panel title="Workflow Pipeline">
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {[
              { k: "pending", label: "Pending", icon: Clock, tone: "warning" as const },
              { k: "compliance_review", label: "Compliance", icon: ShieldAlert, tone: "warning" as const },
              { k: "finance_review", label: "Finance", icon: Wallet, tone: "info" as const },
              { k: "approved", label: "Approved", icon: CheckCircle2, tone: "success" as const },
              { k: "sent", label: "Sent", icon: ArrowUpFromLine, tone: "info" as const },
              { k: "completed", label: "Completed", icon: CheckCircle2, tone: "success" as const },
            ].map((x) => (
              <li key={x.k} className="rounded-lg border border-border bg-surface/40 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2"><x.icon className="h-4 w-4 text-muted-foreground" /><span>{x.label}</span></div>
                <Pill tone={x.tone}>{stages[x.k] ?? 0}</Pill>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Cashflow (30d)">
          <div className="space-y-3">
            <Row label="Deposits in" value={moneyc(s.depositsMonthly)} tone="success" />
            <Row label="Withdrawals out" value={`−${moneyc(s.withdrawalsMonthly)}`} tone="danger" />
            <div className="h-px bg-border my-2" />
            <Row label="Net flow" value={moneyc(s.depositsMonthly - s.withdrawalsMonthly)} tone={(s.depositsMonthly - s.withdrawalsMonthly) >= 0 ? "success" : "danger"} bold />
            <Row label="Active wallets" value={String(s.walletCount)} />
            <Row label="Frozen wallets" value={String(s.frozenWallets)} tone={s.frozenWallets ? "danger" : "default"} />
          </div>
        </Panel>
      </div>

      <Panel title="Recent Activity">
        <ul className="divide-y divide-border/60">
          {recent.length === 0 && <div className="text-sm text-muted-foreground py-4">No activity.</div>}
          {recent.map((f: any) => (
            <li key={f.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{f.profile?.email ?? "—"}</div>
                <div className="text-[11px] text-muted-foreground capitalize">
                  {f.request_type} · {f.payment_method} · {(f.workflow_stage ?? f.status).replace(/_/g, " ")}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm">{Number(f.amount).toLocaleString()} {f.asset || f.currency}</div>
                <div className="text-[10px] text-muted-foreground">{new Date(f.created_at).toLocaleString()}</div>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function Row({ label, value, tone = "default", bold = false }: { label: string; value: string; tone?: "default" | "success" | "danger"; bold?: boolean }) {
  const color = tone === "success" ? "text-emerald-400" : tone === "danger" ? "text-red-400" : "text-foreground";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono ${color} ${bold ? "font-semibold" : ""}`}>{value}</span>
    </div>
  );
}
