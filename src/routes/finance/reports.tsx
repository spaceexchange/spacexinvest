import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Pill, DataTable, Td, btnPrimary, btnSecondary, btnGhost, inputCls, statusTone } from "@/components/staff/ui";
import { reportDataset, listScheduledReports, listReportRuns } from "@/lib/staff-data";
import { useServerFn } from "@tanstack/react-start";
import { upsertScheduledReport, deleteScheduledReport, recordReportRun } from "@/lib/data/ops.functions";
import { exportCsv, exportXlsx, exportPdf, type Column } from "@/lib/exports";
import { FileDown, Plus, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";

const REPORT_TYPES: { key: string; label: string; columns: Column[] }[] = [
  { key: "aum", label: "AUM / Investments", columns: [
    { key: "id", label: "ID", width: 2 }, { key: "investor_id", label: "Investor", width: 2 },
    { key: "opportunity_id", label: "Opportunity", width: 2 }, { key: "amount", label: "Amount", width: 1 },
    { key: "shares", label: "Shares", width: 1 }, { key: "approval_status", label: "Status", width: 1 },
    { key: "created_at", label: "Date", width: 2 },
  ]},
  { key: "deposits", label: "Deposits", columns: [
    { key: "id", label: "ID" }, { key: "user_id", label: "User" }, { key: "amount", label: "Amount" },
    { key: "currency", label: "Cur" }, { key: "payment_method", label: "Method" }, { key: "status", label: "Status" },
    { key: "workflow_stage", label: "Stage" }, { key: "created_at", label: "Date" },
  ]},
  { key: "withdrawals", label: "Withdrawals", columns: [
    { key: "id", label: "ID" }, { key: "user_id", label: "User" }, { key: "amount", label: "Amount" },
    { key: "currency", label: "Cur" }, { key: "payment_method", label: "Method" }, { key: "status", label: "Status" },
    { key: "workflow_stage", label: "Stage" }, { key: "created_at", label: "Date" },
  ]},
  { key: "wallet_balances", label: "Wallet balances", columns: [
    { key: "user_id", label: "User" }, { key: "currency", label: "Currency" },
    { key: "balance", label: "Balance" }, { key: "status", label: "Status" }, { key: "updated_at", label: "Updated" },
  ]},
  { key: "compliance", label: "Compliance / KYC", columns: [
    { key: "id", label: "ID" }, { key: "user_id", label: "User" }, { key: "status", label: "Status" },
    { key: "first_name", label: "First" }, { key: "last_name", label: "Last" }, { key: "nationality", label: "Nationality" },
    { key: "created_at", label: "Submitted" },
  ]},
  { key: "audit", label: "Audit log", columns: [
    { key: "id", label: "ID" }, { key: "actor_id", label: "Actor" }, { key: "actor_role", label: "Role" },
    { key: "action_type", label: "Action" }, { key: "entity_type", label: "Entity" }, { key: "created_at", label: "Date" },
  ]},
  { key: "treasury", label: "Treasury (wallet txs)", columns: [
    { key: "id", label: "ID" }, { key: "transaction_type", label: "Type" }, { key: "amount", label: "Amount" },
    { key: "balance_after", label: "Balance" }, { key: "status", label: "Status" }, { key: "reference", label: "Ref" }, { key: "created_at", label: "Date" },
  ]},
];

export const Route = createFileRoute("/finance/reports")({ component: ReportsPage });

function ReportsPage() {
  const [type, setType] = useState("aum");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [showSched, setShowSched] = useState(false);
  const [schedule, setSchedule] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [format, setFormat] = useState<"csv" | "xlsx" | "pdf">("csv");
  const upsertSched = useServerFn(upsertScheduledReport);
  const delSched = useServerFn(deleteScheduledReport);
  const recordRun = useServerFn(recordReportRun);

  const current = REPORT_TYPES.find((r) => r.key === type)!;

  const reloadMeta = async () => {
    setSchedules(await listScheduledReports());
    setRuns(await listReportRuns(20));
  };
  useEffect(() => { reloadMeta(); }, []);

  const run = async () => {
    setLoading(true);
    const filters: any = { from: from ? new Date(from).toISOString() : undefined, to: to ? new Date(to + "T23:59:59").toISOString() : undefined };
    const data = await reportDataset(type, filters);
    setRows(data); setLoading(false);
  };

  const doExport = async (fmt: "csv" | "xlsx" | "pdf") => {
    if (rows.length === 0) { toast.error("Run the report first"); return; }
    const name = `${type}-${new Date().toISOString().slice(0, 10)}`;
    try {
      if (fmt === "csv") exportCsv(name, current.columns, rows);
      else if (fmt === "xlsx") exportXlsx(name, current.columns, rows, current.label);
      else await exportPdf(name, current.label, current.columns, rows);
      await recordRun({ data: { report_type: type, format: fmt, row_count: rows.length, filters: { from, to } } });
      toast.success(`${fmt.toUpperCase()} downloaded`);
      reloadMeta();
    } catch (e: any) { toast.error(e.message); }
  };

  const createSchedule = async () => {
    try {
      await upsertSched({ data: { report_type: type, schedule, format, filters: {}, recipients: [], active: true } });
      toast.success("Schedule created");
      setShowSched(false); reloadMeta();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <PageHeader eyebrow="FINANCE" title="Financial Reports" subtitle="Generate, export and schedule institutional reports." />

      <Panel title="Generate report" className="mb-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <div className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase mb-1">Report type</div>
            <select className={inputCls} value={type} onChange={(e) => { setType(e.target.value); setRows([]); }}>
              {REPORT_TYPES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </label>
          <label className="block"><div className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase mb-1">From</div><input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label className="block"><div className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase mb-1">To</div><input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} /></label>
          <button className={btnPrimary} onClick={run} disabled={loading}>{loading ? "Running…" : "Run report"}</button>
          <div className="flex gap-1">
            <button className={btnSecondary} onClick={() => doExport("csv")}><FileDown className="h-4 w-4" /> CSV</button>
            <button className={btnSecondary} onClick={() => doExport("xlsx")}><FileDown className="h-4 w-4" /> Excel</button>
            <button className={btnSecondary} onClick={() => doExport("pdf")}><FileDown className="h-4 w-4" /> PDF</button>
            <button className={btnSecondary} onClick={() => setShowSched(true)}><Clock className="h-4 w-4" /> Schedule</button>
          </div>
        </div>
      </Panel>

      {showSched && (
        <Panel title="Schedule recurring report" className="mb-5">
          <div className="flex flex-wrap items-end gap-3">
            <label><div className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase mb-1">Frequency</div>
              <select className={inputCls} value={schedule} onChange={(e) => setSchedule(e.target.value as any)}>
                <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
              </select></label>
            <label><div className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase mb-1">Format</div>
              <select className={inputCls} value={format} onChange={(e) => setFormat(e.target.value as any)}>
                <option value="csv">CSV</option><option value="xlsx">Excel</option><option value="pdf">PDF</option>
              </select></label>
            <button className={btnPrimary} onClick={createSchedule}><Plus className="h-4 w-4" /> Create</button>
            <button className={btnGhost} onClick={() => setShowSched(false)}>Cancel</button>
          </div>
        </Panel>
      )}

      <Panel padded={false} className="mb-5">
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{current.label}</h2>
          <span className="text-xs text-muted-foreground">{rows.length} rows</span>
        </div>
        <DataTable columns={current.columns.map((c) => c.label)}>
          {rows.slice(0, 200).map((r, i) => (
            <tr key={i}>
              {current.columns.map((c) => (
                <Td key={c.key}><span className="text-xs font-mono">{String(r[c.key] ?? "").slice(0, 40)}</span></Td>
              ))}
            </tr>
          ))}
        </DataTable>
        {rows.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">Run a report to preview data.</div>}
      </Panel>

      <div className="grid lg:grid-cols-2 gap-5">
        <Panel title={`Scheduled reports (${schedules.length})`}>
          {schedules.length === 0 && <div className="text-sm text-muted-foreground">No schedules yet.</div>}
          <div className="space-y-2">
            {schedules.map((s) => (
              <div key={s.id} className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0">
                <div>
                  <div className="text-sm font-medium">{s.report_type}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">{s.schedule} · {s.format} · {s.active ? "active" : "paused"}</div>
                </div>
                <button className={btnGhost} onClick={async () => { await delSched({ data: { id: s.id } }); reloadMeta(); }}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Recent runs">
          <div className="space-y-1">
            {runs.length === 0 && <div className="text-sm text-muted-foreground">No runs yet.</div>}
            {runs.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-xs border-b border-border/60 py-1.5 last:border-0">
                <span className="font-mono">{r.report_type}</span>
                <Pill tone="info">{r.format}</Pill>
                <span className="text-muted-foreground">{r.row_count ?? 0} rows</span>
                <span className="text-muted-foreground font-mono">{new Date(r.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
