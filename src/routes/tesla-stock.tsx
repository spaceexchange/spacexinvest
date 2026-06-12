import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell, PageHero } from "@/components/site/SiteShell";
import { InvestorCTA } from "@/components/site/InvestorCTA";
import tesla from "@/assets/tesla-showcase.jpg";

export const Route = createFileRoute("/tesla-stock")({
  head: () => ({
    meta: [
      { title: "Tesla Stock — SpaceX IPO Exchange" },
      { name: "description", content: "Trade TSLA equity alongside SpaceX, with live charts, watchlists and analytics." },
      { property: "og:title", content: "Tesla Stock" },
      { property: "og:description", content: "Trade TSLA with real-time charts, watchlists and integrated analytics." },
      { property: "og:image", content: tesla },
    ],
  }),
  component: TeslaStock,
});

function TeslaStock() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="TESLA INVESTMENT CENTER"
        title="Trade TSLA with aerospace-grade tooling."
        description="Real-time price, fundamental analytics, watchlists and side-by-side comparison with your SpaceX allocation."
        image={tesla}
      />

      <section className="border-b border-border bg-surface/40">
        <div className="container-x py-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="font-mono text-[11px] tracking-widest text-muted-foreground">TSLA · NASDAQ</div>
            <div className="font-display text-5xl mt-2 silver-text">$392.70</div>
            <div className="text-success font-mono text-sm mt-1">+6.74 (+2.43%) TODAY</div>
          </div>
          <div className="flex gap-2">
            {["1D", "1W", "1M", "3M", "1Y", "5Y"].map((p, i) => (
              <button key={p} className={`px-3 py-1.5 text-xs font-mono tracking-widest border rounded ${i === 2 ? "border-accent-blue text-accent-blue" : "border-border text-muted-foreground hover:text-foreground"}`}>{p}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-12">
        <div className="glass-card p-6">
          <svg viewBox="0 0 800 220" className="w-full h-56">
            <defs>
              <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.62 0.18 245)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="oklch(0.62 0.18 245)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,160 C80,140 140,180 200,150 C260,120 320,90 380,110 C440,130 500,70 560,60 C620,50 680,80 740,40 L800,30 L800,220 L0,220 Z" fill="url(#g)" />
            <path d="M0,160 C80,140 140,180 200,150 C260,120 320,90 380,110 C440,130 500,70 560,60 C620,50 680,80 740,40 L800,30" stroke="oklch(0.62 0.18 245)" strokeWidth="2" fill="none" />
          </svg>
        </div>

        <div className="mt-10 grid md:grid-cols-4 gap-5">
          {[
            { l: "Market Cap", v: "$904B" },
            { l: "P/E Ratio", v: "62.4" },
            { l: "52W High", v: "$299.29" },
            { l: "52W Low", v: "$138.80" },
            { l: "Volume", v: "84.2M" },
            { l: "Avg Vol", v: "92.1M" },
            { l: "Dividend", v: "—" },
            { l: "Beta", v: "2.34" },
          ].map((s) => (
            <div key={s.l} className="glass-card p-5">
              <div className="font-mono text-[10px] tracking-widest text-muted-foreground">{s.l.toUpperCase()}</div>
              <div className="font-display text-xl mt-2">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface/30 py-20">
        <div className="container-x grid lg:grid-cols-3 gap-5">
          {[
            { t: "Watchlist", d: "Pin TSLA, SpaceX SPV, and a curated frontier-tech list to your dashboard." },
            { t: "Auto-reports", d: "Weekly performance digests delivered to your inbox with P&L attribution." },
            { t: "Compare", d: "Benchmark your Tesla position against your SpaceX allocation in real time." },
          ].map((f) => (
            <div key={f.t} className="glass-card glass-card-hover p-7">
              <div className="font-display text-xl">{f.t}</div>
              <p className="mt-3 text-muted-foreground text-sm">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <InvestorCTA
        eyebrow="TSLA ACCESS"
        title="Start trading TSLA today."
        description="Open an investor account to trade Tesla alongside your SpaceX allocation in one secure portal."
      />

      <section className="border-t border-border bg-surface/30 py-12">
        <div className="container-x text-center">
          <Link to="/tesla-vehicles" className="btn-ghost">View Tesla Vehicles</Link>
        </div>
      </section>
    </SiteShell>
  );
}
