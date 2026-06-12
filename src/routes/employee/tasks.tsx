import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Pill } from "@/components/staff/ui";
import { staffGetAllTickets, staffGetAllFundingRequests, staffGetAllKyc } from "@/lib/data/portal";

export const Route = createFileRoute("/employee/tasks")({ component: TasksPage });

function TasksPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [funding, setFunding] = useState<any[]>([]);
  const [kyc, setKyc] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      setTickets(await staffGetAllTickets());
      setFunding(await staffGetAllFundingRequests());
      setKyc(await staffGetAllKyc());
    })();
  }, []);
  const cols = [
    { title: "Open Tickets", items: tickets.filter(t => t.status === "open" || t.status === "pending").map(t => ({ id: t.id, label: t.subject, sub: t.profile?.email })) },
    { title: "Pending KYC", items: kyc.filter(k => k.status === "pending").map(k => ({ id: k.id, label: `${k.first_name} ${k.last_name}`, sub: k.profile?.email })) },
    { title: "Pending Funding", items: funding.filter(f => f.status === "pending").map(f => ({ id: f.id, label: `${f.request_type} $${Number(f.amount).toLocaleString()}`, sub: f.profile?.email })) },
  ];
  return (
    <div>
      <PageHeader eyebrow="STAFF WORKSPACE" title="Operational Tasks" subtitle="Live operational queues across the platform." />
      <div className="grid md:grid-cols-3 gap-4">
        {cols.map(c => (
          <Panel key={c.title} title={c.title}>
            <ul className="space-y-2">
              {c.items.slice(0, 12).map((it: any) => (
                <li key={it.id} className="border border-border rounded-md p-3 text-sm">
                  <div className="font-medium truncate">{it.label}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{it.sub ?? "—"}</div>
                </li>
              ))}
              {c.items.length === 0 && <div className="text-sm text-muted-foreground">Nothing here.</div>}
            </ul>
            <div className="mt-3"><Pill>{c.items.length} item{c.items.length === 1 ? "" : "s"}</Pill></div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
