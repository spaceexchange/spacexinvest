import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Pill, btnPrimary, btnSecondary, btnGhost, inputCls, statusTone } from "@/components/staff/ui";
import { listAnnouncements, createAnnouncement, updateAnnouncement, publishAnnouncement } from "@/lib/m7";
import { Plus, X, Megaphone, Send, Archive } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/announcements")({ component: AnnouncementsPage });

const AUDIENCES = ["all","investors","staff","verified","vip"];
const PRIORITIES = ["low","normal","high","critical"];

function AnnouncementsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const reload = async () => setRows(await listAnnouncements(filter || undefined));
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [filter]);

  const archive = async (a: any) => { await updateAnnouncement(a.id, { status: "archived" }); reload(); };
  const publish = async (a: any) => { await publishAnnouncement(a.id); toast.success("Published"); reload(); };

  return (
    <div>
      <PageHeader eyebrow="COMMUNICATIONS" title="Announcements" subtitle="Broadcast to investors and staff."
        action={<button className={btnPrimary} onClick={() => setEditing({ title: "", body: "", audience: "all", priority: "normal", status: "draft" })}><Plus className="h-4 w-4" /> New</button>} />

      <Panel className="mb-5">
        <div className="flex flex-wrap gap-2 items-center">
          <select className={inputCls} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <span className="text-xs text-muted-foreground">{rows.length} announcements</span>
        </div>
      </Panel>

      <div className="space-y-3">
        {rows.map((a) => (
          <Panel key={a.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex gap-2 flex-wrap mb-1">
                  <Pill tone={statusTone(a.status)}>{a.status}</Pill>
                  <Pill tone={a.priority === "critical" ? "danger" : a.priority === "high" ? "warning" : "info"}>{a.priority}</Pill>
                  <Pill tone="default">{a.audience}</Pill>
                  <span className="text-[11px] text-muted-foreground font-mono">{new Date(a.created_at).toLocaleString()}</span>
                </div>
                <h3 className="font-semibold text-foreground">{a.title}</h3>
                <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap line-clamp-3">{a.body}</p>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button className={btnGhost} onClick={() => setEditing(a)}>Edit</button>
                {a.status === "draft" && <button className={btnGhost} onClick={() => publish(a)}><Send className="h-3.5 w-3.5" /> Publish</button>}
                {a.status !== "archived" && <button className={btnGhost} onClick={() => archive(a)}><Archive className="h-3.5 w-3.5" /> Archive</button>}
              </div>
            </div>
          </Panel>
        ))}
        {rows.length === 0 && <Panel><div className="py-8 text-center text-sm text-muted-foreground"><Megaphone className="h-8 w-8 mx-auto mb-2 opacity-50" />No announcements yet.</div></Panel>}
      </div>

      {editing && <Editor a={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </div>
  );
}

function Editor({ a, onClose, onSaved }: any) {
  const [f, setF] = useState({ title: a.title ?? "", body: a.body ?? "", audience: a.audience ?? "all", priority: a.priority ?? "normal", status: a.status ?? "draft" });
  const save = async () => {
    if (!f.title.trim() || !f.body.trim()) { toast.error("Title and body required"); return; }
    try {
      if (a.id) await updateAnnouncement(a.id, f); else await createAnnouncement(f);
      toast.success("Saved"); onSaved();
    } catch (e: any) { toast.error(e.message); }
  };
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="glass-card rounded-xl p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between mb-3">
          <h2 className="text-base font-semibold">{a.id ? "Edit announcement" : "New announcement"}</h2>
          <button className={btnGhost} onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <input className={`${inputCls} w-full mb-2`} placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <textarea className={`${inputCls} w-full min-h-[180px] py-2 mb-2`} placeholder="Body — markdown supported" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
        <div className="grid grid-cols-3 gap-2 mb-3">
          <select className={inputCls} value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value })}>{AUDIENCES.map((x) => <option key={x}>{x}</option>)}</select>
          <select className={inputCls} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}>{PRIORITIES.map((x) => <option key={x}>{x}</option>)}</select>
          <select className={inputCls} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option>draft</option><option>published</option><option>archived</option></select>
        </div>
        <div className="flex justify-end gap-2">
          <button className={btnSecondary} onClick={onClose}>Cancel</button>
          <button className={btnPrimary} onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}
