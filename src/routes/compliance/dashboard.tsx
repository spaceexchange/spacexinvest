import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Clock, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader, StatCard, Panel, Pill } from "@/components/staff/ui";
import { staffGetAllKyc } from "@/lib/data/portal";

export const Route = createFileRoute("/compliance/dashboard")({ component: Dashboard });

function Dashboard() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { (async () => setRows(await staffGetAllKyc()))(); }, []);
  const pending = rows.filter(r => r.status === "pending");
  const approved = rows.filter(r => r.status === "approved");
  const rejected = rows.filter(r => r.status === "rejected");
  return (
    <div>
      <PageHeader eyebrow="COMPLIANCE DESK" title="KYC & AML Overview" subtitle="Identity verification pipeline across the platform." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label="Pending" value={pending.length} tone="warning" icon={<Clock className="h-4 w-4" />} />
        <StatCard label="Approved" value={approved.length} tone="success" icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="Rejected" value={rejected.length} tone="danger" icon={<XCircle className="h-4 w-4" />} />
        <StatCard label="Total" value={rows.length} icon={<ShieldCheck className="h-4 w-4" />} />
      </div>
      <Panel title="Recent Submissions">
        <ul className="divide-y divide-border/60">
          {rows.slice(0, 10).map((k: any) => (
            <li key={k.id} className="py-2 text-sm flex items-center justify-between">
              <div className="min-w-0">
                <div className="truncate font-medium">{k.first_name} {k.last_name}</div>
                <div className="text-[11px] text-muted-foreground">{k.profile?.email} • {k.nationality ?? "—"}</div>
              </div>
              <Pill tone={k.status === "approved" ? "success" : k.status === "rejected" ? "danger" : "warning"}>{k.status}</Pill>
            </li>
          ))}
          {rows.length === 0 && <div className="text-sm text-muted-foreground py-3">No submissions yet.</div>}
        </ul>
      </Panel>
    </div>
  );
}
