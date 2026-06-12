import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell, PageHero } from "@/components/site/SiteShell";
import { BookOpen, GraduationCap, LineChart, ShieldCheck } from "lucide-react";
import mission from "@/assets/mission-control.jpg";

export const Route = createFileRoute("/education")({
  head: () => ({
    meta: [
      { title: "Investor Education — SpaceX IPO Exchange" },
      { name: "description", content: "Guides, courses and primers on pre-IPO investing, aerospace markets and Tesla equity." },
      { property: "og:title", content: "Investor Education" },
      { property: "og:description", content: "Master pre-IPO investing, valuation, custody and aerospace fundamentals." },
    ],
  }),
  component: Education,
});

function Education() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="EDUCATION CENTER"
        title="Become a sharper investor in 60 minutes."
        description="Free courses, primers and deep dives — covering everything from accreditation rules to Starship economics."
        image={mission}
      />
      <section className="section-y">
        <div className="container-x grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { i: GraduationCap, t: "Pre-IPO 101", d: "How private secondary markets work and what 'accredited' actually means.", l: "9 lessons" },
            { i: LineChart, t: "Valuation Basics", d: "DCFs, comparables and how SpaceX is priced at $420B today.", l: "7 lessons" },
            { i: ShieldCheck, t: "Custody & Compliance", d: "SPVs, qualified custodians, KYC, AML — everything you need to know.", l: "6 lessons" },
            { i: BookOpen, t: "Aerospace Glossary", d: "120+ terms decoded, from delta-v to NSSL contracts.", l: "Reference" },
          ].map((c) => (
            <div key={c.t} className="glass-card glass-card-hover p-6">
              <c.i className="h-6 w-6 text-accent-blue" />
              <div className="font-display text-xl mt-5">{c.t}</div>
              <p className="text-sm text-muted-foreground mt-2">{c.d}</p>
              <div className="font-mono text-[10px] tracking-widest text-muted-foreground mt-5">{c.l.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface/30 py-20">
        <div className="container-x">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-10">Featured guides.</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { t: "The complete pre-IPO investor playbook", r: "12 min read" },
              { t: "Why Starlink could be SpaceX's most valuable segment", r: "9 min read" },
              { t: "Decoding the Starship cargo manifest", r: "7 min read" },
              { t: "How to size a SpaceX position in your portfolio", r: "10 min read" },
            ].map((g) => (
              <Link to="/education" key={g.t} className="glass-card glass-card-hover p-6 flex items-center justify-between gap-4">
                <div>
                  <div className="font-display text-lg">{g.t}</div>
                  <div className="font-mono text-[10px] tracking-widest text-muted-foreground mt-2">{g.r.toUpperCase()}</div>
                </div>
                <div className="text-accent-blue text-2xl">→</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
