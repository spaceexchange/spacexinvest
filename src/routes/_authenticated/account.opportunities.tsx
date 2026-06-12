import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Pill, inputCls } from "@/components/dashboard/ui";
import { getOpportunities, reserveAllocation, money } from "@/lib/data/portal";
import { Sparkles, Calendar, Target, ArrowRight, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account/opportunities")({
  head: () => ({ meta: [{ title: "Opportunities — SpaceX IPO Exchange" }] }),
  component: OpportunitiesPage,
});

function OpportunitiesPage() {
  const [list, setList] = useState<any[]>([]);
  const [active, setActive] = useState("All");
  const [modal, setModal] = useState<any | null>(null);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() { setList(await getOpportunities()); }
  useEffect(() => { refresh(); }, []);

  const cats = Array.from(new Set(["All", ...list.map((o) => o.category)]));
  const filtered = active === "All" ? list : list.filter((o) => o.category === active);

  async function submit() {
    if (!modal || !amount) return;
    setBusy(true); setMsg(null);
    try {
      await reserveAllocation(modal.id, Number(amount));
      setMsg("Allocation reserved — pending admin approval.");
      setAmount(""); setTimeout(() => setModal(null), 1500);
    } catch (e: any) { setMsg(e.message); }
    setBusy(false);
  }

  return (
    <div>
      <PageHeader title="Investment Opportunities" subtitle="Curated allocations vetted by our investment committee." />

      <div className="flex flex-wrap gap-2 mb-5">
        {cats.map((f) => (
          <button key={f} onClick={() => setActive(f)} className={`h-8 px-3 rounded-md text-xs font-medium transition-colors ${active === f ? "bg-accent-blue text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{f}</button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map((o) => {
          const pct = Math.min(100, (Number(o.raised_amount) / Number(o.target_amount || 1)) * 100);
          return (
            <Panel key={o.id}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-accent-blue/20 to-purple-500/20 grid place-items-center text-accent-blue shrink-0"><Sparkles className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">{o.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{o.description}</div>
                  </div>
                </div>
                <Pill tone="info">{o.category}</Pill>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
                <Detail icon={<Target className="h-3 w-3" />} label="Target" value={money(Number(o.target_amount))} />
                <Detail icon={<Sparkles className="h-3 w-3" />} label="Min" value={money(Number(o.minimum_investment))} />
                <Detail icon={<Calendar className="h-3 w-3" />} label="Closes" value={o.close_date ? new Date(o.close_date).toLocaleDateString() : "—"} />
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase mb-1.5"><span>Raised</span><span>{pct.toFixed(0)}%</span></div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-accent-blue" style={{ width: `${pct}%` }} /></div>
              </div>

              <button onClick={() => { setModal(o); setMsg(null); }} disabled={o.status !== "open"} className="w-full h-10 rounded-md bg-accent-blue/10 border border-accent-blue/30 text-sm font-medium text-accent-blue hover:bg-accent-blue/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {o.status === "open" ? <>Reserve allocation <ArrowRight className="h-4 w-4" /></> : `Status: ${o.status}`}
              </button>
            </Panel>
          );
        })}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4" onClick={() => setModal(null)}>
          <div className="glass-card rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="text-[10px] font-mono tracking-[0.3em] text-muted-foreground mb-1">RESERVE ALLOCATION</div>
                <h3 className="text-lg font-semibold text-foreground">{modal.title}</h3>
              </div>
              <button onClick={() => setModal(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>

            <label className="block mb-3">
              <span className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase block mb-1.5">Amount (USD)</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Min ${money(Number(modal.minimum_investment))}`} className={inputCls} />
            </label>
            <div className="text-xs text-muted-foreground mb-4">
              Price per share: <span className="text-foreground">{money(Number(modal.price_per_share), 2)}</span><br />
              Estimated shares: <span className="text-foreground">{amount ? (Number(amount) / Number(modal.price_per_share || 1)).toFixed(2) : "—"}</span>
            </div>

            {msg && <div className="text-xs mb-3 text-accent-blue">{msg}</div>}

            <button onClick={submit} disabled={busy || !amount || Number(amount) < Number(modal.minimum_investment)} className="btn-primary w-full disabled:opacity-50">
              {busy ? "Submitting…" : "Submit reservation"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-2">
      <div className="text-[9px] font-mono tracking-[0.2em] text-muted-foreground uppercase mb-1 flex items-center gap-1">{icon} {label}</div>
      <div className="text-xs font-semibold text-foreground truncate">{value}</div>
    </div>
  );
}
