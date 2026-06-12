import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Pill, DataTable, Td } from "@/components/staff/ui";
import { staffGetWalletTransactions, moneyc } from "@/lib/data/portal";

export const Route = createFileRoute("/finance/transactions")({ component: TxPage });

function TxPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { (async () => setRows(await staffGetWalletTransactions(300)))(); }, []);
  return (
    <div>
      <PageHeader eyebrow="FINANCE DESK" title="Transaction Ledger" subtitle="Every wallet movement on the platform." />
      <Panel>
        <DataTable columns={["Reference", "Type", "Amount", "Balance After", "Status", "Date"]}>
          {rows.map((t) => (
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
        {rows.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No transactions.</div>}
      </Panel>
    </div>
  );
}
