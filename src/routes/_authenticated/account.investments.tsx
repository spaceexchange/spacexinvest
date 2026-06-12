import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Pill } from "@/components/dashboard/ui";
import { getMyInvestments, money } from "@/lib/data/portal";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account/investments")({
  head: () => ({ meta: [{ title: "My Investments — SpaceX IPO Exchange" }] }),
  component: InvestmentsPage,
});

function InvestmentsPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getMyInvestments().then((d) => { setList(d); setLoading(false); }); }, []);

  return (
    <div>
      <PageHeader
        title="My Investments"
        subtitle="All active and pending positions across the platform."
        action={<Link to="/account/opportunities" className="btn-primary !min-h-[36px] !py-1.5 !px-4 !text-xs">New Investment</Link>}
      />

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {!loading && list.length === 0 && (
        <Panel><div className="py-10 text-center text-sm text-muted-foreground">No investments yet. <Link to="/account/opportunities" className="text-accent-blue hover:underline">Browse opportunities</Link>.</div></Panel>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {list.map((inv) => (
          <Panel key={inv.id}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-accent-blue/20 to-purple-500/20 grid place-items-center text-accent-blue shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">{inv.opportunity?.title ?? "Investment"}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Created {new Date(inv.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <Pill tone={inv.status === "active" ? "success" : inv.approval_status === "rejected" ? "danger" : "warning"}>{inv.status}</Pill>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <Metric label="Shares" value={Number(inv.shares).toFixed(2)} />
              <Metric label="Amount" value={money(Number(inv.amount))} />
              <Metric label="Approval" value={inv.approval_status} />
            </div>

            <div className="flex gap-2">
              <Link to="/account/portfolio" className="flex-1 text-center h-9 rounded-md border border-border text-xs font-medium text-foreground hover:border-accent-blue/40 hover:text-accent-blue transition-colors grid place-items-center">Details</Link>
              <Link to="/account/opportunities" className="flex-1 text-center h-9 rounded-md bg-accent-blue/10 border border-accent-blue/30 text-xs font-medium text-accent-blue hover:bg-accent-blue/20 transition-colors grid place-items-center">Add more</Link>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  const color = tone === "up" ? "text-emerald-400" : tone === "down" ? "text-red-400" : "text-foreground";
  return (
    <div>
      <div className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase mb-1">{label}</div>
      <div className={`text-sm font-semibold ${color} flex items-center gap-1`}>
        {tone === "up" && <TrendingUp className="h-3 w-3" />}
        {tone === "down" && <TrendingDown className="h-3 w-3" />}
        {value}
      </div>
    </div>
  );
}
