import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell, PageHero } from "@/components/site/SiteShell";
import { InvestorCTA } from "@/components/site/InvestorCTA";
import { Rocket, Satellite, Shield, TrendingUp } from "lucide-react";
import hero from "@/assets/hero-rocket.jpg";

export const Route = createFileRoute("/spacex")({
  head: () => ({
    meta: [
      { title: "SpaceX IPO Shares — SpaceX IPO Exchange" },
      { name: "description", content: "Buy pre-IPO SpaceX shares. Live valuation, allocation rounds and structure documents." },
      { property: "og:title", content: "SpaceX IPO Shares" },
      { property: "og:description", content: "Allocation rounds, valuation and structure for pre-IPO SpaceX investors." },
      { property: "og:image", content: hero },
    ],
  }),
  component: SpaceX,
});

function SpaceX() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="SPACEX IPO CENTER"
        title="Pre-IPO SpaceX shares — direct allocation."
        description="Round 04 is open. Acquire SpaceX equity through compliant SPVs with full custody, statements and certificates."
        image={hero}
      />

      {/* Live ticker */}
      <section className="border-b border-border bg-surface/50">
        <div className="container-x py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { l: "Implied Share Price", v: "$112.40" },
            { l: "Valuation", v: "$420B" },
            { l: "Round 04 Filled", v: "68%" },
            { l: "Min. Allocation", v: "$10,000" },
          ].map((m) => (
            <div key={m.l}>
              <div className="font-mono text-[10px] tracking-widest text-muted-foreground">{m.l.toUpperCase()}</div>
              <div className="font-display text-xl md:text-2xl mt-1 silver-text">{m.v}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section-y">
        <div className="container-x grid lg:grid-cols-3 gap-5">
          {[
            { i: Rocket, t: "Falcon & Starship", d: "Reusable launch, the most active rocket program in history.", v: "$8.2B rev" },
            { i: Satellite, t: "Starlink Network", d: "5M+ subscribers and growing across 100+ countries.", v: "$6.6B rev" },
            { i: Shield, t: "Government Contracts", d: "NASA, USSF and Starshield. Multi-decade revenue floors.", v: "$3.4B rev" },
            { i: TrendingUp, t: "Crew & Cargo", d: "Sole U.S. provider of crewed orbital flight.", v: "$2.1B rev" },
            { i: Rocket, t: "Starship Logistics", d: "Lunar HLS, Mars cargo, point-to-point Earth.", v: "Pre-rev" },
            { i: Satellite, t: "Starshield Defense", d: "Classified ISR satellites for U.S. and allies.", v: "$1.8B rev" },
          ].map((c) => (
            <div key={c.t} className="glass-card glass-card-hover p-7">
              <div className="flex items-start justify-between">
                <c.i className="h-6 w-6 text-accent-blue" />
                <span className="font-mono text-[10px] tracking-widest text-success">{c.v}</span>
              </div>
              <div className="font-display text-xl mt-5">{c.t}</div>
              <p className="text-sm text-muted-foreground mt-2">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface/30 py-20">
        <div className="container-x grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="font-mono text-[11px] tracking-[0.3em] text-accent-blue mb-3">ALLOCATION ROUNDS</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Transparent, tiered access.</h2>
            <p className="mt-4 text-muted-foreground">Each round closes when its allocation cap is filled. Pricing reflects the most recent secondary-market reference.</p>
          </div>
          <div className="space-y-3">
            {[
              { r: "Round 01", s: "Closed", p: "$72/share", f: "100%", c: "muted" },
              { r: "Round 02", s: "Closed", p: "$88/share", f: "100%", c: "muted" },
              { r: "Round 03", s: "Closed", p: "$98/share", f: "100%", c: "muted" },
              { r: "Round 04", s: "Open", p: "$112/share", f: "68%", c: "accent" },
              { r: "Round 05", s: "Q3 2026", p: "TBD", f: "—", c: "muted" },
            ].map((r) => (
              <div key={r.r} className="glass-card p-5 grid grid-cols-[1fr_auto_auto] items-center gap-4">
                <div>
                  <div className="font-display">{r.r}</div>
                  <div className="font-mono text-[10px] tracking-widest text-muted-foreground mt-1">STATUS · {r.s.toUpperCase()}</div>
                </div>
                <div className="text-right">
                  <div className="font-display silver-text">{r.p}</div>
                  <div className="font-mono text-[10px] text-muted-foreground mt-1">PRICE</div>
                </div>
                <div className="w-16 text-right">
                  <div className={`font-display ${r.c === "accent" ? "text-accent-blue" : "text-muted-foreground"}`}>{r.f}</div>
                  <div className="font-mono text-[10px] text-muted-foreground mt-1">FILLED</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <InvestorCTA
        eyebrow="ROUND 04 — OPEN"
        title="Ready to take an allocation?"
        description="Create an investor profile to verify accreditation, fund your account and confirm SpaceX shares."
      />

      <section className="border-t border-border bg-surface/30 py-12">
        <div className="container-x text-center">
          <Link to="/why-invest" className="btn-ghost">Read the thesis</Link>
        </div>
      </section>
    </SiteShell>
  );
}
