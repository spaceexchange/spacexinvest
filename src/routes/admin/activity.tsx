import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Pill, DataTable, Td, inputCls, btnSecondary } from "@/components/staff/ui";
import { activityFeed } from "@/lib/m7";
import { useRealtimeChannel } from "@/lib/data/portal";
import { Activity } from "lucide-react";

export const Route = createFileRoute("/admin/activity")({ component: ActivityPage });

function ActivityPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [entityType, setEntityType] = useState("");
  const [since, setSince] = useState("");
  const reload = async () => setRows(await activityFeed({ entity_type: entityType || undefined, since: since || undefined }));
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [entityType, since]);
  useRealtimeChannel("activity-feed", [{ table: "audit_logs" }], reload);

  return (
    <div>
      <PageHeader eyebrow="GOVERNANCE" title="Activity Timeline" subtitle="Global audit feed across all systems." />
      <Panel className="mb-5">
        <div className="flex flex-wrap gap-2 items-center">
          <input className={inputCls} placeholder="Entity type (e.g. profile, funding_request)" value={entityType} onChange={(e) => setEntityType(e.target.value)} />
          <input className={inputCls} type="datetime-local" value={since} onChange={(e) => setSince(e.target.value ? new Date(e.target.value).toISOString() : "")} />
          <button className={btnSecondary} onClick={reload}>Refresh</button>
          <span className="text-xs text-muted-foreground ml-auto">{rows.length} events</span>
        </div>
      </Panel>

      <Panel padded={false}>
        <DataTable columns={["Action","Actor","Entity","Time"]}>
          {rows.map((r) => (
            <tr key={r.id}>
              <Td><Pill tone="info">{r.action}</Pill></Td>
              <Td>
                <div className="text-sm">{r.actor?.display_name ?? r.actor?.email ?? "system"}</div>
              </Td>
              <Td>
                <div className="text-xs font-mono">{r.entity_type ?? "—"}</div>
                {r.entity_id && <div className="text-[10px] text-muted-foreground font-mono">{r.entity_id.slice(0, 12)}</div>}
              </Td>
              <Td><span className="text-[11px] text-muted-foreground font-mono">{new Date(r.created_at).toLocaleString()}</span></Td>
            </tr>
          ))}
        </DataTable>
        {rows.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground"><Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />No events yet.</div>}
      </Panel>
    </div>
  );
}
