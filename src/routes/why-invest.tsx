import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell, PageHero } from "@/components/site/SiteShell";
import earth from "@/assets/earth-orbit.jpg";

export const Route = createFileRoute("/why-invest")({
  head: () => ({
    meta: [
      { title: "Why Invest in SpaceX — SpaceX IPO Exchange" },
      { name: "description", content: "The full thesis: why SpaceX is the most asymmetric private-market opportunity of the decade." },
      { property: "og:title", content: "Why Invest in SpaceX" },
      { property: "og:description", content: "A complete investment thesis covering valuation, Starlink, Starship and the long arc to Mars." },
    ],
  }),
  component: WhyInvest,
});

const PILLARS = [
  {
    n: "01",
    t: "A monopoly on access to orbit.",
    d: "SpaceX accounts for over 85% of all mass launched to orbit globally. Reusable boosters have created a structural cost advantage rivals cannot close within a decade.",
  },
  {
    n: "02",
    t: "Starlink is a $50B revenue runway.",
    d: "With 5M+ subscribers and growing 100K/month, Starlink alone could justify SpaceX's current valuation — and it's not even at scale yet.",
  },
  {
    n: "03",
    t: "Starship rewrites the unit economics of space.",
    d: "Fully-reusable super-heavy lift will reduce $/kg to orbit by another 100x, opening orbital manufacturing, lunar bases and Mars logistics.",
  },
  {
    n: "04",
    t: "Defense and government tailwinds.",
    d: "Crew Dragon, Cargo Dragon, Starshield and NSSL contracts provide multi-decade, government-backed revenue floors.",
  },
  {
    n: "05",
    t: "Vertical integration moat.",
    d: "From silicon to ground stations to user terminals, SpaceX controls every layer of its stack — a defensibility profile unmatched in aerospace.",
  },
  {
    n: "06",
    t: "Asymmetric IPO upside.",
    d: "Analysts model a $700B–$1.2T valuation at the eventual public listing. Today's pre-IPO entry remains one of the largest known mispricings in private markets.",
  },
];

function WhyInvest() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="THE THESIS"
        title="Six reasons SpaceX is the trade of the decade."
        description="A full breakdown of valuation, monopolies, government revenue and the Mars optionality embedded in every share."
        image={earth}
      />
      <section className="section-y">
        <div className="container-x grid gap-5 md:grid-cols-2">
          {PILLARS.map((p) => (
            <div key={p.n} className="glass-card glass-card-hover p-8">
              <div className="font-mono text-[11px] tracking-[0.3em] text-accent-blue">{p.n}</div>
              <h3 className="mt-3 font-display text-2xl">{p.t}</h3>
              <p className="mt-4 text-muted-foreground leading-relaxed">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface/30 py-20">
        <div className="container-x">
          <h2 className="font-display text-3xl md:text-4xl font-bold max-w-3xl">Valuation trajectory, modeled.</h2>
          <div className="mt-10 grid md:grid-cols-5 gap-3">
            {[
              { y: "2020", v: "$74B" },
              { y: "2022", v: "$127B" },
              { y: "2024", v: "$350B" },
              { y: "2025", v: "$420B" },
              { y: "IPO target", v: "$900B+" },
            ].map((x, i) => (
              <div key={x.y} className="glass-card p-6">
                <div className="font-mono text-[10px] tracking-widest text-muted-foreground">{x.y.toUpperCase()}</div>
                <div className="font-display text-3xl mt-2 silver-text">{x.v}</div>
                <div className="mt-3 h-1 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-accent-blue" style={{ width: `${(i + 1) * 20}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-y text-center">
        <div className="container-x">
          <h2 className="font-display text-3xl md:text-5xl font-bold">Position before the public.</h2>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link to="/spacex" className="btn-primary">View Allocations</Link>
            <Link to="/education" className="btn-ghost">Learn the basics</Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
