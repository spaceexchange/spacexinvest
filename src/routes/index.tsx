import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, Rocket, TrendingUp, Shield, Globe2, Zap, Satellite } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { InvestorCTA } from "@/components/site/InvestorCTA";
import heroRocket from "@/assets/hero-rocket.jpg";
import teslaShowcase from "@/assets/tesla-showcase.jpg";
import starlink from "@/assets/starlink-satellites.jpg";
import earthOrbit from "@/assets/earth-orbit.jpg";
import missionControl from "@/assets/mission-control.jpg";
import brandWordmark from "@/assets/spacex-ipo-wordmark-white.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SpaceX IPO Exchange — Invest in the Future of Spaceflight" },
      { name: "description", content: "Buy pre-IPO SpaceX shares, Tesla stock, vehicles and Starlink services on an aerospace-grade investment platform." },
      { property: "og:title", content: "SpaceX IPO Exchange" },
      { property: "og:description", content: "Premier aerospace investment platform for SpaceX, Tesla and Starlink." },
    ],
  }),
  component: Home,
});

function Home() {
  const { t } = useTranslation();

  const metrics = [
    { l: t("home.metrics.valuation"), v: "$420B", d: "+8.2% QoQ" },
    { l: t("home.metrics.investors"), v: "184,392", d: "+1,204 today" },
    { l: t("home.metrics.capital"),   v: "$2.4B",  d: "Round 04" },
    { l: t("home.metrics.avg"),       v: "$24.5K", d: "Last 30d" },
  ];

  const features = [
    { i: Rocket,     t: t("home.features.reusable.t"), d: t("home.features.reusable.d") },
    { i: Satellite,  t: t("home.features.starlink.t"), d: t("home.features.starlink.d") },
    { i: Globe2,     t: t("home.features.starship.t"), d: t("home.features.starship.d") },
    { i: TrendingUp, t: t("home.features.value.t"),    d: t("home.features.value.d") },
    { i: Shield,     t: t("home.features.defense.t"),  d: t("home.features.defense.d") },
    { i: Zap,        t: t("home.features.stack.t"),    d: t("home.features.stack.d") },
  ];

  const faqs = [1, 2, 3, 4].map((n) => ({
    q: t(`home.faq.q${n}`),
    a: t(`home.faq.a${n}`),
  }));

  return (
    <SiteShell>
      {/* HERO */}
      <section className="relative min-h-[100svh] md:min-h-[92vh] flex items-end overflow-hidden border-b border-border">
        <img src={heroRocket} alt="Rocket launch" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1280} />
        <div className="absolute inset-0 hero-overlay" />
        <div className="absolute inset-0 starfield opacity-40 animate-drift" />
        <div className="absolute top-1/4 right-10 w-72 h-72 rounded-full bg-accent-blue/20 blur-3xl animate-pulse-glow hidden md:block" />

        <div className="container-x relative pb-6 md:pb-20 pt-0 md:pt-12 w-full">
          <div className="mb-10 md:mb-16 mt-6 md:mt-0 flex justify-center md:justify-start animate-fade-up">
            <img
              src={brandWordmark}
              alt="SpaceX IPO"
              className="w-[78%] sm:w-[68%] md:w-[58%] lg:w-[50%] max-w-[760px] h-auto select-none pointer-events-none drop-shadow-[0_0_50px_rgba(255,255,255,0.45)]"
              draggable={false}
            />
          </div>
          <h1 className="font-display text-[2rem] sm:text-[3.5rem] md:text-[5rem] lg:text-[7rem] font-bold tracking-tight max-w-5xl leading-[0.95] animate-fade-up text-center md:text-left">
            {t("home.hero.title1")}{" "}
            <span className="silver-text">{t("home.hero.titleAccent")}</span>{" "}
            {t("home.hero.title2")}
          </h1>
          <p className="mt-5 md:mt-12 text-[15px] sm:text-[1.2rem] md:text-[1.35rem] text-muted-foreground max-w-2xl leading-relaxed animate-fade-up text-center md:text-left">
            {t("home.hero.lede")}
          </p>
          <div className="mt-7 md:mt-14 animate-fade-up flex flex-col md:block items-center">
            <InvestorCTA variant="inline" />
            <div className="mt-4 md:mt-5 flex flex-wrap gap-3 justify-center md:justify-start">
              <Link to="/spacex" className="text-[10px] md:text-xs font-mono tracking-[0.2em] text-muted-foreground hover:text-accent-blue uppercase">View SpaceX IPO →</Link>
              <Link to="/tesla-vehicles" className="text-[10px] md:text-xs font-mono tracking-[0.2em] text-muted-foreground hover:text-accent-blue uppercase">Explore Tesla →</Link>
            </div>
          </div>

          {/* live metrics strip */}
          <div className="mt-8 md:mt-16 hidden sm:grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border rounded-md overflow-hidden max-w-4xl">
            {metrics.map((m) => (
              <div key={m.l} className="bg-background/70 backdrop-blur-xl p-4 sm:p-5">
                <div className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">{m.l}</div>
                <div className="mt-2 text-xl sm:text-2xl md:text-3xl font-bold tabular-nums">{m.v}</div>
                <div className="mt-1 text-[11px] text-success font-mono">{m.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY INVEST */}
      <section className="section-y">
        <div className="container-x">
          <div className="max-w-3xl">
            <div className="font-mono text-[11px] tracking-[0.3em] text-accent-blue mb-3">{t("home.s01.kicker")}</div>
            <h2 className="font-display text-3xl md:text-5xl font-bold">{t("home.s01.title")}</h2>
            <p className="mt-5 text-muted-foreground text-base md:text-lg leading-relaxed">{t("home.s01.lede")}</p>
          </div>
          <div className="mt-12 md:mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {features.map((f) => (
              <div key={f.t} className="glass-card glass-card-hover p-6 sm:p-7">
                <f.i className="h-6 w-6 text-accent-blue" />
                <div className="mt-5 text-lg font-semibold">{f.t}</div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-10"><Link to="/why-invest" className="btn-ghost">{t("cta.readThesis")} <ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </section>

      {/* GROWTH STRIP */}
      <section className="relative border-y border-border overflow-hidden">
        <img src={earthOrbit} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" loading="lazy" width={1920} height={1080} />
        <div className="absolute inset-0 bg-background/70" />
        <div className="container-x relative py-16 sm:py-20 md:py-28 grid md:grid-cols-2 gap-10 md:gap-12 items-center">
          <div>
            <div className="font-mono text-[11px] tracking-[0.3em] text-accent-blue mb-3">{t("home.s02.kicker")}</div>
            <h2 className="font-display text-3xl md:text-5xl font-bold">{t("home.s02.title")}</h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">{t("home.s02.lede")}</p>
          </div>
          <div className="glass-panel p-6 sm:p-8 rounded-md">
            {[
              { y: "2018", v: "$30B", w: "7%" },
              { y: "2020", v: "$74B", w: "17%" },
              { y: "2022", v: "$127B", w: "30%" },
              { y: "2024", v: "$350B", w: "83%" },
              { y: "2025", v: "$420B", w: "100%" },
            ].map((r) => (
              <div key={r.y} className="py-3 border-b border-border last:border-0 grid grid-cols-[50px_1fr_80px] sm:grid-cols-[60px_1fr_90px] items-center gap-3 sm:gap-4">
                <div className="font-mono text-xs text-muted-foreground tabular-nums">{r.y}</div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-accent-blue rounded-full" style={{ width: r.w }} />
                </div>
                <div className="text-sm text-right font-semibold tabular-nums">{r.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESLA */}
      <section className="section-y">
        <div className="container-x grid lg:grid-cols-2 gap-10 md:gap-12 items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-border">
            <img src={teslaShowcase} alt="Tesla Model S" className="w-full h-full object-cover" loading="lazy" width={1600} height={1024} />
            <div className="absolute top-4 left-4 font-mono text-[10px] tracking-widest bg-background/80 backdrop-blur px-3 py-1 border border-border">{t("tag.tsla")}</div>
          </div>
          <div>
            <div className="font-mono text-[11px] tracking-[0.3em] text-accent-blue mb-3">{t("home.s03.kicker")}</div>
            <h2 className="font-display text-3xl md:text-5xl font-bold">{t("home.s03.title")}</h2>
            <p className="mt-5 text-muted-foreground text-base md:text-lg leading-relaxed">{t("home.s03.lede")}</p>
            <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4 max-w-md">
              {[
                { l: "TSLA", v: "$392.70", d: "+2.4%" },
                { l: "30d", v: "+18%", d: t("metrics.tslaDelta30") },
                { l: "YTD", v: "+42%", d: t("metrics.tslaYtd") },
              ].map((s) => (
                <div key={s.l} className="glass-card p-3 sm:p-4">
                  <div className="font-mono text-[10px] text-muted-foreground tracking-widest">{s.l}</div>
                  <div className="text-base sm:text-lg font-bold mt-1 tabular-nums">{s.v}</div>
                  <div className="text-[11px] text-success font-mono mt-0.5">{s.d}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex gap-3 flex-wrap">
              <Link to="/tesla-stock" className="btn-primary">{t("cta.tradeTsla")}</Link>
              <Link to="/tesla-vehicles" className="btn-ghost">{t("cta.configureTesla")}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* STARLINK */}
      <section className="relative section-y border-y border-border overflow-hidden">
        <img src={starlink} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" loading="lazy" width={1600} height={1024} />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="container-x relative grid lg:grid-cols-[1.1fr_1fr] gap-10 md:gap-12 items-center">
          <div>
            <div className="font-mono text-[11px] tracking-[0.3em] text-accent-blue mb-3">{t("home.s04.kicker")}</div>
            <h2 className="font-display text-3xl md:text-5xl font-bold">{t("home.s04.title")}</h2>
            <p className="mt-5 text-muted-foreground text-base md:text-lg max-w-xl leading-relaxed">{t("home.s04.lede")}</p>
            <div className="mt-8"><Link to="/starlink" className="btn-primary">{t("cta.exploreStarlink")}</Link></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { l: t("plan.standard.l"), p: "$120/mo", d: t("plan.standard.d") },
              { l: t("plan.roam.l"),     p: "$150/mo", d: t("plan.roam.d") },
              { l: t("plan.maritime.l"), p: "$2K/mo",  d: t("plan.maritime.d") },
              { l: t("plan.aviation.l"), p: t("plan.aviation.price"), d: t("plan.aviation.d") },
            ].map((p) => (
              <div key={p.l} className="glass-card glass-card-hover p-4 sm:p-5">
                <div className="font-mono text-[10px] tracking-widest text-accent-blue uppercase">{p.l}</div>
                <div className="text-xl sm:text-2xl font-bold mt-2 tabular-nums">{p.p}</div>
                <div className="text-xs text-muted-foreground mt-1">{p.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section-y">
        <div className="container-x">
          <div className="font-mono text-[11px] tracking-[0.3em] text-accent-blue mb-3">{t("home.s05.kicker")}</div>
          <h2 className="font-display text-3xl md:text-5xl font-bold max-w-3xl">{t("home.s05.title")}</h2>
          <div className="mt-10 md:mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[
              { q: "The cleanest pre-IPO access vehicle I've used. Everything from KYC to settlement is institutional grade.", n: "A. Patel", r: "Family Office, Singapore" },
              { q: "Owning SpaceX, Tesla and Starlink under one roof simplified my entire frontier-tech sleeve.", n: "M. Okafor", r: "Venture Partner, London" },
              { q: "The dashboard is the most beautiful piece of finance software I've ever logged into.", n: "S. Chen", r: "Angel Investor, SF" },
            ].map((tm) => (
              <div key={tm.n} className="glass-card p-6 sm:p-7">
                <div className="text-2xl text-accent-blue mb-3">"</div>
                <p className="text-sm leading-relaxed text-foreground/90">{tm.q}</p>
                <div className="mt-6 pt-5 border-t border-border">
                  <div className="text-sm font-semibold">{tm.n}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-1">{tm.r}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWS PREVIEW */}
      <section className="border-y border-border bg-surface/30">
        <div className="container-x py-16 sm:py-20">
          <div className="flex items-end justify-between mb-8 sm:mb-10 gap-4 flex-wrap">
            <div>
              <div className="font-mono text-[11px] tracking-[0.3em] text-accent-blue mb-3">{t("home.s06.kicker")}</div>
              <h2 className="font-display text-3xl md:text-4xl font-bold">{t("home.s06.title")}</h2>
            </div>
            <Link to="/news" className="btn-ghost">{t("cta.allNews")} <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[
              { t: "Starship completes 11th orbital test, payload deployed flawlessly", c: "Spaceflight", d: "2 days ago", img: heroRocket },
              { t: "Starlink crosses 5M subscribers, accelerating revenue runway", c: "Starlink", d: "5 days ago", img: starlink },
              { t: "Tesla unveils next-gen drive unit; energy storage hits record quarter", c: "Tesla", d: "1 week ago", img: teslaShowcase },
            ].map((n) => (
              <Link to="/news" key={n.t} className="glass-card glass-card-hover overflow-hidden group">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={n.img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                </div>
                <div className="p-5">
                  <div className="font-mono text-[10px] tracking-widest text-accent-blue uppercase">{n.c} · {n.d}</div>
                  <h3 className="text-base sm:text-lg font-semibold mt-3 leading-snug">{n.t}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ TEASER */}
      <section className="section-y">
        <div className="container-x grid lg:grid-cols-[1fr_1.2fr] gap-10 md:gap-12">
          <div>
            <div className="font-mono text-[11px] tracking-[0.3em] text-accent-blue mb-3">{t("home.s07.kicker")}</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold">{t("home.s07.title")}</h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">{t("home.s07.lede")}</p>
            <div className="mt-8"><Link to="/faq" className="btn-ghost">{t("cta.browseFaq")}</Link></div>
          </div>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="glass-card p-5 group">
                <summary className="cursor-pointer font-medium flex items-center justify-between list-none gap-4">
                  <span className="min-w-0">{f.q}</span>
                  <span className="text-accent-blue text-xl shrink-0 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-border overflow-hidden">
        <img src={missionControl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background" />
        <div className="container-x relative py-20 sm:py-24 text-center">
          <h2 className="font-display text-3xl sm:text-4xl md:text-6xl font-bold max-w-3xl mx-auto">{t("home.cta.title")}</h2>
          <p className="mt-5 text-muted-foreground max-w-xl mx-auto leading-relaxed">{t("home.cta.lede")}</p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <InvestorCTA variant="inline" />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
