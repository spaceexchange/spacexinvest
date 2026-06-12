import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Minus, Snowflake, Sun, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader, Panel, Pill, DataTable, Td, btnGhost, StatCard } from "@/components/staff/ui";
import { staffGetAllWallets, moneyc } from "@/lib/data/portal";
import { adjustWallet, setWalletStatus } from "@/lib/data/admin.functions";

export const Route = createFileRoute("/admin/wallets")({ component: WalletsPage });

function WalletsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const adjust = useServerFn(adjustWallet);
  const setStatus = useServerFn(setWalletStatus);
  async function load() { setRows(await staffGetAllWallets()); }
  useEffect(() => { load(); }, []);

  async function credit(w: any, sign: 1 | -1) {
    const v = prompt(`${sign > 0 ? "Credit" : "Debit"} amount (USD):`);
    if (!v) return;
    const reason = prompt("Reason:") ?? "manual";
    try { await adjust({ data: { user_id: w.user_id, delta: Number(v) * sign, reason } }); toast.success("Wallet adjusted"); load(); }
    catch (e: any) { toast.error(e.message); }
  }
  async function flip(w: any) {
    try { await setStatus({ data: { wallet_id: w.id, status: w.status === "active" ? "frozen" : "active" } }); toast.success("Status updated"); load(); }
    catch (e: any) { toast.error(e.message); }
  }

  const total = rows.reduce((s, w) => s + Number(w.balance ?? 0), 0);
  return (
    <div>
      <PageHeader eyebrow="FINANCE OPS" title="Wallet Management" subtitle="Credit, debit, freeze, and audit user wallets." />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <StatCard label="Total Wallet Balances" value={moneyc(total)} icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Active Wallets" value={rows.filter(w => w.status === "active").length} />
        <StatCard label="Frozen Wallets" value={rows.filter(w => w.status === "frozen").length} tone="danger" />
      </div>
      <Panel>
        <DataTable columns={["User", "Balance", "Currency", "Status", "Updated", ""]}>
          {rows.map((w) => (
            <tr key={w.id}>
              <Td className="font-medium">{w.profile?.display_name ?? w.profile?.email ?? "—"}</Td>
              <Td><span className="font-mono">{moneyc(Number(w.balance))}</span></Td>
              <Td><span className="font-mono text-xs">{w.currency}</span></Td>
              <Td><Pill tone={w.status === "active" ? "success" : "danger"}>{w.status}</Pill></Td>
              <Td><span className="text-xs text-muted-foreground font-mono">{new Date(w.updated_at).toLocaleDateString()}</span></Td>
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
        {rows.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No wallets yet.</div>}
      </Panel>
    </div>
  );
}
