import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader, Panel, Pill, DataTable, Td, btnGhost } from "@/components/staff/ui";
import { staffGetAllInvestments, moneyc } from "@/lib/data/portal";
import { reviewInvestment } from "@/lib/data/admin.functions";

export const Route = createFileRoute("/admin/investments")({ component: InvestmentsPage });

function InvestmentsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const review = useServerFn(reviewInvestment);
  async function load() { setRows(await staffGetAllInvestments()); }
  useEffect(() => { load(); }, []);

  async function act(id: string, decision: "approved" | "rejected") {
    try { await review({ data: { id, decision } }); toast.success(`Investment ${decision}`); load(); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <div>
      <PageHeader eyebrow="INVESTMENT OPS" title="Investments" subtitle="Approve or reject investor allocations." />
      <Panel>
        <DataTable columns={["Investor", "Opportunity", "Amount", "Shares", "Status", "Submitted", ""]}>
          {rows.map((i) => (
            <tr key={i.id}>
              <Td className="font-medium">{i.profile?.display_name ?? i.profile?.email ?? "—"}</Td>
              <Td>{i.opportunity?.title ?? "—"}</Td>
              <Td><span className="font-mono">{moneyc(Number(i.amount))}</span></Td>
              <Td><span className="font-mono">{Number(i.shares).toFixed(2)}</span></Td>
              <Td><Pill tone={i.approval_status === "approved" ? "success" : i.approval_status === "rejected" ? "danger" : "warning"}>{i.approval_status}</Pill></Td>
              <Td><span className="text-xs text-muted-foreground font-mono">{new Date(i.created_at).toLocaleDateString()}</span></Td>
              <Td>
                <div className="flex justify-end gap-1">
                  {i.approval_status === "pending" && (
                    <>
                      <button onClick={() => act(i.id, "approved")} className={btnGhost}><Check className="h-3.5 w-3.5 text-emerald-400" />Approve</button>
                      <button onClick={() => act(i.id, "rejected")} className={btnGhost}><X className="h-3.5 w-3.5 text-red-400" />Reject</button>
                    </>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </DataTable>
        {rows.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No investments yet.</div>}
      </Panel>
    </div>
  );
}
