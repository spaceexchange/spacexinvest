import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Inbox, AlertTriangle, CheckCircle2, ShieldCheck, Users } from "lucide-react";
import { PageHeader, StatCard, Panel, Pill } from "@/components/staff/ui";
import { staffGetAllTickets, staffGetAllKyc, staffGetAllUsers } from "@/lib/data/portal";

export const Route = createFileRoute("/support/dashboard")({ component: SupportDashboard });

function SupportDashboard() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [kyc, setKyc] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      setTickets(await staffGetAllTickets());
      setKyc(await staffGetAllKyc());
      setUsers(await staffGetAllUsers(8));
    })();
  }, []);
  const open = tickets.filter(t => t.status === "open" || t.status === "pending");
  const escalated = tickets.filter(t => t.status === "escalated");
  const resolvedToday = tickets.filter(t => t.status === "resolved" && new Date(t.updated_at).toDateString() === new Date().toDateString());
  return (
    <div>
      <PageHeader eyebrow="SUPPORT DESK" title="Customer Operations" subtitle="Live tickets, verifications, and customer activity." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label="Open Tickets" value={open.length} icon={<Inbox className="h-4 w-4" />} tone="warning" />
        <StatCard label="Escalated" value={escalated.length} icon={<AlertTriangle className="h-4 w-4" />} tone="danger" />
        <StatCard label="Resolved Today" value={resolvedToday.length} icon={<CheckCircle2 className="h-4 w-4" />} tone="success" />
        <StatCard label="KYC Pending" value={kyc.filter(k => k.status === "pending").length} icon={<ShieldCheck className="h-4 w-4" />} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Open Tickets" action={<Link to="/support/tickets" className="text-xs text-accent-blue hover:underline">View all →</Link>}>
          <ul className="space-y-2">
            {open.slice(0, 8).map((t) => (
              <li key={t.id} className="flex items-center justify-between border border-border rounded-md p-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate">{t.subject}</div>
                  <div className="text-[11px] text-muted-foreground">{t.profile?.email} • {new Date(t.updated_at).toLocaleString()}</div>
                </div>
                <Pill tone={t.priority === "urgent" || t.priority === "high" ? "danger" : "default"}>{t.priority}</Pill>
              </li>
            ))}
            {open.length === 0 && <div className="text-sm text-muted-foreground">Inbox empty.</div>}
          </ul>
        </Panel>
        <Panel title="KYC Queue" action={<Link to="/support/compliance" className="text-xs text-accent-blue hover:underline">Review →</Link>}>
          <ul className="space-y-2">
            {kyc.filter(k => k.status === "pending").slice(0, 8).map((k) => (
              <li key={k.id} className="flex items-center justify-between border border-border rounded-md p-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate">{k.first_name} {k.last_name}</div>
                  <div className="text-[11px] text-muted-foreground">{k.profile?.email} • {k.nationality ?? "—"}</div>
                </div>
                <Pill tone="warning">{k.status}</Pill>
              </li>
            ))}
            {kyc.filter(k => k.status === "pending").length === 0 && <div className="text-sm text-muted-foreground">Queue empty.</div>}
          </ul>
        </Panel>
      </div>

      <Panel title="Recent Users" className="mt-4">
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {users.map((u) => (
            <li key={u.id} className="border border-border rounded-md p-3 text-sm">
              <div className="font-medium truncate">{u.display_name ?? u.email}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{u.email}</div>
              <div className="text-[11px] text-muted-foreground mt-2 font-mono">Joined: {new Date(u.created_at).toLocaleDateString()}</div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
