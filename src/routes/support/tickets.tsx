import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, X, Send, ArrowUpCircle, CheckCircle2, UserPlus, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader, Panel, Pill, DataTable, Td, inputCls, btnPrimary, btnSecondary, btnGhost } from "@/components/staff/ui";
import { staffGetAllTickets, staffGetTicketMessages } from "@/lib/data/portal";
import { replyTicket, updateTicket } from "@/lib/data/admin.functions";

export const Route = createFileRoute("/support/tickets")({ component: TicketsPage });

function TicketsPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [thread, setThread] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const replyFn = useServerFn(replyTicket);
  const updateFn = useServerFn(updateTicket);

  async function load() { setRows(await staffGetAllTickets()); }
  useEffect(() => { load(); }, []);

  async function open(t: any) {
    setSelected(t);
    setThread(await staffGetTicketMessages(t.id));
  }

  async function send() {
    if (!selected || !reply.trim()) return;
    await replyFn({ data: { ticket_id: selected.id, message: reply } });
    setReply(""); setThread(await staffGetTicketMessages(selected.id));
    toast.success("Reply sent");
  }
  async function changeStatus(status: any) {
    if (!selected) return;
    await updateFn({ data: { id: selected.id, status } });
    toast.success(`Marked ${status}`); load();
    setSelected({ ...selected, status });
  }
  async function assignMe() {
    if (!selected) return;
    await updateFn({ data: { id: selected.id, assigned_to_self: true } });
    toast.success("Assigned to you"); load();
  }

  const list = rows.filter(t => !q || t.subject?.toLowerCase().includes(q.toLowerCase()) || t.profile?.email?.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHeader eyebrow="SUPPORT DESK" title="Ticket Management" subtitle="Reply, assign, escalate, and close customer tickets." />
      <Panel>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tickets…" className={`${inputCls} w-full pl-9`} />
          </div>
        </div>
        <DataTable columns={["Subject", "User", "Priority", "Status", "Updated", ""]}>
          {list.map((t) => (
            <tr key={t.id} onClick={() => open(t)} className="cursor-pointer hover:bg-surface/30">
              <Td className="font-medium">{t.subject}</Td>
              <Td><span className="text-xs">{t.profile?.email ?? "—"}</span></Td>
              <Td><Pill tone={t.priority === "urgent" || t.priority === "high" ? "danger" : "default"}>{t.priority}</Pill></Td>
              <Td><Pill tone={t.status === "resolved" || t.status === "closed" ? "success" : t.status === "escalated" ? "danger" : "warning"}>{t.status}</Pill></Td>
              <Td><span className="text-xs text-muted-foreground font-mono">{new Date(t.updated_at).toLocaleString()}</span></Td>
              <Td>
                <Link to="/support/tickets/$id" params={{ id: t.id }} onClick={(e) => e.stopPropagation()} className={btnGhost}>
                  <ExternalLink className="h-3 w-3" />Open
                </Link>
              </Td>
            </tr>
          ))}
        </DataTable>
        {list.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No tickets.</div>}
      </Panel>

      {selected && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4" onClick={() => setSelected(null)}>
          <div className="glass-card rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[10px] font-mono tracking-[0.25em] text-muted-foreground">{selected.id.slice(0, 8)}</div>
                <h3 className="text-xl font-semibold mt-1">{selected.subject}</h3>
                <p className="text-sm text-muted-foreground">{selected.profile?.email} • <Pill>{selected.status}</Pill> <Pill>{selected.priority}</Pill></p>
              </div>
              <button onClick={() => setSelected(null)} className="h-8 w-8 grid place-items-center rounded-md hover:bg-surface/60"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3 mb-4">
              {thread.map((m: any) => (
                <div key={m.id} className="border border-border rounded-md p-3 bg-surface/40">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-mono text-muted-foreground">{m.sender_id?.slice(0, 8)}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{new Date(m.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-sm whitespace-pre-line">{m.message}</div>
                </div>
              ))}
              {thread.length === 0 && <div className="text-sm text-muted-foreground">No messages.</div>}
            </div>
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type a reply…" rows={3}
              className="w-full rounded-md border border-border bg-surface/60 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/40" />
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={send} className={btnPrimary}><Send className="h-4 w-4" />Send</button>
              <button onClick={assignMe} className={btnSecondary}><UserPlus className="h-4 w-4" />Assign me</button>
              <button onClick={() => changeStatus("escalated")} className={btnSecondary}><ArrowUpCircle className="h-4 w-4" />Escalate</button>
              <button onClick={() => changeStatus("resolved")} className={btnSecondary}><CheckCircle2 className="h-4 w-4" />Resolve</button>
              <button onClick={() => changeStatus("closed")} className={btnSecondary}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
