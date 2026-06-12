import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, X, FileText } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader, Panel, Pill, DataTable, Td, btnGhost } from "@/components/staff/ui";
import { staffGetAllKyc } from "@/lib/data/portal";
import { reviewKyc } from "@/lib/data/admin.functions";

export const Route = createFileRoute("/support/compliance")({ component: ComplianceQueue });

function ComplianceQueue() {
  const [rows, setRows] = useState<any[]>([]);
  const review = useServerFn(reviewKyc);
  async function load() { setRows(await staffGetAllKyc()); }
  useEffect(() => { load(); }, []);

  async function act(id: string, decision: "approved" | "rejected" | "info_requested") {
    const notes = decision !== "approved" ? prompt("Notes for the user:") ?? undefined : undefined;
    try { await review({ data: { id, decision, notes } }); toast.success(`KYC ${decision}`); load(); }
    catch (e: any) { toast.error(e.message); }
  }

  const list = rows.filter(r => r.status === "pending");
  return (
    <div>
      <PageHeader eyebrow="COMPLIANCE" title="KYC Review Queue" subtitle="Review identity submissions and approve, request info, or reject." />
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
                <div className="flex justify-end gap-1">
                  <button onClick={() => act(k.id, "approved")} className={btnGhost}><Check className="h-3.5 w-3.5 text-emerald-400" />Approve</button>
                  <button onClick={() => act(k.id, "info_requested")} className={btnGhost}><FileText className="h-3.5 w-3.5 text-yellow-400" />Info</button>
                  <button onClick={() => act(k.id, "rejected")} className={btnGhost}><X className="h-3.5 w-3.5 text-red-400" />Reject</button>
                </div>
              </Td>
            </tr>
          ))}
        </DataTable>
        {list.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No pending submissions.</div>}
      </Panel>
    </div>
  );
}
