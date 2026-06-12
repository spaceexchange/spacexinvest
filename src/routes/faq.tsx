import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell, PageHero } from "@/components/site/SiteShell";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — SpaceX IPO Exchange" },
      { name: "description", content: "Answers to common questions about SpaceX pre-IPO allocations, Tesla, Starlink, KYC and payments." },
      { property: "og:title", content: "FAQ" },
      { property: "og:description", content: "Allocations, KYC, payments, custody and more — answered." },
    ],
  }),
  component: FAQ,
});

const SECTIONS = [
  {
    s: "Investing in SpaceX",
    items: [
      { q: "Who is eligible to invest?", a: "Currently accredited investors globally, defined per the regulatory framework of your jurisdiction. Institutional structures are available on request." },
      { q: "What is the minimum allocation?", a: "Standard minimum is $10,000. Select pilot rounds occasionally open at $5,000 for verified members." },
      { q: "How are shares structured?", a: "Through SPV (Special Purpose Vehicle) structures, with the SPV holding direct SpaceX equity custodied with a qualified custodian." },
      { q: "When can I exit?", a: "At the eventual IPO, via secondary tender offers between rounds, or by transferring SPV interests subject to approval." },
    ],
  },
  {
    s: "Payments & Funding",
    items: [
      { q: "What payment methods are supported?", a: "Bank transfer (USD, EUR, GBP) and supported cryptocurrencies including BTC, ETH, USDT (TRC20/ERC20), USDC and SOL." },
      { q: "How long does funding take?", a: "Crypto deposits typically clear in under 60 minutes. Bank wires settle within 1–3 business days." },
      { q: "Are there any fees?", a: "Allocation fees are disclosed in your subscription documents. We do not charge custody, withdrawal or account fees." },
    ],
  },
  {
    s: "Security & Compliance",
    items: [
      { q: "How is my data secured?", a: "End-to-end 256-bit TLS, SOC 2 Type II infrastructure, and segregated client funds at qualified institutions." },
      { q: "Do you support 2FA?", a: "Yes — TOTP and hardware key (FIDO2/WebAuthn) authentication are supported on all accounts." },
      { q: "Where is the company regulated?", a: "Multi-jurisdictional with primary registrations in the United States, EU and UK." },
    ],
  },
  {
    s: "Tesla, Vehicles & Starlink",
    items: [
      { q: "Can I buy a Tesla through the platform?", a: "Yes — reserve, configure and pay for Tesla vehicles directly from your funded account." },
      { q: "Does Starlink ship to my country?", a: "Starlink serves 100+ countries. Check coverage on the Starlink Marketplace page or contact us." },
    ],
  },
];

function FAQ() {
  return (
    <SiteShell>
      <PageHero eyebrow="SUPPORT" title="Frequently asked questions." description="If you can't find your answer, our team responds within one business hour." />
      <section className="section-y">
        <div className="container-x space-y-12 max-w-4xl">
          {SECTIONS.map((sec) => (
            <div key={sec.s}>
              <div className="font-mono text-[11px] tracking-[0.3em] text-accent-blue mb-4">{sec.s.toUpperCase()}</div>
              <div className="space-y-3">
                {sec.items.map((f) => (
                  <details key={f.q} className="glass-card p-5 group">
                    <summary className="cursor-pointer font-medium flex items-center justify-between gap-4 list-none">
                      <span>{f.q}</span>
                      <span className="text-accent-blue text-xl group-open:rotate-45 transition-transform">+</span>
                    </summary>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
          <div className="glass-panel p-8 rounded-md text-center">
            <h3 className="font-display text-2xl">Still have questions?</h3>
            <p className="text-muted-foreground mt-2">Our investor relations team is standing by.</p>
            <Link to="/contact" className="btn-primary mt-6 inline-flex">Contact Us</Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
