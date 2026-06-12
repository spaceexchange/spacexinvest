import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Pill, btnPrimary, btnSecondary, btnGhost, inputCls } from "@/components/staff/ui";
import { listAutomationRules, upsertAutomationRule } from "@/lib/m7";
import { Plus, X, Zap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/automation")({ component: AutomationPage });

const TRIGGERS = ["kyc_approved","kyc_rejected","deposit_received","withdrawal_requested","investment_created","lead_created","user_suspended","ticket_opened"];
const ACTIONS = ["send_notification","send_email","assign_user","create_task","update_status","log_audit","tag_lead"];

function AutomationPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const reload = async () => setRows(await listAutomationRules());
  useEffect(() => { reload(); }, []);

  const toggle = async (r: any) => { await upsertAutomationRule({ id: r.id, enabled: !r.enabled }); reload(); };

  return (
    <div>
      <PageHeader eyebrow="OPERATIONS" title="Automation Rules" subtitle="Trigger → condition → action workflows."
        action={<button className={btnPrimary} onClick={() => setEditing({ name: "", trigger_event: "kyc_approved", action_type: "send_notification", enabled: true, conditions: {}, action_params: {} })}><Plus className="h-4 w-4" /> New rule</button>} />

      <div className="grid md:grid-cols-2 gap-3">
        {rows.map((r) => (
          <Panel key={r.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex gap-2 flex-wrap mb-1">
                  <Pill tone={r.enabled ? "success" : "default"}>{r.enabled ? "active" : "disabled"}</Pill>
                  <Pill tone="info">{r.trigger_event}</Pill>
                  <Pill tone="warning">{r.action_type}</Pill>
                </div>
                <div className="font-semibold">{r.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{r.description ?? "—"}</div>
                <div className="text-[11px] text-muted-foreground mt-2 font-mono">Runs: {r.run_count ?? 0}</div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button className={btnGhost} onClick={() => setEditing(r)}>Edit</button>
                <button className={btnGhost} onClick={() => toggle(r)}>{r.enabled ? "Disable" : "Enable"}</button>
              </div>
            </div>
          </Panel>
        ))}
        {rows.length === 0 && <Panel className="md:col-span-2"><div className="py-8 text-center text-sm text-muted-foreground"><Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />No automation rules yet.</div></Panel>}
      </div>

      {editing && <Editor r={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </div>
  );
}

function Editor({ r, onClose, onSaved }: any) {
  const [f, setF] = useState({ id: r.id, name: r.name ?? "", description: r.description ?? "", trigger_event: r.trigger_event ?? "kyc_approved", action_type: r.action_type ?? "send_notification", enabled: r.enabled ?? true, conditions: JSON.stringify(r.conditions ?? {}, null, 2), action_params: JSON.stringify(r.action_params ?? {}, null, 2) });
  const save = async () => {
    if (!f.name.trim()) { toast.error("Name required"); return; }
    try {
      const conds = JSON.parse(f.conditions || "{}");
      const params = JSON.parse(f.action_params || "{}");
      await upsertAutomationRule({ id: r.id, name: f.name, description: f.description, trigger_event: f.trigger_event, action_type: f.action_type, enabled: f.enabled, conditions: conds, action_params: params });
      toast.success("Saved"); onSaved();
    } catch (e: any) { toast.error(e.message); }
  };
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="glass-card rounded-xl p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between mb-3"><h2 className="text-base font-semibold">{r.id ? "Edit rule" : "New rule"}</h2><button className={btnGhost} onClick={onClose}><X className="h-4 w-4" /></button></div>
        <input className={`${inputCls} w-full mb-2`} placeholder="Rule name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className={`${inputCls} w-full mb-2`} placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-2 mb-2">
          <select className={inputCls} value={f.trigger_event} onChange={(e) => setF({ ...f, trigger_event: e.target.value })}>{TRIGGERS.map((s) => <option key={s}>{s}</option>)}</select>
          <select className={inputCls} value={f.action_type} onChange={(e) => setF({ ...f, action_type: e.target.value })}>{ACTIONS.map((s) => <option key={s}>{s}</option>)}</select>
        </div>
        <label className="text-xs text-muted-foreground">Conditions (JSON)</label>
        <textarea className={`${inputCls} w-full min-h-[80px] py-2 font-mono text-xs mb-2`} value={f.conditions} onChange={(e) => setF({ ...f, conditions: e.target.value })} />
        <label className="text-xs text-muted-foreground">Action params (JSON)</label>
        <textarea className={`${inputCls} w-full min-h-[80px] py-2 font-mono text-xs mb-2`} value={f.action_params} onChange={(e) => setF({ ...f, action_params: e.target.value })} />
        <label className="flex gap-2 items-center text-sm mb-3"><input type="checkbox" checked={f.enabled} onChange={(e) => setF({ ...f, enabled: e.target.checked })} /> Enabled</label>
        <div className="flex justify-end gap-2"><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={save}>Save</button></div>
      </div>
    </div>
  );
}
