import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, X, FileText } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader, Panel, Pill, DataTable, Td, btnGhost } from "@/components/staff/ui";
import { staffGetAllKyc } from "@/lib/data/portal";
import { reviewKyc } from "@/lib/data/admin.functions";

export const Route = createFileRoute("/compliance/kyc")({ component: KycQueue });

function KycQueue() {
  const [rows, setRows] = useState<any[]>([]);
  const [tab, setTab] = useState<"pending" | "info_requested" | "approved" | "rejected">("pending");
  const review = useServerFn(reviewKyc);
  async function load() { setRows(await staffGetAllKyc()); }
  useEffect(() => { load(); }, []);
  async function act(id: string, decision: "approved" | "rejected" | "info_requested") {
    const notes = decision !== "approved" ? prompt("Notes:") ?? undefined : undefined;
    try { await review({ data: { id, decision, notes } }); toast.success(`KYC ${decision}`); load(); }
    catch (e: any) { toast.error(e.message); }
  }
  const TABS = ["pending", "info_requested", "approved", "rejected"] as const;
  const list = rows.filter(r => r.status === tab);
  return (
    <div>
      <PageHeader eyebrow="COMPLIANCE DESK" title="KYC Queue" subtitle="Approve, request info, or reject identity submissions." />
      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((t) => {
          const c = rows.filter(r => r.status === t).length;
          const active = tab === t;
          return <button key={t} onClick={() => setTab(t)} className={`px-3 h-9 rounded-md border text-sm ${active ? "border-accent-blue/40 bg-accent-blue/10 text-accent-blue" : "border-border bg-surface/40"}`}>{t} <span className="text-xs text-muted-foreground ml-1">({c})</span></button>;
        })}
      </div>
      <Panel>
        <DataTable columns={["User", "Name", "Country", "Doc", "Submitted", ""]}>
          {list.map((k) => (
            <tr key={k.id}>
              <Td><span className="text-xs">{k.profile?.email ?? "—"}</span></Td>
              <Td className="font-medium">{k.first_name} {k.last_name}</Td>
              <Td>{k.nationality ?? "—"}</Td>
              <Td>{k.document_type}</Td>
              <Td><span className="text-xs text-muted-foreground font-mono">{new Date(k.submitted_at).toLocaleDateString()}</span></Td>
              <Td>
                {k.status === "pending" && (
                  <div className="flex justify-end gap-1">
                    <button onClick={() => act(k.id, "approved")} className={btnGhost}><Check className="h-3.5 w-3.5 text-emerald-400" />Approve</button>
                    <button onClick={() => act(k.id, "info_requested")} className={btnGhost}><FileText className="h-3.5 w-3.5 text-yellow-400" />Info</button>
                    <button onClick={() => act(k.id, "rejected")} className={btnGhost}><X className="h-3.5 w-3.5 text-red-400" />Reject</button>
                  </div>
                )}
              </Td>
            </tr>
          ))}
        </DataTable>
        {list.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">Nothing here.</div>}
      </Panel>
    </div>
  );
}
