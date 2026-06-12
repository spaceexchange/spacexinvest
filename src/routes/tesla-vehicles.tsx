import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell, PageHero } from "@/components/site/SiteShell";
import showcase from "@/assets/tesla-showcase.jpg";
import cyber from "@/assets/tesla-cybertruck.jpg";

export const Route = createFileRoute("/tesla-vehicles")({
  head: () => ({
    meta: [
      { title: "Tesla Vehicles — SpaceX IPO Exchange" },
      { name: "description", content: "Browse, configure and reserve Tesla Model S, 3, X, Y, Cybertruck and Roadster." },
      { property: "og:title", content: "Tesla Vehicle Marketplace" },
      { property: "og:description", content: "Configure and reserve every Tesla model — settled through your investment account." },
      { property: "og:image", content: showcase },
    ],
  }),
  component: TeslaVehicles,
});

const FLEET = [
  { n: "Model S", p: "From $79,990", r: "0–60 in 1.99s · 396 mi range", img: showcase },
  { n: "Model 3", p: "From $38,990", r: "0–60 in 2.9s · 358 mi range", img: showcase },
  { n: "Model X", p: "From $84,990", r: "Falcon wing · 348 mi range", img: showcase },
  { n: "Model Y", p: "From $44,990", r: "Best-selling EV · 330 mi range", img: showcase },
  { n: "Cybertruck", p: "From $79,990", r: "Bulletproof · 340 mi range", img: cyber },
  { n: "Roadster", p: "From $200,000", r: "1.1s 0–60 · 620 mi range", img: cyber },
];

function TeslaVehicles() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="VEHICLE MARKETPLACE"
        title="The Tesla fleet. Configured your way."
        description="Six models. Infinite configurations. Reserve, configure and track delivery — all from your investment account."
        image={cyber}
      />

      <section className="section-y">
        <div className="container-x grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FLEET.map((v) => (
            <div key={v.n} className="glass-card glass-card-hover overflow-hidden group">
              <div className="aspect-[4/3] overflow-hidden bg-secondary">
                <img src={v.img} alt={v.n} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
              </div>
              <div className="p-6">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-2xl">{v.n}</h3>
                  <div className="font-mono text-[10px] tracking-widest text-accent-blue">RESERVE</div>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{v.r}</div>
                <div className="mt-5 flex items-end justify-between">
                  <div>
                    <div className="font-mono text-[10px] tracking-widest text-muted-foreground">STARTING AT</div>
                    <div className="font-display text-lg silver-text mt-1">{v.p}</div>
                  </div>
                  <Link to="/contact" className="btn-ghost !py-2 !px-3 !text-[11px]">Configure</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface/30 py-20">
        <div className="container-x grid md:grid-cols-4 gap-5">
          {[
            { t: "Configurator", d: "Color, wheels, interior and performance package — preview live." },
            { t: "Financing", d: "Calculate monthly payments or settle via your SpaceX IPO balance." },
            { t: "Reservation", d: "Place a refundable reservation and lock pricing." },
            { t: "Delivery", d: "Track production, transit and final handover." },
          ].map((s) => (
            <div key={s.t} className="glass-card p-6">
              <div className="font-mono text-[10px] tracking-widest text-accent-blue">STEP</div>
              <div className="font-display text-lg mt-2">{s.t}</div>
              <p className="text-sm text-muted-foreground mt-2">{s.d}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
