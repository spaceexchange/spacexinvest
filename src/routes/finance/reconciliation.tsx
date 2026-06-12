import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Pill, DataTable, Td, btnPrimary, btnSecondary, btnGhost, inputCls, statusTone } from "@/components/staff/ui";
import { listReconciliation, reconciliationStats } from "@/lib/staff-data";
import { useServerFn } from "@tanstack/react-start";
import { runReconciliation, updateReconciliation } from "@/lib/data/ops.functions";
import { useRealtimeChannel } from "@/lib/data/portal";
import { PlayCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/finance/reconciliation")({ component: ReconciliationPage });

function ReconciliationPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ matched: 0, unmatched: 0, exception: 0, investigating: 0, resolved: 0 });
  const [filter, setFilter] = useState("all");
  const runFn = useServerFn(runReconciliation);
  const updFn = useServerFn(updateReconciliation);

  const reload = async () => {
    setRows(await listReconciliation(filter === "all" ? undefined : filter));
    setStats(await reconciliationStats());
  };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [filter]);
  useRealtimeChannel("recon", [{ table: "reconciliation_records" }], reload);

  const run = async () => {
    try { const r: any = await runFn({}); toast.success(`Matched ${r.matched} · Unmatched ${r.unmatched}`); reload(); }
    catch (e: any) { toast.error(e.message); }
  };

  const update = async (id: string, status: string) => {
    try { await updFn({ data: { id, status: status as any } }); toast.success("Updated"); reload(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <PageHeader
        eyebrow="FINANCE"
        title="Reconciliation Engine"
        subtitle="Match deposits, withdrawals and ledger entries. Investigate exceptions."
        action={<button className={btnPrimary} onClick={run}><PlayCircle className="h-4 w-4" /> Run reconciliation</button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <StatBlock label="Matched" value={stats.matched} tone="success" />
        <StatBlock label="Unmatched" value={stats.unmatched} tone="warning" />
        <StatBlock label="Exceptions" value={stats.exception} tone="danger" />
        <StatBlock label="Investigating" value={stats.investigating} tone="info" />
        <StatBlock label="Resolved" value={stats.resolved} tone="success" />
      </div>

      <Panel className="mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <select className={inputCls} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="matched">Matched</option><option value="unmatched">Unmatched</option>
            <option value="exception">Exception</option><option value="investigating">Investigating</option><option value="resolved">Resolved</option>
          </select>
          <span className="text-xs text-muted-foreground">{rows.length} records</span>
        </div>
      </Panel>

      <Panel padded={false}>
        <DataTable columns={["Source", "Amount", "Diff", "Status", "Created", "Actions"]}>
          {rows.map((r) => (
            <tr key={r.id}>
              <Td>
                <div className="font-mono text-xs">{r.source_type}</div>
                <div className="text-[11px] text-muted-foreground font-mono">{(r.source_id ?? "").slice(0, 8)}</div>
              </Td>
              <Td>{Number(r.amount ?? 0).toLocaleString()} {r.currency}</Td>
              <Td>
                {Number(r.difference_amount) !== 0 ? (
                  <span className="text-red-400 inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{Number(r.difference_amount).toLocaleString()}</span>
                ) : <span className="text-emerald-400">0</span>}
              </Td>
              <Td><Pill tone={statusTone(r.status)}>{r.status}</Pill></Td>
              <Td><span className="text-xs text-muted-foreground font-mono">{new Date(r.created_at).toLocaleString()}</span></Td>
              <Td>
                <div className="flex gap-1 flex-wrap">
                  <button className={btnGhost} onClick={() => update(r.id, "investigating")}>Investigate</button>
                  <button className={btnGhost} onClick={() => update(r.id, "exception")}>Exception</button>
                  <button className={btnSecondary} onClick={() => update(r.id, "resolved")} style={{ height: 28 }}>Resolve</button>
                </div>
              </Td>
            </tr>
          ))}
        </DataTable>
        {rows.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No records — run reconciliation to populate.</div>}
      </Panel>
    </div>
  );
}

function StatBlock({ label, value, tone }: any) {
  const color = tone === "success" ? "text-emerald-400" : tone === "warning" ? "text-yellow-400" : tone === "danger" ? "text-red-400" : "text-accent-blue";
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="text-[10px] font-mono tracking-[0.25em] text-muted-foreground uppercase mb-1">{label}</div>
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}
