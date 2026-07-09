import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Rocket } from "lucide-react";
import { PageHeader, Panel, Pill, StatCard, DataTable, Td, btnSecondary, inputCls } from "@/components/staff/ui";
import { adminListOrders, adminListHoldings, adminUpdateQuote, getQuote } from "@/lib/spacex";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/spacex")({
  component: AdminSpacex,
});

function AdminSpacex() {
  const [orders, setOrders] = useState<any[]>([]);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [quote, setQuote] = useState<any>(null);
  const [price, setPrice] = useState("");

  const reload = async () => {
    const [o, h, q] = await Promise.all([adminListOrders(), adminListHoldings(), getQuote()]);
    setOrders(o); setHoldings(h); setQuote(q); setPrice(String(q?.price ?? ""));
  };
  useEffect(() => { reload(); }, []);

  const totalShares = holdings.reduce((a, b) => a + Number(b.shares), 0);
  const totalInvested = holdings.reduce((a, b) => a + Number(b.total_invested), 0);
  const totalBuys = orders.filter((o) => o.side === "buy").length;
  const totalVolume = orders.reduce((a, b) => a + Number(b.amount), 0);

  const updatePrice = async () => {
    const p = Number(price);
    if (!p || p <= 0) return;
    try { await adminUpdateQuote("SPCX", { price: p, previous_close: quote?.price ?? p }); toast.success("Quote updated"); reload(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <PageHeader eyebrow="MARKETS" title="SpaceX Stock Operations" subtitle="Manage SPCX quotes, orders, and investor positions." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <StatCard label="SPCX Quote" value={`$${Number(quote?.price ?? 0).toFixed(2)}`} icon={<Rocket className="h-4 w-4" />} />
        <StatCard label="Holders" value={holdings.length} />
        <StatCard label="Total Shares" value={totalShares.toFixed(2)} />
        <StatCard label="Capital Deployed" value={`$${totalInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
      </div>

      <Panel title="Quote Control" className="mb-6">
        <div className="flex gap-3 items-end max-w-md">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">SPCX Price</label>
            <input type="number" step="0.01" className={inputCls + " w-full"} value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <button className={btnSecondary} onClick={updatePrice}>Update</button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Replaces the global price; previous close stored automatically.</p>
      </Panel>

      <Panel title="Investor Holdings" className="mb-6" padded={false}>
        <DataTable columns={["User", "Shares", "Avg Cost", "Invested", "Realized P/L"]}>
          {holdings.map((h) => (
            <tr key={h.id}>
              <Td><span className="font-mono text-xs">{h.user_id.slice(0, 8)}…</span></Td>
              <Td>{Number(h.shares).toFixed(4)}</Td>
              <Td>${Number(h.average_cost).toFixed(2)}</Td>
              <Td>${Number(h.total_invested).toFixed(2)}</Td>
              <Td>${Number(h.realized_pl).toFixed(2)}</Td>
            </tr>
          ))}
          {holdings.length === 0 && <tr><Td className="text-muted-foreground">No holdings yet.</Td></tr>}
        </DataTable>
      </Panel>

      <Panel title={`Recent Orders (${orders.length})`} padded={false} action={<Pill>{totalBuys} buys · ${totalVolume.toFixed(0)} vol</Pill>}>
        <DataTable columns={["Date", "User", "Side", "Shares", "Price", "Amount", "Status"]}>
          {orders.slice(0, 100).map((o) => (
            <tr key={o.id}>
              <Td className="text-muted-foreground text-xs">{new Date(o.created_at).toLocaleString()}</Td>
              <Td><span className="font-mono text-xs">{o.user_id.slice(0, 8)}…</span></Td>
              <Td><Pill tone={o.side === "buy" ? "info" : "warning"}>{o.side}</Pill></Td>
              <Td>{Number(o.shares).toFixed(4)}</Td>
              <Td>${Number(o.price).toFixed(2)}</Td>
              <Td>${Number(o.amount).toFixed(2)}</Td>
              <Td><Pill tone={o.status === "filled" ? "success" : o.status === "rejected" ? "danger" : "warning"}>{o.status}</Pill></Td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
