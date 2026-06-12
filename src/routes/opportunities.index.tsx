import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listOpportunitiesPublic, getOppMediaSignedUrl } from "@/lib/opportunities";
import { useRealtimeChannel } from "@/lib/data/portal";
import { Star, ArrowRight } from "lucide-react";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export const Route = createFileRoute("/opportunities/")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Investment Opportunities — SpaceX IPO Exchange" },
    { name: "description", content: "Browse curated private market investment opportunities in aerospace, defense, AI, energy and frontier sectors." },
  ]}),
  component: OppsPublic,
});

function OppsPublic() {
  const [rows, setRows] = useState<any[]>([]);
  const [covers, setCovers] = useState<Record<string, string>>({});

  const reload = async () => {
    const list = await listOpportunitiesPublic();
    setRows(list);
    const next: Record<string, string> = {};
    await Promise.all(list.map(async (o: any) => {
      if (o.cover_image) {
        const url = await getOppMediaSignedUrl(o.cover_image);
        if (url) next[o.id] = url;
      }
    }));
    setCovers(next);
  };
  useEffect(() => { reload(); }, []);
  useRealtimeChannel("opps-public", [{ table: "investment_opportunities" }], reload);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
        <div className="mb-10">
          <div className="text-[10px] font-mono tracking-[0.3em] text-accent-blue mb-2">OPEN ALLOCATIONS</div>
          <h1 className="text-3xl sm:text-5xl font-semibold text-foreground">Investment Opportunities</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-2xl">Curated private and pre-IPO opportunities across aerospace, defense and frontier technology.</p>
        </div>

        {rows.length === 0 && <div className="text-sm text-muted-foreground py-20 text-center">No opportunities live right now. Check back soon.</div>}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rows.map((o) => {
            const pct = Number(o.target_amount) > 0 ? (Number(o.raised_amount) / Number(o.target_amount)) * 100 : 0;
            return (
              <Link key={o.id} to="/opportunities/$slug" params={{ slug: o.slug ?? o.id }} className="glass-card rounded-xl overflow-hidden hover:border-accent-blue/40 transition-colors group">
                <div className="aspect-[16/9] bg-secondary relative overflow-hidden">
                  {covers[o.id] ? <img src={covers[o.id]} alt={o.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : (
                    <div className="w-full h-full grid place-items-center text-muted-foreground text-xs font-mono">NO IMAGE</div>
                  )}
                  {o.featured && <div className="absolute top-2 left-2 px-2 py-1 rounded bg-amber-500/90 text-black text-[10px] font-mono tracking-wider flex items-center gap-1"><Star className="h-3 w-3 fill-black" /> FEATURED</div>}
                  <div className="absolute top-2 right-2 px-2 py-1 rounded bg-background/80 backdrop-blur text-[10px] font-mono uppercase tracking-wider">{o.status.replace(/_/g, " ")}</div>
                </div>
                <div className="p-5">
                  <div className="text-[10px] font-mono tracking-[0.25em] text-accent-blue mb-1">{o.industry ?? o.category}</div>
                  <h3 className="font-semibold text-foreground mb-1">{o.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5em]">{o.short_description ?? o.description ?? ""}</p>
                  <div className="mt-4">
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-accent-blue" style={{ width: `${Math.min(100, pct)}%` }} /></div>
                    <div className="flex justify-between text-[11px] mt-1 font-mono text-muted-foreground">
                      <span>{fmt(Number(o.raised_amount))} raised</span>
                      <span>{fmt(Number(o.target_amount))} target</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                    <div><div className="text-muted-foreground">Min</div><div className="font-medium">{fmt(Number(o.minimum_investment))}</div></div>
                    <div><div className="text-muted-foreground">Expected ROI</div><div className="font-medium">{o.expected_roi ? `${o.expected_roi}%` : "—"}</div></div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs text-accent-blue font-medium">View details <ArrowRight className="h-3.5 w-3.5" /></div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
