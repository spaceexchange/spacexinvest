import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader, Panel, Pill, DataTable, Td, btnGhost } from "@/components/staff/ui";
import { staffGetAllFundingRequests, useRealtimeChannel } from "@/lib/data/portal";
import { reviewFunding } from "@/lib/data/admin.functions";

export const Route = createFileRoute("/finance/deposits")({ component: DepositsPage });

function DepositsPage() {
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState<any | null>(null);
  const review = useServerFn(reviewFunding);

  async function load() { setRows(await staffGetAllFundingRequests()); }
  useEffect(() => { load(); }, []);
  useRealtimeChannel("finance-deposits", [{ table: "funding_requests" }], load);

  async function act(id: string, decision: "approved" | "rejected") {
    const notes = decision === "rejected" ? prompt("Reason:") ?? undefined : undefined;
    try { await review({ data: { id, decision, notes } }); toast.success(`Deposit ${decision}`); setOpen(null); load(); }
    catch (e: any) { toast.error(e.message); }
  }
  const list = rows.filter((r) => r.status === tab && r.request_type === "deposit");

  return (
    <div>
      <PageHeader eyebrow="FINANCE DESK" title="Deposit Review" subtitle="Verify incoming bank wires and crypto transfers — funds credit the investor wallet on approval." />
      <div className="flex flex-wrap gap-2 mb-4">
        {(["pending", "approved", "rejected"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 h-9 rounded-md border text-sm capitalize ${tab === t ? "border-accent-blue/40 bg-accent-blue/10 text-accent-blue" : "border-border bg-surface/40"}`}>{t}</button>
        ))}
      </div>
      <Panel>
        <DataTable columns={["User", "Amount", "Rail", "Reference / Tx", "Submitted", "Status", ""]}>
          {list.map((d) => (
            <tr key={d.id} className="hover:bg-surface/40 cursor-pointer" onClick={() => setOpen(d)}>
              <Td className="font-medium">{d.profile?.display_name ?? d.profile?.email ?? "—"}</Td>
              <Td><span className="font-mono">{Number(d.amount).toLocaleString()} {d.asset || d.currency}</span></Td>
              <Td className="capitalize">{d.payment_method}{d.network ? ` · ${d.network}` : ""}</Td>
              <Td><span className="font-mono text-[11px] truncate inline-block max-w-[180px]">{d.tx_hash || d.reference_number || "—"}</span></Td>
              <Td><span className="text-xs text-muted-foreground font-mono">{new Date(d.created_at).toLocaleString()}</span></Td>
              <Td><Pill tone={d.status === "approved" ? "success" : d.status === "rejected" ? "danger" : "warning"}>{d.status}</Pill></Td>
              <Td>{d.status === "pending" && (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => act(d.id, "approved")} className={btnGhost}><Check className="h-3.5 w-3.5 text-emerald-400" />Approve</button>
                  <button onClick={() => act(d.id, "rejected")} className={btnGhost}><X className="h-3.5 w-3.5 text-red-400" />Reject</button>
                </div>
              )}</Td>
            </tr>
          ))}
        </DataTable>
        {list.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No deposits.</div>}
      </Panel>

      {open && <DepositDrawer req={open} onClose={() => setOpen(null)} onAct={act} />}
    </div>
  );
}

function DepositDrawer({ req, onClose, onAct }: { req: any; onClose: () => void; onAct: (id: string, d: "approved" | "rejected") => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-stretch justify-end" onClick={onClose}>
      <div className="w-full max-w-md bg-background border-l border-border overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="text-[10px] font-mono tracking-[0.25em] text-muted-foreground">DEPOSIT REQUEST</div>
        <h2 className="text-xl font-semibold mt-1">{Number(req.amount).toLocaleString()} {req.asset || req.currency}</h2>
        <div className="mt-1 text-sm text-muted-foreground">{req.profile?.email}</div>

        <dl className="mt-6 space-y-3 text-sm">
          <Row label="Rail" value={`${req.payment_method}${req.network ? " · " + req.network : ""}`} />
          {req.reference_number && <Row label="Reference" value={req.reference_number} mono />}
          {req.tx_hash && <Row label="Tx hash" value={req.tx_hash} mono />}
          {req.details?.sending_bank && <Row label="Sending bank" value={req.details.sending_bank} />}
          {req.details?.transfer_date && <Row label="Transfer date" value={req.details.transfer_date} />}
          {req.details?.notes && <Row label="Notes" value={req.details.notes} />}
          <Row label="Submitted" value={new Date(req.created_at).toLocaleString()} />
          <Row label="Status" value={(req.workflow_stage ?? req.status).replace(/_/g, " ")} />
        </dl>

        {req.status === "pending" && (
          <div className="mt-6 flex gap-2">
            <button onClick={() => onAct(req.id, "approved")} className="flex-1 h-10 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-sm font-medium">Approve & credit</button>
            <button onClick={() => onAct(req.id, "rejected")} className="flex-1 h-10 rounded-md bg-red-500/10 text-red-400 border border-red-500/30 text-sm font-medium">Reject</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3">
      <dt className="text-muted-foreground text-xs uppercase tracking-wider">{label}</dt>
      <dd className={`text-foreground ${mono ? "font-mono text-xs break-all" : ""}`}>{value}</dd>
    </div>
  );
}
