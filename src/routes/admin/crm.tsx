import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader, Panel, Pill, DataTable, Td, btnPrimary, btnSecondary, btnGhost, inputCls, statusTone } from "@/components/staff/ui";
import { listLeads, createLead, updateLead, logLeadActivity, listLeadActivities } from "@/lib/m7";
import { useRealtimeChannel } from "@/lib/data/portal";
import { Plus, X, Filter, Users, UserCheck, TrendingUp, Award } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/crm")({ component: CRMPage });

const STATUS = ["new","contacted","qualified","interested","kyc_pending","verified","invested","active","vip","dormant","suspended","lost"];
const STAGES = ["lead","prospect","investor","active_investor","vip","dormant"];

function CRMPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [stage, setStage] = useState("");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);

  const reload = async () => setRows(await listLeads({ status: status || undefined, stage: stage || undefined, search: search || undefined }));
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [status, stage]);
  useRealtimeChannel("crm-leads", [{ table: "crm_leads" }], reload);

  const stats = useMemo(() => ({
    total: rows.length,
    qualified: rows.filter((r) => ["qualified","interested","kyc_pending","verified"].includes(r.status)).length,
    invested: rows.filter((r) => ["invested","active","vip"].includes(r.status)).length,
    vip: rows.filter((r) => r.status === "vip" || r.lifecycle_stage === "vip").length,
  }), [rows]);

  return (
    <div>
      <PageHeader eyebrow="GROWTH" title="CRM" subtitle="Leads, prospects and investor lifecycle management."
        action={<button className={btnPrimary} onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New lead</button>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Total leads" value={stats.total} icon={<Users className="h-4 w-4" />} />
        <Stat label="Qualified" value={stats.qualified} icon={<UserCheck className="h-4 w-4" />} />
        <Stat label="Converted" value={stats.invested} icon={<TrendingUp className="h-4 w-4" />} />
        <Stat label="VIP" value={stats.vip} icon={<Award className="h-4 w-4" />} />
      </div>

      <Panel className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All status</option>
            {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className={inputCls} value={stage} onChange={(e) => setStage(e.target.value)}>
            <option value="">All stages</option>
            {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input className={`${inputCls} flex-1 min-w-[200px]`} placeholder="Search email or name" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && reload()} />
          <button className={btnSecondary} onClick={reload}>Search</button>
        </div>
      </Panel>

      <Panel padded={false}>
        <DataTable columns={["Lead","Status","Stage","Country","Source","Assignee","Updated"]}>
          {rows.map((r) => (
            <tr key={r.id} className="cursor-pointer hover:bg-surface/40" onClick={() => setDetail(r)}>
              <Td>
                <div className="text-sm font-medium">{r.full_name ?? r.email}</div>
                <div className="text-[11px] text-muted-foreground">{r.email}</div>
              </Td>
              <Td><Pill tone={statusTone(r.status)}>{r.status}</Pill></Td>
              <Td><Pill tone="info">{r.lifecycle_stage ?? "lead"}</Pill></Td>
              <Td><span className="text-xs">{r.country ?? "—"}</span></Td>
              <Td><span className="text-xs text-muted-foreground">{r.source ?? "—"}</span></Td>
              <Td><span className="text-xs">{r.assignee?.display_name ?? r.assignee?.email ?? "—"}</span></Td>
              <Td><span className="text-[11px] text-muted-foreground font-mono">{new Date(r.updated_at).toLocaleDateString()}</span></Td>
            </tr>
          ))}
        </DataTable>
        {rows.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No leads.</div>}
      </Panel>

      {creating && <LeadCreate onClose={() => setCreating(false)} onCreated={() => { setCreating(false); reload(); }} />}
      {detail && <LeadDetail lead={detail} onClose={() => setDetail(null)} onSaved={() => { setDetail(null); reload(); }} />}
    </div>
  );
}

function Stat({ label, value, icon }: any) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono tracking-[0.25em] text-muted-foreground uppercase">{label}</span>
        <span className="text-accent-blue">{icon}</span>
      </div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function LeadCreate({ onClose, onCreated }: any) {
  const [f, setF] = useState({ email: "", full_name: "", phone: "", country: "", source: "manual", status: "new", lifecycle_stage: "lead", notes: "" });
  const submit = async () => {
    if (!f.email) { toast.error("Email required"); return; }
    try { await createLead(f as any); toast.success("Lead created"); onCreated(); }
    catch (e: any) { toast.error(e.message); }
  };
  return (
    <Modal onClose={onClose} title="New lead">
      <div className="grid sm:grid-cols-2 gap-2">
        <input className={inputCls} placeholder="Email *" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <input className={inputCls} placeholder="Full name" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
        <input className={inputCls} placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <input className={inputCls} placeholder="Country" value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} />
        <input className={inputCls} placeholder="Source" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} />
        <select className={inputCls} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>{STATUS.map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      <textarea className={`${inputCls} w-full mt-2 min-h-[80px] py-2`} placeholder="Notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      <div className="flex justify-end gap-2 mt-3">
        <button className={btnSecondary} onClick={onClose}>Cancel</button>
        <button className={btnPrimary} onClick={submit}>Create</button>
      </div>
    </Modal>
  );
}

function LeadDetail({ lead, onClose, onSaved }: any) {
  const [f, setF] = useState({ status: lead.status, lifecycle_stage: lead.lifecycle_stage, notes: lead.notes ?? "" });
  const [acts, setActs] = useState<any[]>([]);
  const [newAct, setNewAct] = useState({ type: "note", details: "" });
  useEffect(() => { listLeadActivities(lead.id).then(setActs); }, [lead.id]);
  const save = async () => {
    try { await updateLead(lead.id, f); await logLeadActivity(lead.id, "updated", { changes: f }); toast.success("Saved"); onSaved(); }
    catch (e: any) { toast.error(e.message); }
  };
  const addAct = async () => {
    if (!newAct.details.trim()) return;
    await logLeadActivity(lead.id, newAct.type, { note: newAct.details });
    setNewAct({ type: "note", details: "" });
    setActs(await listLeadActivities(lead.id));
  };
  return (
    <Modal onClose={onClose} title={lead.full_name ?? lead.email}>
      <div className="grid sm:grid-cols-2 gap-2 mb-3">
        <select className={inputCls} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>{STATUS.map((s) => <option key={s}>{s}</option>)}</select>
        <select className={inputCls} value={f.lifecycle_stage} onChange={(e) => setF({ ...f, lifecycle_stage: e.target.value })}>{STAGES.map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      <textarea className={`${inputCls} w-full min-h-[60px] py-2`} placeholder="Notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      <div className="flex justify-end mt-2"><button className={btnPrimary} onClick={save}>Save lead</button></div>

      <div className="mt-5 pt-4 border-t border-border">
        <div className="text-xs font-mono tracking-[0.25em] text-muted-foreground mb-2">ACTIVITY TIMELINE</div>
        <div className="flex gap-2 mb-3">
          <select className={inputCls} value={newAct.type} onChange={(e) => setNewAct({ ...newAct, type: e.target.value })}>
            <option>note</option><option>call</option><option>email</option><option>meeting</option><option>status_change</option>
          </select>
          <input className={`${inputCls} flex-1`} placeholder="Activity details" value={newAct.details} onChange={(e) => setNewAct({ ...newAct, details: e.target.value })} />
          <button className={btnSecondary} onClick={addAct}>Log</button>
        </div>
        <div className="space-y-2 max-h-[280px] overflow-y-auto">
          {acts.map((a: any) => (
            <div key={a.id} className="text-xs border border-border rounded-md p-2">
              <div className="flex justify-between text-muted-foreground mb-0.5">
                <span>{a.activity_type} · {a.actor?.display_name ?? a.actor?.email ?? "—"}</span>
                <span className="font-mono">{new Date(a.created_at).toLocaleString()}</span>
              </div>
              <pre className="text-foreground/85 whitespace-pre-wrap font-sans">{a.details?.note ?? JSON.stringify(a.details)}</pre>
            </div>
          ))}
          {acts.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">No activity yet.</div>}
        </div>
      </div>
    </Modal>
  );
}

function Modal({ title, onClose, children }: any) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="glass-card rounded-xl p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">{title}</h2>
          <button className={btnGhost} onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
