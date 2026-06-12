import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Pill, btnPrimary } from "@/components/staff/ui";
import { StaffNotesPanel } from "@/components/staff/StaffNotesPanel";
import { staffGetTicketMessages } from "@/lib/data/portal";

export const Route = createFileRoute("/support/tickets/$id")({ component: TicketDetailPage });

function TicketDetailPage() {
  const { id } = Route.useParams();
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  async function load() {
    setLoading(true);
    const [t, m] = await Promise.all([
      supabase.from("support_tickets").select("*, profile:profiles!support_tickets_user_id_fkey(display_name,email)").eq("id", id).maybeSingle(),
      staffGetTicketMessages(id),
    ]);
    setTicket(t.data); setMessages(m); setLoading(false);
  }
  useEffect(() => { load(); }, [id]);

  async function send() {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("support_messages").insert({ ticket_id: id, sender_id: user!.id, message: reply });
      if (error) throw error;
      setReply(""); await load(); toast.success("Reply sent");
    } catch (e: any) { toast.error(e.message); } finally { setSending(false); }
  }

  async function setStatus(s: string) {
    const { error } = await supabase.from("support_tickets").update({ status: s, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(`Marked ${s}`); load(); }
  }

  if (loading) return <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!ticket) return <div className="py-10 text-center text-sm text-muted-foreground">Ticket not found.</div>;

  return (
    <div>
      <Link to="/support/tickets" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"><ArrowLeft className="h-3 w-3" />Back to tickets</Link>
      <PageHeader
        eyebrow={`TICKET #${String(ticket.id).slice(0, 8)}`}
        title={ticket.subject ?? "Support ticket"}
        subtitle={`${ticket.profile?.display_name ?? ticket.profile?.email ?? "—"} • ${ticket.category ?? "general"} • ${ticket.priority ?? "normal"}`}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Pill tone={ticket.status === "open" ? "info" : ticket.status === "resolved" || ticket.status === "closed" ? "success" : "warning"}>{ticket.status}</Pill>
            {ticket.status !== "resolved" && <button onClick={() => setStatus("resolved")} className="text-xs px-2 h-7 rounded border border-border hover:border-emerald-500/40 hover:text-emerald-400">Resolve</button>}
            {ticket.status !== "open" && <button onClick={() => setStatus("open")} className="text-xs px-2 h-7 rounded border border-border hover:border-accent-blue/40 hover:text-accent-blue">Reopen</button>}
          </div>
        }
      />
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Panel title="Conversation">
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {messages.length === 0 && <div className="text-sm text-muted-foreground py-4">No messages yet.</div>}
              {messages.map((m: any) => {
                const isUser = m.sender_id === ticket.user_id;
                return (
                  <div key={m.id} className={`rounded-md p-3 text-sm border ${isUser ? "bg-surface/40 border-border" : "bg-accent-blue/5 border-accent-blue/30"}`}>
                    <div className="text-[10px] font-mono tracking-wider text-muted-foreground mb-1">{isUser ? "CUSTOMER" : "STAFF"} • {new Date(m.created_at).toLocaleString()}</div>
                    <div className="whitespace-pre-wrap break-words">{m.message}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex gap-2">
              <textarea rows={2} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply to customer…" className="flex-1 text-sm bg-surface/60 border border-border rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-accent-blue/40" />
              <button onClick={send} disabled={sending || !reply.trim()} className={`${btnPrimary} disabled:opacity-50`}><Send className="h-3.5 w-3.5" />Send</button>
            </div>
          </Panel>
        </div>
        <div>
          <StaffNotesPanel entityType="support_ticket" entityId={id} />
        </div>
      </div>
    </div>
  );
}
