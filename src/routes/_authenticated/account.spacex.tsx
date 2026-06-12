import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Rocket, ShoppingCart, Download, Wallet } from "lucide-react";
import { PageHeader, Panel, Pill, StatCard, inputCls } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getQuote, getMyHolding, getMyOrders, placeBuyOrder, placeSellOrder, type PaymentMethod } from "@/lib/spacex";
import { getMyWalletBalance, getInvoiceForOrder } from "@/lib/m5";
import { exportCsv, exportPdf } from "@/lib/exports";
import { StockChart } from "@/components/dashboard/StockChart";


export const Route = createFileRoute("/_authenticated/account/spacex")({
  head: () => ({ meta: [{ title: "SpaceX Stock — SpaceX IPO Exchange" }] }),
  component: SpacexPage,
});

function SpacexPage() {
  const navigate = useNavigate();
  const [quote, setQuote] = useState<any>(null);
  const [holding, setHolding] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [walletBal, setWalletBal] = useState(0);
  const [open, setOpen] = useState<null | "buy" | "sell">(null);
  const [shares, setShares] = useState("1");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("wallet");
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    const [q, h, o, b] = await Promise.all([getQuote(), getMyHolding(), getMyOrders(), getMyWalletBalance()]);
    setQuote(q); setHolding(h); setOrders(o); setWalletBal(b);
  };
  useEffect(() => { reload(); }, []);

  const price = Number(quote?.price ?? 0);
  const prev = Number(quote?.previous_close ?? price);
  const change = price - prev;
  const changePct = prev ? (change / prev) * 100 : 0;
  const sharesOwned = Number(holding?.shares ?? 0);
  const avgCost = Number(holding?.average_cost ?? 0);
  const invested = Number(holding?.total_invested ?? 0);
  const marketValue = sharesOwned * price;
  const unrealized = marketValue - invested;
  const realized = Number(holding?.realized_pl ?? 0);

  const orderQty = Number(shares) || 0;
  const orderAmt = orderQty * price;
  const remainingAfter = walletBal - orderAmt;
  const walletInsufficient = open === "buy" && payMethod === "wallet" && orderAmt > walletBal;

  const submitOrder = async () => {
    if (!orderQty || orderQty <= 0) return;
    setBusy(true);
    try {
      if (open === "buy") {
        const order: any = await placeBuyOrder(orderQty, price, "SPXI", payMethod);
        if (payMethod === "wallet") {
          toast.success(`Order filled: buy ${orderQty} SPXI`);
          setOpen(null); setShares("1"); reload();
        } else {
          toast.success("Order created. Complete payment in the Funding Center.");
          setOpen(null);
          const invId = await getInvoiceForOrder(order.id, "spacex_order");
          navigate({ to: "/account/funding", search: { invoice: invId } as any });
        }
      } else {
        await placeSellOrder(orderQty, price);
        toast.success(`Order filled: sell ${orderQty} SPXI`);
        setOpen(null); setShares("1"); reload();
      }
    } catch (e: any) { toast.error(e.message ?? "Order failed"); }
    finally { setBusy(false); }
  };

  const exportHoldings = () => {
    exportCsv("spacex-holdings", [
      { key: "symbol", label: "Symbol" }, { key: "shares", label: "Shares" },
      { key: "avg", label: "Avg Cost" }, { key: "invested", label: "Invested" },
      { key: "value", label: "Market Value" }, { key: "pl", label: "Unrealized P/L" },
    ], [{ symbol: "SPXI", shares: sharesOwned, avg: avgCost.toFixed(2), invested: invested.toFixed(2), value: marketValue.toFixed(2), pl: unrealized.toFixed(2) }]);
  };

  const exportHistory = async () => {
    await exportPdf("spacex-orders", "SpaceX Order History",
      [{ key: "date", label: "Date", width: 2 }, { key: "side", label: "Side", width: 1 }, { key: "shares", label: "Shares", width: 1 }, { key: "price", label: "Price", width: 1 }, { key: "amount", label: "Amount", width: 1 }, { key: "status", label: "Status", width: 1 }],
      orders.map((o) => ({ date: new Date(o.created_at).toLocaleString(), side: o.side, shares: o.shares, price: `$${Number(o.price).toFixed(2)}`, amount: `$${Number(o.amount).toFixed(2)}`, status: o.status })),
    );
  };

  return (
    <div>
      <PageHeader title="SpaceX Stock" subtitle="Trade SPXI pre-IPO shares from your investor wallet."
        action={<div className="flex gap-2"><Button onClick={() => setOpen("buy")}><ShoppingCart className="h-4 w-4 mr-1" />Buy</Button>{sharesOwned > 0 && <Button variant="outline" onClick={() => setOpen("sell")}>Sell</Button>}</div>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <StatCard label="SPXI Price" value={`$${price.toFixed(2)}`} change={changePct} icon={<Rocket className="h-4 w-4" />} />
        <StatCard label="Shares Owned" value={sharesOwned.toFixed(4)} />
        <StatCard label="Avg Cost" value={`$${avgCost.toFixed(2)}`} />
        <StatCard label="Market Value" value={`$${marketValue.toFixed(2)}`} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <StatCard label="Total Invested" value={`$${invested.toFixed(2)}`} />
        <StatCard label="Unrealized P/L" value={`$${unrealized.toFixed(2)}`} change={invested ? (unrealized / invested) * 100 : 0} />
        <StatCard label="Realized P/L" value={`$${realized.toFixed(2)}`} />
        <StatCard label="52W Range" value={`$${Number(quote?.week52_low ?? 0).toFixed(0)}–$${Number(quote?.week52_high ?? 0).toFixed(0)}`} />
      </div>

      <Panel title="SPXI Market Chart" className="mb-6">
        <StockChart symbol="SPXI" price={price} />
      </Panel>



      <Panel title="Holdings" className="mb-6" action={<Button variant="ghost" size="sm" onClick={exportHoldings}><Download className="h-3.5 w-3.5 mr-1" />CSV</Button>}>
        {sharesOwned > 0 ? (
          <table className="w-full text-sm">
            <thead><tr className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase border-b border-border"><th className="text-left py-2">Symbol</th><th className="text-right py-2">Shares</th><th className="text-right py-2">Avg</th><th className="text-right py-2">Value</th><th className="text-right py-2">P/L</th></tr></thead>
            <tbody><tr><td className="py-2 font-mono">SPXI</td><td className="text-right">{sharesOwned.toFixed(4)}</td><td className="text-right">${avgCost.toFixed(2)}</td><td className="text-right">${marketValue.toFixed(2)}</td><td className={`text-right ${unrealized >= 0 ? "text-emerald-400" : "text-red-400"}`}>${unrealized.toFixed(2)}</td></tr></tbody>
          </table>
        ) : <p className="text-sm text-muted-foreground">You don't own any SpaceX shares yet.</p>}
      </Panel>

      <Panel title="Order History" action={<Button variant="ghost" size="sm" onClick={exportHistory}><Download className="h-3.5 w-3.5 mr-1" />PDF</Button>}>
        {orders.length === 0 ? <p className="text-sm text-muted-foreground">No orders yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead><tr className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase border-b border-border"><th className="text-left py-2">Date</th><th className="text-left">Side</th><th className="text-right">Shares</th><th className="text-right">Price</th><th className="text-right">Amount</th><th className="text-left pl-3">Status</th></tr></thead>
              <tbody className="divide-y divide-border/60">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="py-2 text-muted-foreground">{new Date(o.created_at).toLocaleString()}</td>
                    <td><Pill tone={o.side === "buy" ? "info" : "warning"}>{o.side}</Pill></td>
                    <td className="text-right">{Number(o.shares).toFixed(4)}</td>
                    <td className="text-right">${Number(o.price).toFixed(2)}</td>
                    <td className="text-right">${Number(o.amount).toFixed(2)}</td>
                    <td className="pl-3"><Pill tone={o.status === "filled" ? "success" : o.status === "rejected" ? "danger" : "warning"}>{o.status}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{open === "buy" ? "Buy" : "Sell"} SPXI</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Shares</label>
              <input type="number" min="0.0001" step="0.0001" className={inputCls} value={shares} onChange={(e) => setShares(e.target.value)} />
            </div>
            <div className="text-sm flex justify-between"><span className="text-muted-foreground">Price</span><span className="font-mono">${price.toFixed(2)}</span></div>
            <div className="text-sm flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-mono font-semibold">${orderAmt.toFixed(2)}</span></div>
            {open === "buy" && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["wallet","crypto","bank"] as const).map((m) => (
                      <button key={m} type="button" onClick={() => setPayMethod(m)}
                        className={`px-2 py-2 rounded-md border text-xs capitalize transition ${payMethod === m ? "border-accent-blue bg-accent-blue/10 text-accent-blue" : "border-border hover:border-accent-blue/40"}`}>
                        {m === "wallet" ? "Wallet" : m === "crypto" ? "Crypto" : "Bank"}
                      </button>
                    ))}
                  </div>
                </div>
                {payMethod === "wallet" && (
                  <div className="rounded-md border border-border bg-surface/40 p-2.5 text-xs space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><Wallet className="h-3 w-3" />Wallet balance</span><span className="font-mono">${walletBal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Remaining after</span><span className={`font-mono ${remainingAfter < 0 ? "text-red-400" : ""}`}>${remainingAfter.toFixed(2)}</span></div>
                  </div>
                )}
                {payMethod !== "wallet" && <p className="text-[11px] text-muted-foreground">You'll be redirected to the Funding Center with an invoice for ${orderAmt.toFixed(2)}.</p>}
                {walletInsufficient && <p className="text-xs text-red-400">Insufficient wallet balance. Switch to crypto/bank or deposit funds.</p>}
                <div className="text-sm pt-1 border-t border-border/60">You are buying <span className="font-mono font-semibold">{orderQty}</span> SpaceX shares for <span className="font-mono font-semibold">${orderAmt.toFixed(2)}</span>.</div>
              </>
            )}
            {open === "sell" && orderQty > sharesOwned && <p className="text-xs text-red-400">You only own {sharesOwned.toFixed(4)} shares.</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
            <Button onClick={submitOrder} disabled={busy || !orderQty || walletInsufficient || (open === "sell" && orderQty > sharesOwned)}>{busy ? "Processing…" : open === "buy" ? (payMethod === "wallet" ? "Confirm buy" : "Continue to payment") : "Confirm sell"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
