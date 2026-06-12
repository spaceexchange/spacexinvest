// Embeddable staff-notes panel scoped to a specific entity.
// Use inside customer profiles, investments, funding/withdrawal detail, tickets, compliance cases.
import { useEffect, useState } from "react";
import { listNotes, createNote, updateNote, deleteNote, type NoteEntityType } from "@/lib/staff-data";
import { supabase } from "@/integrations/supabase/client";
import { Pin, PinOff, Trash2, Send } from "lucide-react";
import { toast } from "sonner";

export function StaffNotesPanel({ entityType, entityId, compact = false }: {
  entityType: NoteEntityType; entityId: string; compact?: boolean;
}) {
  const [notes, setNotes] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const reload = async () => {
    setLoading(true);
    setNotes(await listNotes({ entity_type: entityType, entity_id: entityId }));
    setLoading(false);
  };

  useEffect(() => {
    reload();
    const ch = supabase
      .channel(`notes-${entityType}-${entityId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_notes", filter: `entity_id=eq.${entityId}` }, () => reload())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [entityType, entityId]);

  const submit = async () => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      const mentions = Array.from(content.matchAll(/@([a-zA-Z0-9_.-]+)/g)).map((m) => m[1]);
      await createNote({ entity_type: entityType, entity_id: entityId, content, visibility: "department", mentions });
      setContent("");
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setPosting(false); }
  };
  const togglePin = async (n: any) => { await updateNote(n.id, { pinned: !n.pinned }); };
  const remove = async (n: any) => { if (confirm("Delete note?")) await deleteNote(n.id); };

  return (
    <div className={`glass-card rounded-xl ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-mono tracking-[0.25em] text-muted-foreground uppercase">Internal Notes</div>
        <div className="text-[10px] text-muted-foreground">{notes.length} note{notes.length === 1 ? "" : "s"}</div>
      </div>
      <div className="flex gap-2 mb-3">
        <textarea
          rows={2}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a note (use @name to mention)…"
          className="flex-1 text-sm bg-surface/60 border border-border rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
        />
        <button
          onClick={submit}
          disabled={posting || !content.trim()}
          className="self-stretch px-3 rounded-md bg-accent-blue text-white text-sm disabled:opacity-50 hover:bg-accent-blue/90 transition-colors flex items-center gap-1.5"
        >
          <Send className="h-3.5 w-3.5" /> Post
        </button>
      </div>
      <div className="space-y-2 max-h-[420px] overflow-y-auto">
        {loading && <div className="text-xs text-muted-foreground">Loading…</div>}
        {!loading && notes.length === 0 && <div className="text-xs text-muted-foreground py-3 text-center">No notes yet.</div>}
        {notes.map((n) => (
          <div key={n.id} className={`rounded-md border ${n.pinned ? "border-accent-blue/40 bg-accent-blue/5" : "border-border bg-surface/30"} p-3`}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="text-[11px] text-muted-foreground font-mono">
                {n.author?.display_name ?? n.author?.email ?? "Staff"} · {new Date(n.created_at).toLocaleString()}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => togglePin(n)} className="text-muted-foreground hover:text-accent-blue p-1" title={n.pinned ? "Unpin" : "Pin"}>
                  {n.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                </button>
                <button onClick={() => remove(n)} className="text-muted-foreground hover:text-red-400 p-1" title="Delete"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
            <div className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{n.content}</div>
            {Array.isArray(n.mentions) && n.mentions.length > 0 && (
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {n.mentions.map((m: string) => <span key={m} className="text-[10px] text-accent-blue font-mono">@{m}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
