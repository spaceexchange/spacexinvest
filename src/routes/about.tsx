import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell, PageHero } from "@/components/site/SiteShell";
import missionControl from "@/assets/mission-control.jpg";
import astronaut from "@/assets/astronaut.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — SpaceX IPO Exchange" },
      { name: "description", content: "The team building institutional-grade access to the SpaceX ecosystem." },
      { property: "og:title", content: "About — SpaceX IPO Exchange" },
      { property: "og:description", content: "Aerospace-grade investment infrastructure for SpaceX, Tesla and Starlink." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="ABOUT US"
        title="Built by operators. Trusted by capital."
        description="SpaceX IPO Exchange is a private-market investment platform purpose-built for the aerospace economy."
        image={missionControl}
      />
      <section className="section-y">
        <div className="container-x grid lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-5 text-muted-foreground leading-relaxed">
            <p className="text-foreground text-xl font-display">Our mission is to give every accredited investor a seat at the most transformative private company of our generation.</p>
            <p>Founded in 2022 by a team of fintech veterans, former NASA engineers and ex-Goldman bankers, SpaceX IPO Exchange exists to remove the friction between accredited capital and frontier aerospace assets.</p>
            <p>We operate as a regulated SPV originator, sourcing allocations through verified secondary channels and structuring them under qualified custody. Every share, every vehicle reservation and every Starlink subscription routed through our platform is settled with institutional rigor.</p>
            <p>Beyond SpaceX, we extend the same standard of access to Tesla equity, Tesla vehicle commerce and Starlink connectivity — building a single, vertically integrated cockpit for the multi-planetary economy.</p>
          </div>
          <div className="space-y-4">
            <img src={astronaut} alt="" className="w-full rounded-md border border-border" loading="lazy" />
            <div className="grid grid-cols-3 gap-3">
              {[
                { v: "184K+", l: "Investors" },
                { v: "$2.4B", l: "Deployed" },
                { v: "12", l: "Jurisdictions" },
              ].map((s) => (
                <div key={s.l} className="glass-card p-4 text-center">
                  <div className="font-display text-2xl silver-text">{s.v}</div>
                  <div className="font-mono text-[10px] text-muted-foreground tracking-widest mt-1">{s.l.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface/30 py-20">
        <div className="container-x">
          <div className="font-mono text-[11px] tracking-[0.3em] text-accent-blue mb-3">LEADERSHIP</div>
          <h2 className="font-display text-3xl md:text-4xl font-bold">A team forged at the intersection of aerospace and capital markets.</h2>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { n: "Dr. Helena Voss", r: "Chief Executive", b: "Ex-JPM Private Capital. PhD Aerospace, MIT." },
              { n: "Marcus Adeyemi", r: "Chief Technology", b: "Ex-Stripe Infrastructure. Former NASA JPL." },
              { n: "Yuki Tanaka", r: "Chief Compliance", b: "Ex-SEC enforcement. 20 years securities law." },
              { n: "Rafael Ortiz", r: "Head of Investments", b: "Ex-Sequoia growth. Tesla & Starlink early backer." },
            ].map((p) => (
              <div key={p.n} className="glass-card glass-card-hover p-6">
                <div className="aspect-square rounded-sm bg-gradient-to-br from-secondary to-surface-elevated mb-4 flex items-center justify-center font-display text-3xl silver-text">
                  {p.n.split(" ").map(x => x[0]).slice(0,2).join("")}
                </div>
                <div className="font-display text-lg">{p.n}</div>
                <div className="font-mono text-[10px] tracking-widest text-accent-blue mt-1">{p.r.toUpperCase()}</div>
                <p className="mt-3 text-sm text-muted-foreground">{p.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-y">
        <div className="container-x text-center">
          <h2 className="font-display text-3xl md:text-5xl font-bold">Become part of the mission.</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Whether you're allocating capital or building careers, there's a seat for you.</p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link to="/spacex" className="btn-primary">View Allocations</Link>
            <Link to="/contact" className="btn-ghost">Get in touch</Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
