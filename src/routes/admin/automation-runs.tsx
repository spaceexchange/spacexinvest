import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Pill, DataTable, Td, btnSecondary } from "@/components/staff/ui";
import { listAutomationRuns } from "@/lib/m9-help";
import { Activity } from "lucide-react";

export const Route = createFileRoute("/admin/automation-runs")({ component: AutomationRunsPage });

function AutomationRunsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const reload = async () => setRows(await listAutomationRuns(undefined, 200));
  useEffect(() => { reload(); const t = setInterval(reload, 15000); return () => clearInterval(t); }, []);

  return (
    <div>
      <PageHeader eyebrow="OPERATIONS" title="Automation Runs" subtitle="Execution log for all automation rules. Refreshes every 15s."
        action={<button className={btnSecondary} onClick={reload}>Refresh</button>} />
      <Panel padded={false}>
        <DataTable columns={["Rule","Trigger","Status","Duration","When"]}>
          {rows.map((r) => (
            <tr key={r.id}>
              <Td><div className="font-medium text-sm">{r.rule?.name ?? "—"}</div></Td>
              <Td><span className="text-xs font-mono text-muted-foreground">{r.trigger}</span></Td>
              <Td><Pill tone={r.status === "success" ? "success" : "danger"}>{r.status}</Pill></Td>
              <Td><span className="text-xs font-mono">{r.duration_ms ?? "—"}ms</span></Td>
              <Td><span className="text-[11px] font-mono text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span></Td>
            </tr>
          ))}
        </DataTable>
        {rows.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground"><Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />No runs yet.</div>}
      </Panel>
    </div>
  );
}
