import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { PageHeader, Panel, DataTable, Td, inputCls } from "@/components/staff/ui";
import { staffGetAuditLogs } from "@/lib/data/portal";

export const Route = createFileRoute("/admin/audit")({ component: AuditPage });

function AuditPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { (async () => setRows(await staffGetAuditLogs(500)))(); }, []);
  const list = rows.filter((l: any) => !q ||
    l.action_type?.toLowerCase().includes(q.toLowerCase()) ||
    l.entity_type?.toLowerCase().includes(q.toLowerCase()) ||
    l.entity_id?.includes(q));
  return (
    <div>
      <PageHeader eyebrow="GOVERNANCE" title="Audit Log" subtitle="Immutable record of every privileged action." />
      <Panel>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search action, entity…" className={`${inputCls} w-full pl-9`} />
          </div>
        </div>
        <DataTable columns={["Action", "Entity", "Entity ID", "Actor", "Role", "Timestamp"]}>
          {list.map((l: any) => (
            <tr key={l.id}>
              <Td><span className="font-mono text-[11px] text-accent-blue">{l.action_type}</span></Td>
              <Td>{l.entity_type}</Td>
              <Td><span className="font-mono text-xs text-muted-foreground">{l.entity_id?.slice(0, 12)}…</span></Td>
              <Td><span className="font-mono text-xs">{l.actor_id?.slice(0, 8)}…</span></Td>
              <Td><span className="text-xs">{l.actor_role ?? "—"}</span></Td>
              <Td><span className="text-xs text-muted-foreground font-mono">{new Date(l.created_at).toLocaleString()}</span></Td>
            </tr>
          ))}
        </DataTable>
        {list.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No audit entries.</div>}
      </Panel>
    </div>
  );
}
