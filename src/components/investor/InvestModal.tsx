import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { allocateInvestment } from "@/lib/data/invest.functions";
import { getMyAllWallets } from "@/lib/data/portal";
import { X } from "lucide-react";
import { toast } from "sonner";

export function InvestModal({ open, onClose, opportunity, onSuccess }: {
  open: boolean; onClose: () => void; opportunity: any; onSuccess?: () => void;
}) {
  const [wallets, setWallets] = useState<any[]>([]);
  const [walletId, setWalletId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const invest = useServerFn(allocateInvestment);

  useEffect(() => {
    if (!open) return;
    getMyAllWallets().then((ws) => {
      setWallets(ws);
      const usd = ws.find((w: any) => w.currency === "USD") ?? ws[0];
      if (usd) setWalletId(usd.id);
    });
    setAmount(String(opportunity?.minimum_investment ?? ""));
  }, [open, opportunity]);

  if (!open) return null;
  const wallet = wallets.find((w) => w.id === walletId);
  const amt = parseFloat(amount) || 0;
  const pps = Number(opportunity?.price_per_share) || 1;
  const shares = amt / pps;
  const remaining = Number(opportunity?.target_amount ?? 0) - Number(opportunity?.raised_amount ?? 0);
  const insufficient = wallet && amt > Number(wallet.balance);

  const submit = async () => {
    if (!walletId || amt <= 0) { toast.error("Enter amount and select a wallet"); return; }
    setSubmitting(true);
    try {
      const r = await invest({ data: { opportunity_id: opportunity.id, amount: amt, wallet_id: walletId } });
      toast.success("Investment confirmed", { description: `Allocated ${shares.toFixed(4)} shares.` });
      onClose(); onSuccess?.();
      return r;
    } catch (e: any) {
      toast.error("Investment failed", { description: e?.message ?? String(e) });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md glass-card rounded-xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[10px] font-mono tracking-[0.3em] text-accent-blue mb-1">INVEST NOW</div>
            <h3 className="text-lg font-semibold">{opportunity?.title}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-mono tracking-[0.25em] text-muted-foreground uppercase">Amount (USD)</label>
            <input
              type="number" min={opportunity?.minimum_investment ?? 0}
              value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-full mt-1 h-11 px-3 rounded-md border border-border bg-surface/60 text-base focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
              placeholder={`Min ${opportunity?.minimum_investment ?? 0}`}
            />
            <div className="text-[11px] text-muted-foreground mt-1 font-mono">
              Min ${Number(opportunity?.minimum_investment ?? 0).toLocaleString()}
              {opportunity?.maximum_investment ? ` · Max $${Number(opportunity.maximum_investment).toLocaleString()}` : ""}
              {remaining > 0 ? ` · Remaining $${remaining.toLocaleString()}` : ""}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono tracking-[0.25em] text-muted-foreground uppercase">Funding wallet</label>
            <select value={walletId} onChange={(e) => setWalletId(e.target.value)}
              className="w-full mt-1 h-11 px-3 rounded-md border border-border bg-surface/60 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/40">
              {wallets.length === 0 && <option>No wallets — fund first</option>}
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>{w.currency} · Balance {Number(w.balance).toLocaleString()}</option>
              ))}
            </select>
          </div>

          <div className="rounded-md border border-border bg-surface/40 p-3 text-sm space-y-1">
            <Row label="Shares" value={shares.toFixed(4)} />
            <Row label="Price per share" value={`$${pps.toLocaleString()}`} />
            <Row label="Total" value={`$${amt.toLocaleString()}`} bold />
            {insufficient && <div className="text-xs text-red-400 mt-1">Insufficient wallet balance. <a href="/account/funding" className="underline">Add funds</a>.</div>}
          </div>

          <div className="text-[11px] text-muted-foreground">
            By confirming you authorize an immediate debit from the selected wallet. This action is logged.
          </div>

          <button onClick={submit} disabled={submitting || !walletId || amt <= 0 || insufficient}
            className="w-full h-11 rounded-md bg-accent-blue text-white font-medium disabled:opacity-50 hover:bg-accent-blue/90 transition-colors">
            {submitting ? "Processing…" : "Confirm investment"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: any) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}
