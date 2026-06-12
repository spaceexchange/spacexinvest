import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader, Panel, Pill, DataTable, Td, btnGhost } from "@/components/staff/ui";
import { staffGetAllFundingRequests, moneyc } from "@/lib/data/portal";
import { reviewFunding } from "@/lib/data/admin.functions";

const TABS = ["pending", "approved", "rejected"] as const;

export const Route = createFileRoute("/admin/withdrawals")({ component: WithdrawalsPage });

function WithdrawalsPage() {
  const [tab, setTab] = useState<typeof TABS[number]>("pending");
  const [rows, setRows] = useState<any[]>([]);
  const review = useServerFn(reviewFunding);
  async function load() { setRows(await staffGetAllFundingRequests()); }
  useEffect(() => { load(); }, []);

  async function act(id: string, decision: "approved" | "rejected") {
    const notes = decision === "rejected" ? prompt("Reason:") ?? undefined : undefined;
    try { await review({ data: { id, decision, notes } }); toast.success(`Withdrawal ${decision}`); load(); }
    catch (e: any) { toast.error(e.message); }
  }

  const list = rows.filter(r => r.status === tab && r.request_type === "withdrawal");
  return (
    <div>
      <PageHeader eyebrow="FINANCE OPS" title="Withdrawal Control Center" subtitle="Authorize outgoing payments — funds are debited on approval." />
      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((t) => {
          const c = rows.filter(r => r.status === t && r.request_type === "withdrawal").length;
          const active = tab === t;
          return (
            <button key={t} onClick={() => setTab(t)} className={`px-3 h-9 rounded-md border text-sm ${active ? "border-accent-blue/40 bg-accent-blue/10 text-accent-blue" : "border-border bg-surface/40"}`}>
              {t} <span className="text-xs text-muted-foreground ml-1">({c})</span>
            </button>
          );
        })}
      </div>
      <Panel>
        <DataTable columns={["User", "Amount", "Method", "Submitted", "Status", ""]}>
          {list.map((w) => (
            <tr key={w.id}>
              <Td className="font-medium">{w.profile?.display_name ?? w.profile?.email ?? "—"}</Td>
              <Td><span className="font-mono">{moneyc(Number(w.amount))}</span></Td>
              <Td>{w.payment_method}</Td>
              <Td><span className="text-xs text-muted-foreground font-mono">{new Date(w.created_at).toLocaleString()}</span></Td>
              <Td><Pill tone={w.status === "approved" ? "success" : w.status === "rejected" ? "danger" : "warning"}>{w.status}</Pill></Td>
              <Td>
                <div className="flex justify-end gap-1">
                  <Link to="/admin/funding/$id" params={{ id: w.id }} className={btnGhost}>View</Link>
                  {w.status === "pending" && (
                    <>
                      <button onClick={() => act(w.id, "approved")} className={btnGhost}><Check className="h-3.5 w-3.5 text-emerald-400" />Approve</button>
                      <button onClick={() => act(w.id, "rejected")} className={btnGhost}><X className="h-3.5 w-3.5 text-red-400" />Reject</button>
                    </>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </DataTable>
        {list.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No withdrawals in {tab}.</div>}
      </Panel>
    </div>
  );
}
