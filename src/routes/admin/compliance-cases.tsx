import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Pill, DataTable, Td, btnPrimary, btnSecondary, btnGhost, inputCls, statusTone } from "@/components/staff/ui";
import { listComplianceCases, upsertComplianceCase } from "@/lib/m7";
import { useRealtimeChannel } from "@/lib/data/portal";
import { Plus, X, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/compliance-cases")({ component: CasesPage });

const STATUS = ["open","investigating","escalated","resolved","closed"];
const SEVERITY = ["low","medium","high","critical"];
const TYPES = ["aml","sanctions","fraud","kyc","other"];

function CasesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const reload = async () => setRows(await listComplianceCases(status || undefined));
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [status]);
  useRealtimeChannel("cc-feed", [{ table: "compliance_cases" }], reload);

  return (
    <div>
      <PageHeader eyebrow="GOVERNANCE" title="Compliance Cases" subtitle="AML / sanctions / fraud investigations."
        action={<button className={btnPrimary} onClick={() => setEditing({ case_type: "aml", severity: "medium", status: "open" })}><Plus className="h-4 w-4" /> New case</button>} />

      <Panel className="mb-5">
        <div className="flex gap-2 items-center">
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All status</option>
            {STATUS.map((s) => <option key={s}>{s}</option>)}
          </select>
          <span className="text-xs text-muted-foreground">{rows.length} cases</span>
        </div>
      </Panel>

      <Panel padded={false}>
        <DataTable columns={["Case","Type","Severity","Status","Subject","Assignee","Opened"]}>
          {rows.map((r) => (
            <tr key={r.id} className="cursor-pointer hover:bg-surface/40" onClick={() => setEditing(r)}>
              <Td><div className="text-sm font-medium">{r.title ?? r.id.slice(0, 8)}</div></Td>
              <Td><Pill tone="info">{r.case_type}</Pill></Td>
              <Td><Pill tone={r.severity === "critical" || r.severity === "high" ? "danger" : r.severity === "medium" ? "warning" : "default"}>{r.severity}</Pill></Td>
              <Td><Pill tone={statusTone(r.status)}>{r.status}</Pill></Td>
              <Td><span className="text-xs">{r.subject?.email ?? "—"}</span></Td>
              <Td><span className="text-xs">{r.assignee?.display_name ?? r.assignee?.email ?? "—"}</span></Td>
              <Td><span className="text-[11px] text-muted-foreground font-mono">{new Date(r.created_at).toLocaleDateString()}</span></Td>
            </tr>
          ))}
        </DataTable>
        {rows.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground"><ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-50" />No cases.</div>}
      </Panel>

      {editing && <Editor c={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </div>
  );
}

function Editor({ c, onClose, onSaved }: any) {
  const [f, setF] = useState({ id: c.id, title: c.title ?? "", case_type: c.case_type ?? "aml", severity: c.severity ?? "medium", status: c.status ?? "open", description: c.description ?? "", subject_user_id: c.subject_user_id ?? "", findings: c.findings ?? "" });
  const save = async () => {
    try { await upsertComplianceCase({ ...f, id: c.id, subject_user_id: f.subject_user_id || null }); toast.success("Saved"); onSaved(); }
    catch (e: any) { toast.error(e.message); }
  };
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="glass-card rounded-xl p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between mb-3"><h2 className="text-base font-semibold">{c.id ? "Edit case" : "New case"}</h2><button className={btnGhost} onClick={onClose}><X className="h-4 w-4" /></button></div>
        <input className={`${inputCls} w-full mb-2`} placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <div className="grid grid-cols-3 gap-2 mb-2">
          <select className={inputCls} value={f.case_type} onChange={(e) => setF({ ...f, case_type: e.target.value })}>{TYPES.map((s) => <option key={s}>{s}</option>)}</select>
          <select className={inputCls} value={f.severity} onChange={(e) => setF({ ...f, severity: e.target.value })}>{SEVERITY.map((s) => <option key={s}>{s}</option>)}</select>
          <select className={inputCls} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>{STATUS.map((s) => <option key={s}>{s}</option>)}</select>
        </div>
        <input className={`${inputCls} w-full mb-2`} placeholder="Subject user ID (optional)" value={f.subject_user_id} onChange={(e) => setF({ ...f, subject_user_id: e.target.value })} />
        <textarea className={`${inputCls} w-full min-h-[100px] py-2 mb-2`} placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <textarea className={`${inputCls} w-full min-h-[100px] py-2 mb-3`} placeholder="Findings" value={f.findings} onChange={(e) => setF({ ...f, findings: e.target.value })} />
        <div className="flex justify-end gap-2"><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={save}>Save</button></div>
      </div>
    </div>
  );
}
