// Compliance role mirror of /admin/compliance-cases — same data, scoped sidebar.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Pill, btnPrimary, btnSecondary, btnGhost, inputCls } from "@/components/staff/ui";
import { listComplianceCases, upsertComplianceCase } from "@/lib/m7";
import { Plus, X, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/compliance/cases")({ component: CasesPage });

const STATUSES = ["open", "investigating", "escalated", "resolved", "dismissed"];
const SEVERITIES = ["low", "medium", "high", "critical"];

function CasesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const reload = async () => setRows(await listComplianceCases(status || undefined));
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [status]);

  return (
    <div>
      <PageHeader eyebrow="COMPLIANCE" title="Compliance Cases" subtitle="AML, fraud, and policy investigations."
        action={<button className={btnPrimary} onClick={() => setEditing({ case_type: "aml_review", severity: "medium", title: "" })}><Plus className="h-4 w-4" /> New case</button>} />

      <Panel className="mb-4">
        <div className="flex gap-2 flex-wrap">
          <button className={`${btnGhost} ${!status ? "text-accent-blue" : ""}`} onClick={() => setStatus("")}>All</button>
          {STATUSES.map((s) => <button key={s} className={`${btnGhost} ${status === s ? "text-accent-blue" : ""}`} onClick={() => setStatus(s)}>{s}</button>)}
        </div>
      </Panel>

      <div className="grid md:grid-cols-2 gap-3">
        {rows.map((r) => (
          <Panel key={r.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <div className="font-semibold">{r.title}</div>
                  <Pill tone={r.severity === "critical" || r.severity === "high" ? "danger" : r.severity === "medium" ? "warning" : "default"}>{r.severity}</Pill>
                  <Pill tone={r.status === "resolved" ? "success" : r.status === "open" ? "warning" : "info"}>{r.status}</Pill>
                </div>
                <div className="text-xs text-muted-foreground">{r.case_type} · subject: {r.subject?.display_name ?? r.subject?.email ?? "—"}</div>
                {r.description && <div className="text-xs text-muted-foreground/80 mt-2 line-clamp-3">{r.description}</div>}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <Link to="/compliance/cases/$id" params={{ id: r.id }} className={btnGhost}>Open</Link>
                <button className={btnGhost} onClick={() => setEditing(r)}>Edit</button>
              </div>
            </div>
          </Panel>
        ))}
        {rows.length === 0 && <Panel className="md:col-span-2"><div className="py-8 text-center text-sm text-muted-foreground"><ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-50" />No cases.</div></Panel>}
      </div>

      {editing && <Editor c={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </div>
  );
}

function Editor({ c, onClose, onSaved }: any) {
  const [f, setF] = useState({
    title: c.title ?? "", description: c.description ?? "",
    case_type: c.case_type ?? "aml_review", severity: c.severity ?? "medium",
    status: c.status ?? "open", resolution: c.resolution ?? "",
  });
  const save = async () => {
    if (!f.title.trim()) { toast.error("Title required"); return; }
    try {
      await upsertComplianceCase({ id: c.id, ...f });
      toast.success("Saved");
      onSaved();
    } catch (e: any) { toast.error(e.message); }
  };
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="glass-card rounded-xl p-5 w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between mb-3"><h2 className="text-base font-semibold">{c.id ? "Edit case" : "New case"}</h2><button className={btnGhost} onClick={onClose}><X className="h-4 w-4" /></button></div>
        <input className={`${inputCls} w-full mb-2`} placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <textarea className={`${inputCls} w-full min-h-[80px] py-2 mb-2`} placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <div className="grid grid-cols-3 gap-2 mb-2">
          <select className={inputCls} value={f.case_type} onChange={(e) => setF({ ...f, case_type: e.target.value })}>
            {["aml_review","fraud","sanctions","kyc_escalation","policy"].map((x) => <option key={x}>{x}</option>)}
          </select>
          <select className={inputCls} value={f.severity} onChange={(e) => setF({ ...f, severity: e.target.value })}>
            {SEVERITIES.map((x) => <option key={x}>{x}</option>)}
          </select>
          <select className={inputCls} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            {STATUSES.map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
        <input className={`${inputCls} w-full mb-3`} placeholder="Resolution (optional)" value={f.resolution} onChange={(e) => setF({ ...f, resolution: e.target.value })} />
        <div className="flex justify-end gap-2"><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={save}>Save</button></div>
      </div>
    </div>
  );
}
