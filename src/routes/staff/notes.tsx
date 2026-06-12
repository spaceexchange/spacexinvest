import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader, Panel, Pill, btnPrimary, btnSecondary, btnGhost, inputCls, statusTone } from "@/components/staff/ui";
import { listNotes, createNote, updateNote, deleteNote, type NoteEntityType } from "@/lib/staff-data";
import { useRealtimeChannel } from "@/lib/data/portal";
import { Pin, PinOff, Trash2, Archive, Plus, MessageSquare, Filter } from "lucide-react";
import { toast } from "sonner";

const ENTITY_TYPES: NoteEntityType[] = ["general", "user", "investment", "funding_request", "withdrawal", "support_ticket", "compliance_case", "opportunity"];

export const Route = createFileRoute("/staff/notes")({ component: NotesPage });

function NotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [entityType, setEntityType] = useState<NoteEntityType>("general");
  const [entityId, setEntityId] = useState("");
  const [visibility, setVisibility] = useState<"private" | "department" | "management">("department");

  const reload = async () => {
    setLoading(true);
    setNotes(await listNotes(filter === "all" ? undefined : { entity_type: filter }));
    setLoading(false);
  };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [filter]);
  useRealtimeChannel("notes-feed", [{ table: "staff_notes" }], reload);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? notes.filter((n) => (n.title ?? "").toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) : notes;
  }, [notes, search]);

  const submit = async () => {
    if (!content.trim()) { toast.error("Note content required"); return; }
    const mentions = Array.from(content.matchAll(/@([a-zA-Z0-9_.-]+)/g)).map((m) => m[1]);
    try {
      await createNote({
        entity_type: entityType,
        entity_id: entityId || null,
        title: title || undefined,
        content, visibility, mentions,
      });
      setContent(""); setTitle(""); setEntityId("");
      setCreating(false);
      toast.success("Note posted");
      reload();
    } catch (e: any) { toast.error(e.message); }
  };

  const togglePin = async (n: any) => { await updateNote(n.id, { pinned: !n.pinned }); reload(); };
  const archive = async (n: any) => { await updateNote(n.id, { archived: true }); toast.success("Archived"); reload(); };
  const remove = async (n: any) => { if (!confirm("Delete this note?")) return; await deleteNote(n.id); reload(); };

  return (
    <div>
      <PageHeader
        eyebrow="COLLABORATION"
        title="Internal Staff Notes"
        subtitle="Threaded notes across users, investments, funding, tickets and cases."
        action={<button className={btnPrimary} onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New note</button>}
      />

      <Panel className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select className={inputCls} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All entities</option>
            {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
          </select>
          <input className={`${inputCls} flex-1 min-w-[200px]`} placeholder="Search title or content" value={search} onChange={(e) => setSearch(e.target.value)} />
          <span className="text-xs text-muted-foreground">{filtered.length} notes</span>
        </div>
      </Panel>

      {creating && (
        <Panel title="New note" className="mb-5">
          <div className="space-y-3">
            <div className="grid sm:grid-cols-3 gap-2">
              <select className={inputCls} value={entityType} onChange={(e) => setEntityType(e.target.value as NoteEntityType)}>
                {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </select>
              <input className={inputCls} placeholder="Entity ID (optional)" value={entityId} onChange={(e) => setEntityId(e.target.value)} />
              <select className={inputCls} value={visibility} onChange={(e) => setVisibility(e.target.value as any)}>
                <option value="private">Private</option>
                <option value="department">Department</option>
                <option value="management">Management</option>
              </select>
            </div>
            <input className={`${inputCls} w-full`} placeholder="Optional title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea className={`${inputCls} w-full min-h-[120px] py-2`} placeholder="Note content — use @username to mention" value={content} onChange={(e) => setContent(e.target.value)} />
            <div className="flex items-center gap-2 justify-end">
              <button className={btnSecondary} onClick={() => setCreating(false)}>Cancel</button>
              <button className={btnPrimary} onClick={submit}>Post note</button>
            </div>
          </div>
        </Panel>
      )}

      <div className="space-y-3">
        {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {!loading && filtered.length === 0 && <div className="text-sm text-muted-foreground py-10 text-center">No notes yet.</div>}
        {filtered.map((n) => (
          <Panel key={n.id} className={n.pinned ? "border-accent-blue/40" : ""}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Pill tone={statusTone(n.visibility)}>{n.visibility}</Pill>
                  <Pill tone="info">{n.entity_type.replace(/_/g, " ")}</Pill>
                  {n.pinned && <Pill tone="warning">Pinned</Pill>}
                  <span className="text-[11px] text-muted-foreground font-mono">{new Date(n.created_at).toLocaleString()}</span>
                  <span className="text-[11px] text-muted-foreground">· {n.author?.display_name ?? n.author?.email ?? "Staff"}</span>
                </div>
                {n.title && <div className="font-semibold text-foreground mb-1">{n.title}</div>}
                <div className="text-sm text-foreground/85 whitespace-pre-wrap break-words">{n.content}</div>
                {n.entity_id && <div className="text-[11px] text-muted-foreground font-mono mt-2">→ {n.entity_type}:{n.entity_id.slice(0, 8)}</div>}
                {Array.isArray(n.mentions) && n.mentions.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {n.mentions.map((m: string) => <Pill key={m} tone="info">@{m}</Pill>)}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button className={btnGhost} onClick={() => togglePin(n)} title={n.pinned ? "Unpin" : "Pin"}>
                  {n.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                </button>
                <button className={btnGhost} onClick={() => archive(n)} title="Archive"><Archive className="h-3.5 w-3.5" /></button>
                <button className={btnGhost} onClick={() => remove(n)} title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="mt-6" title="About internal notes">
        <p className="text-xs text-muted-foreground flex items-start gap-2">
          <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Notes are visible to staff per chosen visibility. Mentions like <code>@username</code> are captured and stored. Pinned notes float to the top. Realtime updates apply across all staff sessions.</span>
        </p>
      </Panel>
    </div>
  );
}
