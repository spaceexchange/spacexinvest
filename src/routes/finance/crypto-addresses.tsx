import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader, Panel, DataTable, Td, btnPrimary, btnSecondary, inputCls, Pill } from "@/components/staff/ui";
import { staffGetCryptoAddresses, staffGetAllUsers, useRealtimeChannel } from "@/lib/data/portal";
import { assignCryptoAddress } from "@/lib/data/admin.functions";

export const Route = createFileRoute("/finance/crypto-addresses")({
  head: () => ({ meta: [{ title: "Crypto Addresses — Finance Desk" }] }),
  component: AddressesPage,
});

const ASSETS = [
  { asset: "BTC", network: "BTC" },
  { asset: "ETH", network: "ETH" },
  { asset: "USDT", network: "TRON" },
  { asset: "USDC", network: "ETH" },
];

function AddressesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ user_id: "", asset: "BTC", network: "BTC", address: "", memo: "" });
  const assign = useServerFn(assignCryptoAddress);

  async function load() {
    const [a, u] = await Promise.all([staffGetCryptoAddresses(), staffGetAllUsers(500)]);
    setRows(a); setUsers(u);
  }
  useEffect(() => { load(); }, []);
  useRealtimeChannel("crypto-addr", [{ table: "crypto_deposit_addresses" }], load);

  async function submit() {
    if (!form.user_id || !form.address) return toast.error("User and address required");
    try {
      await assign({ data: form });
      toast.success("Address assigned");
      setForm({ user_id: "", asset: "BTC", network: "BTC", address: "", memo: "" });
      load();
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div>
      <PageHeader eyebrow="FINANCE DESK" title="Crypto Deposit Addresses" subtitle="Assign per-investor receive addresses for supported assets." />

      <Panel title="Assign new address" className="mb-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
          <select value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} className={inputCls}>
            <option value="">Select investor…</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.email}</option>)}
          </select>
          <select value={`${form.asset}|${form.network}`} onChange={(e) => { const [a, n] = e.target.value.split("|"); setForm({ ...form, asset: a, network: n }); }} className={inputCls}>
            {ASSETS.map((a) => <option key={a.asset + a.network} value={`${a.asset}|${a.network}`}>{a.asset} · {a.network}</option>)}
          </select>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" className={`${inputCls} lg:col-span-2 font-mono text-xs`} />
          <input value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} placeholder="Memo (optional)" className={inputCls} />
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={submit} className={btnPrimary}>Assign</button>
          <button onClick={() => setForm({ user_id: "", asset: "BTC", network: "BTC", address: "", memo: "" })} className={btnSecondary}>Reset</button>
        </div>
      </Panel>

      <Panel title="Assigned addresses">
        <DataTable columns={["Investor", "Asset", "Network", "Address", "Memo", "Status", "Created"]}>
          {rows.map((r) => (
            <tr key={r.id}>
              <Td>{r.profile?.email ?? "—"}</Td>
              <Td className="font-semibold">{r.asset}</Td>
              <Td>{r.network}</Td>
              <Td><code className="text-[11px] font-mono break-all">{r.address}</code></Td>
              <Td className="text-xs">{r.memo ?? "—"}</Td>
              <Td><Pill tone={r.is_active ? "success" : "neutral"}>{r.is_active ? "active" : "inactive"}</Pill></Td>
              <Td><span className="text-xs text-muted-foreground font-mono">{new Date(r.created_at).toLocaleDateString()}</span></Td>
            </tr>
          ))}
        </DataTable>
        {rows.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No addresses assigned yet.</div>}
      </Panel>
    </div>
  );
}
