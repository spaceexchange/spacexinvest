import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Wallet, Send, CheckCircle2, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader, Panel, Pill, DataTable, Td, btnGhost } from "@/components/staff/ui";
import { staffGetAllFundingRequests, useRealtimeChannel } from "@/lib/data/portal";
import { advanceFunding } from "@/lib/data/admin.functions";

export const Route = createFileRoute("/finance/withdrawals")({ component: WithdrawalsPage });

const STAGES = ["pending", "compliance_review", "finance_review", "approved", "sent", "completed", "rejected", "on_hold", "escalated"] as const;

function WithdrawalsPage() {
  const [tab, setTab] = useState<typeof STAGES[number]>("compliance_review");
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState<any | null>(null);
  const advance = useServerFn(advanceFunding);

  async function load() { setRows(await staffGetAllFundingRequests()); }
  useEffect(() => { load(); }, []);
  useRealtimeChannel("finance-withdrawals", [{ table: "funding_requests" }], load);

  async function act(id: string, action: any, requireNote = false) {
    const notes = requireNote ? prompt("Notes:") ?? undefined : undefined;
    try { await advance({ data: { id, action, notes } }); toast.success("Updated"); setOpen(null); load(); }
    catch (e: any) { toast.error(e.message); }
  }

  const list = rows.filter((r) => r.request_type === "withdrawal" && (r.workflow_stage ?? r.status) === tab);
  const counts: Record<string, number> = {};
  rows.filter((r) => r.request_type === "withdrawal").forEach((r) => {
    const k = r.workflow_stage ?? r.status; counts[k] = (counts[k] ?? 0) + 1;
  });

  return (
    <div>
      <PageHeader eyebrow="FINANCE DESK" title="Withdrawal Authorization" subtitle="Multi-stage workflow: compliance → finance → broadcast → settled." />
      <div className="flex flex-wrap gap-2 mb-4">
        {STAGES.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 h-9 rounded-md border text-sm capitalize ${tab === t ? "border-accent-blue/40 bg-accent-blue/10 text-accent-blue" : "border-border bg-surface/40"}`}>
            {t.replace(/_/g, " ")} {counts[t] ? <span className="ml-1 text-[10px] opacity-70">({counts[t]})</span> : null}
          </button>
        ))}
      </div>
      <Panel>
        <DataTable columns={["User", "Amount", "Destination", "Stage", "Submitted", ""]}>
          {list.map((w) => (
            <tr key={w.id} className="hover:bg-surface/40 cursor-pointer" onClick={() => setOpen(w)}>
              <Td className="font-medium">{w.profile?.display_name ?? w.profile?.email ?? "—"}</Td>
              <Td><span className="font-mono">{Number(w.amount).toLocaleString()} {w.asset || w.currency}</span></Td>
              <Td className="text-xs truncate max-w-[220px]">{w.destination_address || w.details?.destination_bank || "—"}</Td>
              <Td><Pill tone={stageT(w.workflow_stage ?? w.status)}>{(w.workflow_stage ?? w.status).replace(/_/g, " ")}</Pill></Td>
              <Td><span className="text-xs text-muted-foreground font-mono">{new Date(w.created_at).toLocaleString()}</span></Td>
              <Td>
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  {(w.workflow_stage ?? "") === "compliance_review" && (
                    <>
                      <button onClick={() => act(w.id, "compliance_clear")} className={btnGhost}><ShieldCheck className="h-3.5 w-3.5 text-violet-400" />Clear</button>
                      <button onClick={() => act(w.id, "compliance_reject", true)} className={btnGhost}><X className="h-3.5 w-3.5 text-red-400" />Reject</button>
                    </>
                  )}
                  {(w.workflow_stage ?? "") === "finance_review" && (
                    <>
                      <button onClick={() => act(w.id, "finance_approve")} className={btnGhost}><Wallet className="h-3.5 w-3.5 text-emerald-400" />Approve</button>
                      <button onClick={() => act(w.id, "finance_reject", true)} className={btnGhost}><X className="h-3.5 w-3.5 text-red-400" />Reject</button>
                    </>
                  )}
                  {(w.workflow_stage ?? "") === "approved" && (
                    <button onClick={() => act(w.id, "mark_sent")} className={btnGhost}><Send className="h-3.5 w-3.5 text-accent-blue" />Mark sent</button>
                  )}
                  {(w.workflow_stage ?? "") === "sent" && (
                    <button onClick={() => act(w.id, "mark_completed")} className={btnGhost}><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />Complete</button>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </DataTable>
        {list.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No withdrawals in this stage.</div>}
      </Panel>

      {open && <Drawer req={open} onClose={() => setOpen(null)} onAct={act} />}
    </div>
  );
}

function stageT(s: string): any {
  if (["approved", "completed"].includes(s)) return "success";
  if (["rejected"].includes(s)) return "danger";
  if (["sent"].includes(s)) return "info";
  return "warning";
}

function Drawer({ req, onClose, onAct }: { req: any; onClose: () => void; onAct: (id: string, action: any, requireNote?: boolean) => void }) {
  const stage = req.workflow_stage ?? req.status;
  return (
    <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-stretch justify-end" onClick={onClose}>
      <div className="w-full max-w-md bg-background border-l border-border overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="text-[10px] font-mono tracking-[0.25em] text-muted-foreground">WITHDRAWAL REQUEST</div>
        <h2 className="text-xl font-semibold mt-1">{Number(req.amount).toLocaleString()} {req.asset || req.currency}</h2>
        <div className="text-sm text-muted-foreground">{req.profile?.email}</div>
        <Pill tone={stageT(stage)}>{stage.replace(/_/g, " ")}</Pill>

        <dl className="mt-6 space-y-3 text-sm">
          <R l="Rail" v={`${req.payment_method}${req.network ? " · " + req.network : ""}`} />
          {req.destination_address && <R l="Destination" v={req.destination_address} mono />}
          {req.details?.destination_bank && <R l="Bank" v={req.details.destination_bank} />}
          {req.details?.account_holder && <R l="Holder" v={req.details.account_holder} />}
          {req.details?.account_number && <R l="Account" v={req.details.account_number} mono />}
          {req.details?.swift && <R l="SWIFT" v={req.details.swift} />}
          {req.details?.memo && <R l="Memo" v={req.details.memo} />}
          {req.details?.notes && <R l="Investor notes" v={req.details.notes} />}
          {req.compliance_notes && <R l="Compliance note" v={req.compliance_notes} />}
          {req.admin_notes && <R l="Finance note" v={req.admin_notes} />}
        </dl>

        <div className="mt-6 grid grid-cols-2 gap-2">
          {stage === "compliance_review" && <>
            <Btn label="Clear (compliance)" tone="violet" onClick={() => onAct(req.id, "compliance_clear")} />
            <Btn label="Reject" tone="red" onClick={() => onAct(req.id, "compliance_reject", true)} />
          </>}
          {stage === "finance_review" && <>
            <Btn label="Approve & debit" tone="emerald" onClick={() => onAct(req.id, "finance_approve")} />
            <Btn label="Reject" tone="red" onClick={() => onAct(req.id, "finance_reject", true)} />
          </>}
          {stage === "approved" && <Btn label="Mark broadcast / sent" tone="blue" onClick={() => onAct(req.id, "mark_sent")} />}
          {stage === "sent" && <Btn label="Mark completed" tone="emerald" onClick={() => onAct(req.id, "mark_completed")} />}
          {!["completed", "rejected"].includes(stage) && <>
            <Btn label="Place on hold" tone="amber" onClick={() => onAct(req.id, "hold", true)} />
            <Btn label="Escalate" tone="amber" onClick={() => onAct(req.id, "escalate", true)} />
          </>}
        </div>

        {stage === "finance_review" && (
          <div className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs flex gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="text-muted-foreground">Approving debits the investor wallet immediately and creates a ledger entry.</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Btn({ label, tone, onClick }: { label: string; tone: string; onClick: () => void }) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    red: "bg-red-500/10 text-red-400 border-red-500/30",
    blue: "bg-accent-blue/10 text-accent-blue border-accent-blue/30",
    violet: "bg-violet-500/10 text-violet-400 border-violet-500/30",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  };
  return <button onClick={onClick} className={`h-10 rounded-md border text-xs font-medium ${tones[tone]}`}>{label}</button>;
}

function R({ l, v, mono = false }: { l: string; v: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-3">
      <dt className="text-muted-foreground text-xs uppercase tracking-wider">{l}</dt>
      <dd className={`text-foreground ${mono ? "font-mono text-xs break-all" : ""}`}>{v}</dd>
    </div>
  );
}
