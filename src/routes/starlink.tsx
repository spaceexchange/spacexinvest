import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell, PageHero } from "@/components/site/SiteShell";
import { InvestorCTA } from "@/components/site/InvestorCTA";
import starlink from "@/assets/starlink-satellites.jpg";

export const Route = createFileRoute("/starlink")({
  head: () => ({
    meta: [
      { title: "Starlink Marketplace — SpaceX IPO Exchange" },
      { name: "description", content: "Purchase Starlink hardware, manage subscriptions and check global coverage." },
      { property: "og:title", content: "Starlink Marketplace" },
      { property: "og:description", content: "Hardware, subscriptions and coverage for Starlink — managed alongside your portfolio." },
      { property: "og:image", content: starlink },
    ],
  }),
  component: Starlink,
});

const PLANS = [
  { n: "Standard", p: "$120/mo", h: "$349 kit", d: "Residential broadband, 50–250 Mbps download." },
  { n: "Roam", p: "$150/mo", h: "$599 kit", d: "Take Starlink anywhere with mobile portability." },
  { n: "Priority", p: "$500/mo", h: "$2,500 kit", d: "Business-grade with network prioritization." },
  { n: "Maritime", p: "$2,000/mo", h: "$10,000 kit", d: "Open-ocean coverage for vessels of any size." },
  { n: "Aviation", p: "Custom", h: "Custom", d: "In-flight gigabit for business and commercial aviation." },
  { n: "Mobile Priority", p: "Custom", h: "Custom", d: "First-responder and emergency response-grade." },
];

function Starlink() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="STARLINK MARKETPLACE"
        title="High-speed internet, anywhere on Earth."
        description="A 7,000+ satellite constellation delivering low-latency broadband to over 100 countries — including yours."
        image={starlink}
      />

      <section className="section-y">
        <div className="container-x">
          <div className="grid md:grid-cols-3 gap-5 mb-12">
            {[
              { l: "Satellites in Orbit", v: "7,012" },
              { l: "Countries Served", v: "104" },
              { l: "Active Subscribers", v: "5.2M" },
            ].map((m) => (
              <div key={m.l} className="glass-card p-6">
                <div className="font-mono text-[10px] tracking-widest text-accent-blue">{m.l.toUpperCase()}</div>
                <div className="font-display text-4xl silver-text mt-2">{m.v}</div>
              </div>
            ))}
          </div>

          <h2 className="font-display text-3xl md:text-4xl font-bold">Plans for every mission.</h2>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PLANS.map((p) => (
              <div key={p.n} className="glass-card glass-card-hover p-6 flex flex-col">
                <div className="font-mono text-[10px] tracking-widest text-accent-blue">{p.n.toUpperCase()}</div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-3xl silver-text">{p.p}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-mono">HARDWARE · {p.h.toUpperCase()}</div>
                <p className="mt-4 text-sm text-muted-foreground flex-1">{p.d}</p>
                <Link to="/contact" className="btn-ghost mt-6 w-full !text-xs">Select Plan</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface/30 py-20">
        <div className="container-x grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Coverage in your region.</h2>
            <p className="mt-4 text-muted-foreground">Starlink is live across North America, Europe, Oceania, most of South America, Africa and Asia. Service areas expand monthly.</p>
            <Link to="/contact" className="btn-primary mt-6">Check my address</Link>
          </div>
          <div className="aspect-[4/3] glass-panel rounded-md relative overflow-hidden">
            <div className="absolute inset-0 starfield opacity-50" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 rounded-full border border-accent-blue/40 animate-pulse-glow" />
              <div className="absolute w-32 h-32 rounded-full border border-accent-blue/60" />
              <div className="absolute w-16 h-16 rounded-full bg-accent-blue/20 blur-2xl" />
            </div>
            <div className="absolute bottom-4 left-4 font-mono text-[10px] tracking-widest text-muted-foreground">COVERAGE · LIVE</div>
          </div>
        </div>
      </section>

      <InvestorCTA
        eyebrow="BUNDLE & SAVE"
        title="Manage Starlink from your investor account"
        description="Subscribe to Starlink and settle payments through your SpaceX IPO Exchange account — one login, one statement."
      />
    </SiteShell>
  );
}
