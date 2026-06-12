import { createFileRoute } from "@tanstack/react-router";
import { SiteShell, PageHero } from "@/components/site/SiteShell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — SpaceX IPO Exchange" },
      { name: "description", content: "Terms governing use of the SpaceX IPO Exchange platform." },
      { property: "og:title", content: "Terms of Service" },
      { property: "og:description", content: "The terms governing use of SpaceX IPO Exchange." },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <SiteShell>
      <PageHero eyebrow="LEGAL" title="Terms of Service" description="Last updated June 10, 2026." />
      <section className="section-y">
        <article className="container-x max-w-3xl prose prose-invert space-y-8 text-muted-foreground leading-relaxed">
          {[
            { t: "1. Acceptance of Terms", b: "By accessing SpaceX IPO Exchange (the 'Platform'), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform." },
            { t: "2. Eligibility", b: "Access to investment products is restricted to accredited investors as defined by applicable securities laws in your jurisdiction. You represent and warrant that you meet such criteria." },
            { t: "3. Securities & Risk Disclosure", b: "Pre-IPO securities are illiquid, speculative, and may lose value entirely. Past performance does not indicate future results. All allocations are subject to subscription documents that supersede marketing materials." },
            { t: "4. Custody & Settlement", b: "Funds and securities held through the Platform are custodied with qualified third-party institutions. The Platform does not act as a custodian directly." },
            { t: "5. User Conduct", b: "You agree not to misuse the Platform, attempt unauthorized access, or upload misleading verification documents. Violations may result in account termination and legal action." },
            { t: "6. Intellectual Property", b: "All content, branding, code, and design on the Platform are the exclusive property of SpaceX IPO Exchange or its licensors. No license is granted except as expressly stated." },
            { t: "7. Limitation of Liability", b: "To the maximum extent permitted by law, the Platform and its affiliates are not liable for indirect, incidental, consequential or punitive damages." },
            { t: "8. Governing Law", b: "These Terms are governed by the laws of the State of Delaware, USA, without regard to conflict of laws principles." },
            { t: "9. Changes", b: "We may update these Terms at any time. Material changes will be notified via email or in-app notification. Continued use constitutes acceptance." },
            { t: "10. Contact", b: "Questions about these Terms may be sent to legal@spacexipoexchange.com." },
          ].map((s) => (
            <div key={s.t}>
              <h2 className="font-display text-2xl text-foreground mb-3">{s.t}</h2>
              <p>{s.b}</p>
            </div>
          ))}
        </article>
      </section>
    </SiteShell>
  );
}
