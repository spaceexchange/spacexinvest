import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell, PageHero } from "@/components/site/SiteShell";
import rocket from "@/assets/hero-rocket.jpg";
import starlink from "@/assets/starlink-satellites.jpg";
import tesla from "@/assets/tesla-showcase.jpg";
import earth from "@/assets/earth-orbit.jpg";
import astronaut from "@/assets/astronaut.jpg";
import mission from "@/assets/mission-control.jpg";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News Center — SpaceX IPO Exchange" },
      { name: "description", content: "The latest updates from SpaceX, Tesla, Starlink and the wider aerospace economy." },
      { property: "og:title", content: "News Center" },
      { property: "og:description", content: "Curated coverage of SpaceX, Tesla, Starlink and frontier aerospace." },
    ],
  }),
  component: News,
});

const ARTICLES = [
  { c: "Spaceflight", t: "Starship completes 11th orbital flight test, full payload deployment", d: "Today", img: rocket, x: "Heat-shield retention exceeded targets; booster catch nominal." },
  { c: "Starlink", t: "Starlink crosses 5 million subscribers, accelerating ARR runway", d: "2 days ago", img: starlink, x: "Subscriber growth accelerated to ~100K/month in Q2." },
  { c: "Tesla", t: "Tesla unveils next-generation drive unit at Battery Day", d: "4 days ago", img: tesla, x: "Targets 30% cost reduction across powertrain stack." },
  { c: "Markets", t: "SpaceX secondary tender pegs valuation at $420B", d: "1 week ago", img: earth, x: "Up from $350B last round, ahead of consensus modeling." },
  { c: "Spaceflight", t: "NASA awards SpaceX additional Crew Dragon missions through 2030", d: "1 week ago", img: astronaut, x: "Extends sole-provider status for U.S. crewed orbital flight." },
  { c: "Tesla", t: "Cybertruck production hits 1,000 units per week milestone", d: "2 weeks ago", img: tesla, x: "Demand backlog now extends into 2027." },
  { c: "Starlink", t: "Starshield wins classified DoD contract worth $1.2B", d: "3 weeks ago", img: starlink, x: "Defense-grade satellite constellation reaches operational status." },
  { c: "Markets", t: "Mission control: how SpaceX is engineering its IPO", d: "1 month ago", img: mission, x: "An inside look at the structural prep for the public listing." },
];

function News() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="NEWS CENTER"
        title="Signals from the launchpad."
        description="Curated reporting on SpaceX, Tesla, Starlink and the broader aerospace economy."
        image={rocket}
      />

      <section className="border-b border-border bg-surface/40">
        <div className="container-x py-6 flex flex-wrap gap-2">
          {["All", "Spaceflight", "Starlink", "Tesla", "Markets", "Policy"].map((t, i) => (
            <button key={t} className={`px-4 py-2 text-xs font-mono tracking-widest border rounded ${i === 0 ? "border-accent-blue text-accent-blue" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      <section className="section-y">
        <div className="container-x">
          {/* Feature */}
          <Link to="/news" className="block glass-card glass-card-hover overflow-hidden mb-10">
            <div className="grid lg:grid-cols-2">
              <div className="aspect-[16/10] lg:aspect-auto overflow-hidden">
                <img src={ARTICLES[0].img} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <div className="font-mono text-[10px] tracking-widest text-accent-blue">{ARTICLES[0].c.toUpperCase()} · {ARTICLES[0].d.toUpperCase()}</div>
                <h2 className="font-display text-2xl md:text-4xl mt-4 leading-tight">{ARTICLES[0].t}</h2>
                <p className="mt-5 text-muted-foreground">{ARTICLES[0].x}</p>
                <div className="mt-6 font-mono text-xs text-accent-blue tracking-widest">READ TRANSMISSION →</div>
              </div>
            </div>
          </Link>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ARTICLES.slice(1).map((a) => (
              <Link to="/news" key={a.t} className="glass-card glass-card-hover overflow-hidden group">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={a.img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                </div>
                <div className="p-5">
                  <div className="font-mono text-[10px] tracking-widest text-accent-blue">{a.c.toUpperCase()} · {a.d.toUpperCase()}</div>
                  <h3 className="font-display text-lg mt-3 leading-snug">{a.t}</h3>
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{a.x}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
