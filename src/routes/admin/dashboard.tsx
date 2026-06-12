import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Briefcase, Wallet, ShieldAlert, ArrowDownToLine, ShieldCheck, Clock, AlertTriangle, Inbox } from "lucide-react";
import { PageHeader, StatCard, Panel, Pill } from "@/components/staff/ui";
import { staffGetDashboardStats, staffGetAllInvestments, staffGetAuditLogs, moneyc } from "@/lib/data/portal";

export const Route = createFileRoute("/admin/dashboard")({ component: AdminDashboard });

function AdminDashboard() {
  const [s, setS] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      setS(await staffGetDashboardStats());
      const invs = await staffGetAllInvestments();
      setPending(invs.filter((i: any) => i.approval_status === "pending").slice(0, 8));
      setLogs((await staffGetAuditLogs(10)));
    })();
  }, []);
  if (!s) return <div className="text-sm text-muted-foreground">Loading…</div>;
  return (
    <div>
      <PageHeader eyebrow="ADMIN CONSOLE" title="Platform Control" subtitle="Live operational overview from the production database."
        action={<Pill tone="success">Live</Pill>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label="Total Users" value={s.totalUsers.toLocaleString()} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Verified Investors" value={s.verifiedInvestors.toLocaleString()} icon={<Briefcase className="h-4 w-4" />} />
        <StatCard label="Assets Under Mgmt" value={moneyc(s.aum)} icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Wallet Balances" value={moneyc(s.walletBalances)} icon={<Wallet className="h-4 w-4" />} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Open Opportunities" value={s.openOpportunities} icon={<Briefcase className="h-4 w-4" />} />
        <StatCard label="KYC Pending" value={s.pendingKyc} icon={<Clock className="h-4 w-4" />} tone="warning" />
        <StatCard label="Pending Funding" value={s.pendingFunding} icon={<ArrowDownToLine className="h-4 w-4" />} tone="warning" />
        <StatCard label="Open Tickets" value={s.openTickets} icon={<Inbox className="h-4 w-4" />} tone="warning" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Pending Investment Approvals" action={<Link to="/admin/investments" className="text-xs text-accent-blue">View all →</Link>}>
          {pending.length === 0 && <div className="text-sm text-muted-foreground">No pending approvals.</div>}
          <ul className="space-y-2">
            {pending.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm border border-border rounded-md px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate">{p.profile?.display_name ?? p.profile?.email ?? "—"} → <span className="text-muted-foreground">{p.opportunity?.title ?? "—"}</span></div>
                  <div className="text-[11px] text-muted-foreground font-mono">{new Date(p.created_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-mono text-sm">{moneyc(Number(p.amount))}</div>
                  <Pill tone="warning">pending</Pill>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Recent Audit Activity" action={<Link to="/admin/audit" className="text-xs text-accent-blue">All logs →</Link>}>
          <ul className="space-y-2">
            {logs.map((l: any) => (
              <li key={l.id} className="text-sm border border-border rounded-md px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-accent-blue">{l.action_type}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{new Date(l.created_at).toLocaleString()}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 truncate">{l.entity_type} • {l.entity_id}</div>
              </li>
            ))}
            {logs.length === 0 && <div className="text-sm text-muted-foreground">No activity yet.</div>}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
