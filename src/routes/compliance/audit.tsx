// Compliance audit log view.
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel, DataTable, Td } from "@/components/staff/ui";
import { staffGetAuditLogs } from "@/lib/data/portal";

export const Route = createFileRoute("/compliance/audit")({ component: AuditPage });

function AuditPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { (async () => setRows(await staffGetAuditLogs(300)))(); }, []);
  return (
    <div>
      <PageHeader eyebrow="GOVERNANCE" title="Audit Log" subtitle="Compliance-visible activity record." />
      <Panel>
        <DataTable columns={["Action", "Entity", "Actor Role", "Timestamp"]}>
          {rows.map((l: any) => (
            <tr key={l.id}>
              <Td><span className="font-mono text-[11px] text-accent-blue">{l.action_type}</span></Td>
              <Td>{l.entity_type}</Td>
              <Td><span className="text-xs">{l.actor_role ?? "—"}</span></Td>
              <Td><span className="text-xs text-muted-foreground font-mono">{new Date(l.created_at).toLocaleString()}</span></Td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
