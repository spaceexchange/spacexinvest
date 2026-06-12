import { createFileRoute } from "@tanstack/react-router";
import { SiteShell, PageHero } from "@/components/site/SiteShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — SpaceX IPO Exchange" },
      { name: "description", content: "How SpaceX IPO Exchange collects, uses and protects your data." },
      { property: "og:title", content: "Privacy Policy" },
      { property: "og:description", content: "How we collect, use and protect your data." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <SiteShell>
      <PageHero eyebrow="LEGAL" title="Privacy Policy" description="Last updated June 10, 2026." />
      <section className="section-y">
        <article className="container-x max-w-3xl space-y-8 text-muted-foreground leading-relaxed">
          {[
            { t: "1. Information We Collect", b: "Account details (name, email, phone), verification documents (passport, proof of address), financial information for accreditation, transaction history, and device/usage data." },
            { t: "2. How We Use Information", b: "To operate the Platform, verify identity, process transactions, deliver investment products and services, comply with legal obligations, prevent fraud, and improve our offering." },
            { t: "3. Data Sharing", b: "We share data only with qualified custodians, KYC providers, regulators (where legally required), and trusted infrastructure vendors under strict data-protection agreements. We do not sell personal data." },
            { t: "4. Data Security", b: "End-to-end 256-bit TLS, SOC 2 Type II certified infrastructure, encrypted storage at rest, role-based access controls, and continuous penetration testing." },
            { t: "5. Cookies", b: "We use essential cookies for authentication, and limited analytics cookies to improve the Platform. You may control non-essential cookies via your browser settings." },
            { t: "6. Your Rights", b: "Depending on your jurisdiction, you may have rights to access, correct, delete, or export your personal data, and to object to certain processing. Contact privacy@spacexipoexchange.com to exercise rights." },
            { t: "7. International Transfers", b: "Data may be processed in the United States and other jurisdictions where we operate. Transfers are subject to standard contractual clauses where required." },
            { t: "8. Retention", b: "We retain account and transaction data for the period required by applicable securities and anti-money-laundering regulations." },
            { t: "9. Updates", b: "Material updates will be notified via email. Continued use of the Platform constitutes acceptance of the revised policy." },
            { t: "10. Contact", b: "Privacy questions may be directed to privacy@spacexipoexchange.com." },
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
