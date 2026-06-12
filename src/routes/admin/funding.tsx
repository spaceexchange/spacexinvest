import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader, Panel, Pill, DataTable, Td, btnGhost } from "@/components/staff/ui";
import { staffGetAllFundingRequests, moneyc } from "@/lib/data/portal";
import { reviewFunding } from "@/lib/data/admin.functions";

const TABS = ["pending", "approved", "rejected"] as const;

export const Route = createFileRoute("/admin/funding")({ component: FundingPage });

function FundingPage() {
  const [tab, setTab] = useState<typeof TABS[number]>("pending");
  const [rows, setRows] = useState<any[]>([]);
  const review = useServerFn(reviewFunding);
  async function load() { setRows(await staffGetAllFundingRequests()); }
  useEffect(() => { load(); }, []);

  async function act(id: string, decision: "approved" | "rejected") {
    const notes = decision === "rejected" ? prompt("Reason:") ?? undefined : undefined;
    try { await review({ data: { id, decision, notes } }); toast.success(`Funding ${decision}`); load(); }
    catch (e: any) { toast.error(e.message); }
  }

  const list = rows.filter(r => r.status === tab && r.request_type === "deposit");
  return (
    <div>
      <PageHeader eyebrow="FINANCE OPS" title="Deposit Review Center" subtitle="Approve incoming deposits — funds are credited to the wallet on approval." />
      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((t) => {
          const c = rows.filter(r => r.status === t && r.request_type === "deposit").length;
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
          {list.map((d) => (
            <tr key={d.id}>
              <Td className="font-medium">{d.profile?.display_name ?? d.profile?.email ?? "—"}</Td>
              <Td><span className="font-mono">{moneyc(Number(d.amount))}</span></Td>
              <Td>{d.payment_method}</Td>
              <Td><span className="text-xs text-muted-foreground font-mono">{new Date(d.created_at).toLocaleString()}</span></Td>
              <Td><Pill tone={d.status === "approved" ? "success" : d.status === "rejected" ? "danger" : "warning"}>{d.status}</Pill></Td>
              <Td>
                <div className="flex justify-end gap-1">
                  <Link to="/admin/funding/$id" params={{ id: d.id }} className={btnGhost}>View</Link>
                  {d.status === "pending" && (
                    <>
                      <button onClick={() => act(d.id, "approved")} className={btnGhost}><Check className="h-3.5 w-3.5 text-emerald-400" />Approve</button>
                      <button onClick={() => act(d.id, "rejected")} className={btnGhost}><X className="h-3.5 w-3.5 text-red-400" />Reject</button>
                    </>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </DataTable>
        {list.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No deposits in {tab}.</div>}
      </Panel>
    </div>
  );
}
