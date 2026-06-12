import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Pill, inputCls } from "@/components/dashboard/ui";
import { getMyTickets, createTicket, getTicketMessages, postTicketMessage } from "@/lib/data/portal";
import { supabase } from "@/integrations/supabase/client";
import { Send, Plus, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account/support")({
  head: () => ({ meta: [{ title: "Support — SpaceX IPO Exchange" }] }),
  component: SupportPage,
});

function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [open, setOpen] = useState<any | null>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [draft, setDraft] = useState({ subject: "", category: "general", priority: "normal", first_message: "" });
  const [me, setMe] = useState<string | null>(null);

  async function refresh() { setTickets(await getMyTickets()); }
  useEffect(() => {
    refresh();
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  async function openTicket(t: any) {
    setOpen(t); setMsgs(await getTicketMessages(t.id));
  }
  async function send() {
    if (!open || !text.trim()) return;
    await postTicketMessage(open.id, text);
    setText(""); setMsgs(await getTicketMessages(open.id));
  }
  async function create() {
    if (!draft.subject || !draft.first_message) return;
    await createTicket(draft);
    setNewOpen(false); setDraft({ subject: "", category: "general", priority: "normal", first_message: "" });
    await refresh();
  }

  return (
    <div>
      <PageHeader title="Support Center" subtitle="White-glove service for accredited investors, 24/7."
        action={<button onClick={() => setNewOpen(true)} className="btn-primary !min-h-[36px] !py-1.5 !px-4 !text-xs flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> New Ticket</button>}
      />

      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-4">
        <Panel title="My Tickets">
          <ul className="divide-y divide-border">
            {tickets.length === 0 && <li className="py-8 text-center text-xs text-muted-foreground">No tickets yet.</li>}
            {tickets.map((t) => (
              <li key={t.id}>
                <button onClick={() => openTicket(t)} className={`w-full text-left py-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-center hover:bg-secondary/30 px-2 rounded-md ${open?.id === t.id ? "bg-secondary/40" : ""}`}>
                  <div className="min-w-0">
                    <div className="text-sm text-foreground truncate">{t.subject}</div>
                    <div className="text-[11px] text-muted-foreground capitalize">{t.category} · {t.priority}</div>
                  </div>
                  <Pill tone={t.status === "resolved" || t.status === "closed" ? "success" : t.status === "escalated" ? "danger" : "info"}>{t.status}</Pill>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title={open ? open.subject : "Select a ticket"}>
          {open ? (
            <>
              <div className="rounded-lg border border-border bg-surface/40 h-72 p-4 overflow-y-auto space-y-3 mb-3">
                {msgs.map((m) => {
                  const mine = m.sender_id === me;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-accent-blue text-white" : "bg-secondary text-foreground"}`}>
                        {m.message}
                        <div className="text-[10px] opacity-70 mt-1">{new Date(m.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a reply…" className={inputCls} />
                <button onClick={send} className="btn-primary !min-h-[40px] !py-1.5 !px-4 flex items-center gap-2"><Send className="h-4 w-4" /> Send</button>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">Select a ticket on the left, or open a new one.</div>
          )}
        </Panel>
      </div>

      {newOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4" onClick={() => setNewOpen(false)}>
          <div className="glass-card rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="text-[10px] font-mono tracking-[0.3em] text-muted-foreground mb-1">NEW TICKET</div>
                <h3 className="text-lg font-semibold text-foreground">Open a support request</h3>
              </div>
              <button onClick={() => setNewOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} placeholder="Subject" className={inputCls} />
              <div className="grid grid-cols-2 gap-2">
                <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className={inputCls}>
                  {["general", "funding", "investment", "verification", "security", "tax"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })} className={inputCls}>
                  {["low", "normal", "high", "urgent"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <textarea value={draft.first_message} onChange={(e) => setDraft({ ...draft, first_message: e.target.value })} placeholder="Describe your issue…" rows={5} className={`${inputCls} !h-auto`} />
              <button onClick={create} disabled={!draft.subject || !draft.first_message} className="btn-primary w-full disabled:opacity-50">Open ticket</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
