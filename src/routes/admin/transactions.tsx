import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { PageHeader, Panel, Pill, DataTable, Td, inputCls } from "@/components/staff/ui";
import { staffGetWalletTransactions, moneyc } from "@/lib/data/portal";

export const Route = createFileRoute("/admin/transactions")({ component: TxPage });

function TxPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("All");
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { (async () => setRows(await staffGetWalletTransactions(300)))(); }, []);

  const TYPES = ["All", ...Array.from(new Set(rows.map(r => r.transaction_type)))];
  const list = rows.filter(t =>
    (!q || t.reference?.toLowerCase().includes(q.toLowerCase()) || t.id.includes(q)) &&
    (type === "All" || t.transaction_type === type));
  return (
    <div>
      <PageHeader eyebrow="FINANCE OPS" title="Transaction Center" subtitle="Every wallet movement on the platform." />
      <Panel>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reference or id…" className={`${inputCls} w-full pl-9`} />
          </div>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <DataTable columns={["Reference", "Type", "Amount", "Balance After", "Status", "Date"]}>
          {list.map((t) => (
            <tr key={t.id}>
              <Td><span className="font-mono text-xs">{t.reference ?? t.id.slice(0, 8)}</span></Td>
              <Td>{t.transaction_type}</Td>
              <Td><span className="font-mono">{moneyc(Number(t.amount))}</span></Td>
              <Td><span className="font-mono text-xs">{moneyc(Number(t.balance_after))}</span></Td>
              <Td><Pill tone={t.status === "completed" ? "success" : "warning"}>{t.status}</Pill></Td>
              <Td><span className="text-xs text-muted-foreground font-mono">{new Date(t.created_at).toLocaleString()}</span></Td>
            </tr>
          ))}
        </DataTable>
        {list.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No transactions.</div>}
      </Panel>
    </div>
  );
}
