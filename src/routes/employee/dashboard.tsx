import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckSquare, FileText, Inbox, Users } from "lucide-react";
import { PageHeader, StatCard, Panel } from "@/components/staff/ui";
import { staffGetDashboardStats, staffGetAllDocuments } from "@/lib/data/portal";

export const Route = createFileRoute("/employee/dashboard")({ component: EmployeeDashboard });

function EmployeeDashboard() {
  const [s, setS] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      setS(await staffGetDashboardStats());
      setDocs(await staffGetAllDocuments(8));
    })();
  }, []);
  if (!s) return <div className="text-sm text-muted-foreground">Loading…</div>;
  return (
    <div>
      <PageHeader eyebrow="STAFF WORKSPACE" title="Operations Hub" subtitle="Documents, tasks, and platform activity." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label="Total Users" value={s.totalUsers} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Open Tickets" value={s.openTickets} icon={<Inbox className="h-4 w-4" />} />
        <StatCard label="Pending KYC" value={s.pendingKyc} icon={<CheckSquare className="h-4 w-4" />} />
        <StatCard label="Pending Funding" value={s.pendingFunding} icon={<FileText className="h-4 w-4" />} />
      </div>
      <Panel title="Latest Documents">
        <ul className="divide-y divide-border/60">
          {docs.map((d: any) => (
            <li key={d.id} className="py-2 text-sm flex items-center justify-between">
              <div className="min-w-0">
                <div className="truncate font-medium">{d.document_name}</div>
                <div className="text-[11px] text-muted-foreground">{d.profile?.email ?? "—"} • {d.document_type}</div>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">{new Date(d.uploaded_at).toLocaleDateString()}</span>
            </li>
          ))}
          {docs.length === 0 && <div className="text-sm text-muted-foreground py-3">No documents yet.</div>}
        </ul>
      </Panel>
    </div>
  );
}
