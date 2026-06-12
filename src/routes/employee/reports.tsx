import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, DataTable, Td, btnGhost } from "@/components/staff/ui";
import { staffGetDashboardStats, moneyc } from "@/lib/data/portal";

export const Route = createFileRoute("/employee/reports")({ component: ReportsPage });

function ReportsPage() {
  const [s, setS] = useState<any>(null);
  useEffect(() => { (async () => setS(await staffGetDashboardStats()))(); }, []);

  function exportSnapshot() {
    if (!s) return;
    const csv = "Metric,Value\n" + Object.entries(s).map(([k, v]) => `${k},${v}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `platform-snapshot-${Date.now()}.csv`; a.click();
    toast.success("Snapshot downloaded");
  }

  return (
    <div>
      <PageHeader eyebrow="STAFF WORKSPACE" title="Reports Center" subtitle="Live platform metrics — export to CSV." />
      <Panel>
        <DataTable columns={["Metric", "Value", ""]}>
          {s && Object.entries(s).map(([k, v]) => (
            <tr key={k}>
              <Td className="font-medium">{k}</Td>
              <Td><span className="font-mono">{typeof v === "number" && (k === "aum" || k === "walletBalances") ? moneyc(v) : String(v)}</span></Td>
              <Td><div className="flex justify-end"><button onClick={exportSnapshot} className={btnGhost}><Download className="h-3.5 w-3.5" />Export</button></div></Td>
            </tr>
          ))}
        </DataTable>
        {!s && <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>}
      </Panel>
    </div>
  );
}
