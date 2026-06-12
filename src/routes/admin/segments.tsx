import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Pill, btnPrimary, btnSecondary, btnGhost, inputCls } from "@/components/staff/ui";
import { listSegments, upsertSegment, computeSegmentMembers } from "@/lib/m7";
import { Plus, X, Users, Play } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/segments")({ component: SegmentsPage });

function SegmentsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [preview, setPreview] = useState<{ name: string; count: number } | null>(null);
  const reload = async () => setRows(await listSegments());
  useEffect(() => { reload(); }, []);

  const run = async (s: any) => {
    const ids = await computeSegmentMembers(s.definition ?? {});
    setPreview({ name: s.name, count: ids.length });
  };

  return (
    <div>
      <PageHeader eyebrow="OPERATIONS" title="Investor Segments" subtitle="Saved investor cohorts for targeting."
        action={<button className={btnPrimary} onClick={() => setEditing({ name: "", description: "", definition: {} })}><Plus className="h-4 w-4" /> New segment</button>} />

      {preview && <Panel className="mb-4"><div className="flex items-center justify-between"><div><span className="font-semibold">{preview.name}</span> matches <span className="text-accent-blue font-mono">{preview.count}</span> investors</div><button className={btnGhost} onClick={() => setPreview(null)}><X className="h-4 w-4" /></button></div></Panel>}

      <div className="grid md:grid-cols-2 gap-3">
        {rows.map((r) => (
          <Panel key={r.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold">{r.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{r.description ?? "—"}</div>
                <pre className="text-[10px] text-muted-foreground/70 mt-2 font-mono overflow-x-auto">{JSON.stringify(r.definition ?? {}, null, 2)}</pre>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button className={btnGhost} onClick={() => run(r)}><Play className="h-3.5 w-3.5" /> Run</button>
                <button className={btnGhost} onClick={() => setEditing(r)}>Edit</button>
              </div>
            </div>
          </Panel>
        ))}
        {rows.length === 0 && <Panel className="md:col-span-2"><div className="py-8 text-center text-sm text-muted-foreground"><Users className="h-8 w-8 mx-auto mb-2 opacity-50" />No segments yet.</div></Panel>}
      </div>

      {editing && <Editor s={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </div>
  );
}

function Editor({ s, onClose, onSaved }: any) {
  const [f, setF] = useState({ name: s.name ?? "", description: s.description ?? "", definition: JSON.stringify(s.definition ?? { kyc_status: "verified" }, null, 2) });
  const save = async () => {
    if (!f.name.trim()) { toast.error("Name required"); return; }
    try {
      const def = JSON.parse(f.definition || "{}");
      await upsertSegment({ id: s.id, name: f.name, description: f.description, definition: def });
      toast.success("Saved"); onSaved();
    } catch (e: any) { toast.error(e.message); }
  };
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="glass-card rounded-xl p-5 w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between mb-3"><h2 className="text-base font-semibold">{s.id ? "Edit segment" : "New segment"}</h2><button className={btnGhost} onClick={onClose}><X className="h-4 w-4" /></button></div>
        <input className={`${inputCls} w-full mb-2`} placeholder="Segment name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className={`${inputCls} w-full mb-2`} placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <label className="text-xs text-muted-foreground">Definition (JSON) — supports: kyc_status, country, min_invested, dormant_days, vip</label>
        <textarea className={`${inputCls} w-full min-h-[140px] py-2 font-mono text-xs mb-3`} value={f.definition} onChange={(e) => setF({ ...f, definition: e.target.value })} />
        <div className="flex justify-end gap-2"><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={save}>Save</button></div>
      </div>
    </div>
  );
}
