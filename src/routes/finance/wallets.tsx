import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Minus, Snowflake, Sun } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader, Panel, Pill, DataTable, Td, btnGhost } from "@/components/staff/ui";
import { staffGetAllWallets, moneyc } from "@/lib/data/portal";
import { adjustWallet, setWalletStatus } from "@/lib/data/admin.functions";

export const Route = createFileRoute("/finance/wallets")({ component: WalletsPage });

function WalletsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const adjust = useServerFn(adjustWallet);
  const setStatus = useServerFn(setWalletStatus);
  async function load() { setRows(await staffGetAllWallets()); }
  useEffect(() => { load(); }, []);
  async function credit(w: any, sign: 1 | -1) {
    const v = prompt(`${sign > 0 ? "Credit" : "Debit"} amount (USD):`); if (!v) return;
    const reason = prompt("Reason:") ?? "manual";
    try { await adjust({ data: { user_id: w.user_id, delta: Number(v) * sign, reason } }); toast.success("Adjusted"); load(); }
    catch (e: any) { toast.error(e.message); }
  }
  async function flip(w: any) {
    try { await setStatus({ data: { wallet_id: w.id, status: w.status === "active" ? "frozen" : "active" } }); toast.success("Status updated"); load(); }
    catch (e: any) { toast.error(e.message); }
  }
  return (
    <div>
      <PageHeader eyebrow="FINANCE DESK" title="Wallets" subtitle="Credit, debit, freeze, and audit wallets." />
      <Panel>
        <DataTable columns={["User", "Balance", "Status", ""]}>
          {rows.map((w) => (
            <tr key={w.id}>
              <Td className="font-medium">{w.profile?.email ?? "—"}</Td>
              <Td><span className="font-mono">{moneyc(Number(w.balance))}</span></Td>
              <Td><Pill tone={w.status === "active" ? "success" : "danger"}>{w.status}</Pill></Td>
              <Td>
                <div className="flex justify-end gap-1 flex-wrap">
                  <button onClick={() => credit(w, 1)} className={btnGhost}><Plus className="h-3.5 w-3.5" />Credit</button>
                  <button onClick={() => credit(w, -1)} className={btnGhost}><Minus className="h-3.5 w-3.5" />Debit</button>
                  <button onClick={() => flip(w)} className={btnGhost}>
                    {w.status === "active" ? <><Snowflake className="h-3.5 w-3.5 text-accent-blue" />Freeze</> : <><Sun className="h-3.5 w-3.5 text-yellow-400" />Unfreeze</>}
                  </button>
                </div>
              </Td>
            </tr>
          ))}
        </DataTable>
        {rows.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No wallets.</div>}
      </Panel>
    </div>
  );
}
