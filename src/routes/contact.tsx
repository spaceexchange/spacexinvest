import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell, PageHero } from "@/components/site/SiteShell";
import { Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — SpaceX IPO Exchange" },
      { name: "description", content: "Speak with our investor relations team. We respond within one business hour." },
      { property: "og:title", content: "Contact" },
      { property: "og:description", content: "Reach our investor relations team — response within one business hour." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <SiteShell>
      <PageHero eyebrow="CONTACT" title="Mission control is listening." description="Whether you're allocating $5K or $50M, we'll meet you with the same standard of care." />
      <section className="section-y">
        <div className="container-x grid lg:grid-cols-[1fr_1.4fr] gap-12">
          <div className="space-y-6">
            {[
              { i: Mail, l: "Email", v: "spacexipoexchange@gmail.com" },
              { i: Phone, l: "WhatsApp", v: 
              <a
                href="https://wa.me/19714284965"
                target="_blank"
                rel="noopener noreferrer"
               >
                Chat on WhatsApp
              </a> },
              { i: MapPin, l: "Headquarters", v: "Hawthorne, California" },
            ].map((c) => (
              <div key={c.l} className="glass-card p-6 flex items-start gap-4">
                <c.i className="h-5 w-5 text-accent-blue mt-1" />
                <div>
                  <div className="font-mono text-[10px] tracking-widest text-muted-foreground">{c.l.toUpperCase()}</div>
                  <div className="font-display text-lg mt-1">{c.v}</div>
                </div>
              </div>
            ))}
            <div className="glass-panel rounded-md p-6">
              <div className="font-mono text-[10px] tracking-widest text-accent-blue">RESPONSE TIME</div>
              <div className="font-display text-3xl mt-2 silver-text">&lt; 1 hour</div>
              <div className="text-sm text-muted-foreground mt-2">During business hours (M–F, 7am–7pm PT)</div>
            </div>
          </div>

          <form
            className="glass-card p-8"
            onSubmit={(e) => { e.preventDefault(); setSent(true); }}
          >
            {sent ? (
              <div className="text-center py-12">
                <div className="font-mono text-[10px] tracking-widest text-accent-blue">TRANSMISSION RECEIVED</div>
                <h3 className="font-display text-3xl mt-3">Thank you.</h3>
                <p className="text-muted-foreground mt-3">An advisor will be in touch shortly.</p>
              </div>
            ) : (
              <>
                <h3 className="font-display text-2xl mb-6">Send a transmission</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { l: "Full Name", t: "text", p: "Elon Musk" },
                    { l: "Email", t: "email", p: "you@email.com" },
                  ].map((f) => (
                    <div key={f.l}>
                      <label className="font-mono text-[10px] tracking-widest text-muted-foreground">{f.l.toUpperCase()}</label>
                      <input required type={f.t} placeholder={f.p} className="mt-2 w-full bg-secondary/40 border border-border rounded px-4 py-3 text-sm outline-none focus:border-accent-blue transition-colors" />
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <label className="font-mono text-[10px] tracking-widest text-muted-foreground">INTEREST</label>
                  <select className="mt-2 w-full bg-secondary/40 border border-border rounded px-4 py-3 text-sm outline-none focus:border-accent-blue transition-colors">
                    <option>SpaceX IPO Allocation</option>
                    <option>Tesla Stock</option>
                    <option>Tesla Vehicle</option>
                    <option>Starlink Service</option>
                    <option>General Inquiry</option>
                  </select>
                </div>
                <div className="mt-4">
                  <label className="font-mono text-[10px] tracking-widest text-muted-foreground">MESSAGE</label>
                  <textarea required rows={5} placeholder="Tell us about your goals..." className="mt-2 w-full bg-secondary/40 border border-border rounded px-4 py-3 text-sm outline-none focus:border-accent-blue transition-colors resize-none" />
                </div>
                <button type="submit" className="btn-primary mt-6 w-full">Launch Transmission</button>
              </>
            )}
          </form>
        </div>
      </section>
    </SiteShell>
  );
}
