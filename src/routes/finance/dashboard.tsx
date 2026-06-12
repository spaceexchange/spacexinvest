import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Wallet, TrendingUp } from "lucide-react";
import { PageHeader, StatCard, Panel, Pill } from "@/components/staff/ui";
import { staffGetDashboardStats, staffGetAllFundingRequests, moneyc } from "@/lib/data/portal";

export const Route = createFileRoute("/finance/dashboard")({ component: Dashboard });

function Dashboard() {
  const [s, setS] = useState<any>(null);
  const [funding, setFunding] = useState<any[]>([]);
  useEffect(() => {
    (async () => { setS(await staffGetDashboardStats()); setFunding(await staffGetAllFundingRequests()); })();
  }, []);
  if (!s) return <div className="text-sm text-muted-foreground">Loading…</div>;
  const pendingDeposits = funding.filter(f => f.status === "pending" && f.request_type === "deposit");
  const pendingWith = funding.filter(f => f.status === "pending" && f.request_type === "withdrawal");
  return (
    <div>
      <PageHeader eyebrow="FINANCE DESK" title="Treasury Operations" subtitle="Live balances, pending flows, and platform liquidity." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label="Wallet Balances" value={moneyc(s.walletBalances)} icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="AUM" value={moneyc(s.aum)} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Pending Deposits" value={pendingDeposits.length} tone="warning" icon={<ArrowDownToLine className="h-4 w-4" />} />
        <StatCard label="Pending Withdrawals" value={pendingWith.length} tone="warning" icon={<ArrowUpFromLine className="h-4 w-4" />} />
      </div>
      <Panel title="Pending Funding Requests">
        <ul className="divide-y divide-border/60">
          {funding.filter(f => f.status === "pending").slice(0, 12).map((f: any) => (
            <li key={f.id} className="py-2 text-sm flex items-center justify-between">
              <div className="min-w-0">
                <div className="truncate font-medium">{f.profile?.email ?? "—"}</div>
                <div className="text-[11px] text-muted-foreground">{f.request_type} • {f.payment_method}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{moneyc(Number(f.amount))}</span>
                <Pill tone="warning">{f.request_type}</Pill>
              </div>
            </li>
          ))}
          {funding.filter(f => f.status === "pending").length === 0 && <div className="text-sm text-muted-foreground py-3">No pending requests.</div>}
        </ul>
      </Panel>
    </div>
  );
}
