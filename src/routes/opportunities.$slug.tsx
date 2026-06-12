import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getOpportunityBySlugOrId, getOpportunityDocuments, getOppMediaSignedUrl } from "@/lib/opportunities";
import { useRealtimeChannel } from "@/lib/data/portal";
import { supabase } from "@/integrations/supabase/client";
import { InvestModal } from "@/components/investor/InvestModal";
import { Download, ArrowLeft, TrendingUp } from "lucide-react";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export const Route = createFileRoute("/opportunities/$slug")({
  ssr: false,
  component: OppDetails,
  notFoundComponent: () => <div className="min-h-screen grid place-items-center text-muted-foreground">Opportunity not found.</div>,
});

function OppDetails() {
  const { slug } = Route.useParams();
  const [opp, setOpp] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [cover, setCover] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [investOpen, setInvestOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user)); }, []);

  const reload = async () => {
    const o = await getOpportunityBySlugOrId(slug);
    setOpp(o); setLoading(false);
    if (o) {
      setDocs(await getOpportunityDocuments(o.id));
      if (o.cover_image) setCover(await getOppMediaSignedUrl(o.cover_image));
    }
  };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [slug]);
  useRealtimeChannel(`opp-${slug}`, [{ table: "investment_opportunities" }, { table: "investments" }], reload);

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  if (!opp) throw notFound();

  const pct = Number(opp.target_amount) > 0 ? (Number(opp.raised_amount) / Number(opp.target_amount)) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <Link to="/opportunities" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-3.5 w-3.5" /> All opportunities</Link>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="aspect-[16/9] bg-secondary rounded-xl overflow-hidden mb-5">
              {cover ? <img src={cover} alt={opp.title} className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-muted-foreground text-xs font-mono">NO IMAGE</div>}
            </div>
            <div className="text-[10px] font-mono tracking-[0.3em] text-accent-blue mb-2">{opp.industry ?? opp.category} · {opp.investment_type}</div>
            <h1 className="text-3xl sm:text-4xl font-semibold mb-3">{opp.title}</h1>
            <p className="text-muted-foreground">{opp.short_description}</p>
          </div>

          <aside className="glass-card rounded-xl p-5 self-start">
            <div className="mb-4">
              <div className="text-[10px] font-mono tracking-[0.25em] text-muted-foreground uppercase mb-2">Investment Progress</div>
              <div className="h-2.5 rounded-full bg-secondary overflow-hidden mb-2"><div className="h-full bg-accent-blue" style={{ width: `${Math.min(100, pct)}%` }} /></div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-foreground">{fmt(Number(opp.raised_amount))}</span>
                <span className="text-muted-foreground">{fmt(Number(opp.target_amount))}</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">{pct.toFixed(1)}% funded · {opp.investor_count ?? 0} investors</div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-5">
              <Item label="Min investment" value={fmt(Number(opp.minimum_investment))} />
              {opp.maximum_investment && <Item label="Max investment" value={fmt(Number(opp.maximum_investment))} />}
              <Item label="Share price" value={fmt(Number(opp.price_per_share))} />
              <Item label="Expected ROI" value={opp.expected_roi ? `${opp.expected_roi}%` : "—"} />
              <Item label="Risk level" value={opp.risk_level ?? "—"} />
              <Item label="Status" value={opp.status.replace(/_/g," ")} />
            </div>
            {signedIn ? (
              <button onClick={() => setInvestOpen(true)} className="block w-full text-center py-2.5 rounded-md bg-accent-blue text-white font-medium hover:bg-accent-blue/90 transition-colors">
                <TrendingUp className="h-4 w-4 inline mr-1" /> Invest now
              </button>
            ) : (
              <Link to="/auth/login" className="block w-full text-center py-2.5 rounded-md bg-accent-blue text-white font-medium hover:bg-accent-blue/90 transition-colors">
                <TrendingUp className="h-4 w-4 inline mr-1" /> Sign in to invest
              </Link>
            )}
            <InvestModal open={investOpen} onClose={() => setInvestOpen(false)} opportunity={opp} onSuccess={reload} />
            <div className="text-[10px] text-muted-foreground text-center mt-2 font-mono">Sign in required</div>
          </aside>
        </div>

        <Section title="Overview"><div className="text-sm text-foreground/85 whitespace-pre-wrap">{opp.full_description ?? opp.description ?? "No detailed description provided."}</div></Section>

        {Array.isArray(opp.highlights) && opp.highlights.length > 0 && (
          <Section title="Highlights">
            <ul className="grid sm:grid-cols-2 gap-2">
              {opp.highlights.map((h: string, i: number) => <li key={i} className="text-sm text-foreground/85 flex gap-2"><span className="text-accent-blue">▸</span>{h}</li>)}
            </ul>
          </Section>
        )}

        <Section title="Financials">
          <div className="grid sm:grid-cols-4 gap-3 text-sm">
            <Item label="Target raise" value={fmt(Number(opp.target_amount))} />
            <Item label="Raised so far" value={fmt(Number(opp.raised_amount))} />
            <Item label="Shares available" value={Number(opp.available_shares).toLocaleString()} />
            <Item label="Currency" value={opp.currency ?? "USD"} />
          </div>
        </Section>

        <Section title={`Documents (${docs.length})`}>
          {docs.length === 0 && <div className="text-sm text-muted-foreground">No documents attached.</div>}
          <div className="space-y-2">
            {docs.map((d) => (
              <a key={d.id} href={`#`} onClick={async (e) => { e.preventDefault(); const url = await getOppMediaSignedUrl(d.file_url, "opportunity-documents"); if (url) window.open(url, "_blank"); }} className="flex items-center justify-between glass-card rounded-md p-3 hover:border-accent-blue/40 transition-colors">
                <div>
                  <div className="text-sm">{d.document_name}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">{d.document_type} · {((d.size_bytes ?? 0) / 1024).toFixed(0)} KB</div>
                </div>
                <Download className="h-4 w-4 text-accent-blue" />
              </a>
            ))}
          </div>
        </Section>

        <Section title="Timeline">
          <div className="text-sm space-y-2">
            <TimelineItem label="Created" date={opp.created_at} />
            {opp.published_at && <TimelineItem label="Published" date={opp.published_at} />}
            {opp.start_date && <TimelineItem label="Open date" date={opp.start_date} />}
            {opp.end_date && <TimelineItem label="Close date" date={opp.end_date} />}
          </div>
        </Section>

        {Array.isArray(opp.faq) && opp.faq.length > 0 && (
          <Section title="FAQ">
            <div className="space-y-3">
              {opp.faq.map((f: any, i: number) => (
                <div key={i} className="glass-card rounded-md p-4">
                  <div className="font-medium text-sm mb-1">{f.q}</div>
                  <div className="text-sm text-muted-foreground">{f.a}</div>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: any) {
  return <section className="mb-8"><h2 className="text-lg font-semibold mb-3">{title}</h2>{children}</section>;
}
function Item({ label, value }: any) {
  return <div><div className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase">{label}</div><div className="font-medium mt-0.5">{value}</div></div>;
}
function TimelineItem({ label, date }: any) {
  return <div className="flex items-center gap-3"><div className="h-2 w-2 rounded-full bg-accent-blue" /><span className="text-muted-foreground text-xs font-mono w-20">{label}</span><span>{new Date(date).toLocaleDateString()}</span></div>;
}
