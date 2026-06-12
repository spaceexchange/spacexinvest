import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trophy, Star, Sparkles } from "lucide-react";
import { PageHeader, Panel, Pill, StatCard } from "@/components/dashboard/ui";
import { getMyPoints, getMyRewardLedger, getRewardLevels } from "@/lib/m9";

export const Route = createFileRoute("/_authenticated/account/rewards")({
  head: () => ({ meta: [{ title: "Rewards — SpaceX IPO Exchange" }] }),
  component: RewardsPage,
});

function RewardsPage() {
  const [points, setPoints] = useState<any>(null);
  const [levels, setLevels] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [p, l, t] = await Promise.all([getMyPoints(), getRewardLevels(), getMyRewardLedger(50)]);
      setPoints(p); setLevels(l); setLedger(t);
    })();
  }, []);

  const current = levels.find((l) => l.tier === (points?.level_tier ?? 1)) ?? levels[0];
  const next = levels.find((l) => l.tier === (points?.level_tier ?? 1) + 1);
  const pts = Number(points?.points ?? 0);
  const progress = next ? Math.min(100, ((pts - (current?.min_points ?? 0)) / (next.min_points - (current?.min_points ?? 0))) * 100) : 100;

  return (
    <div>
      <PageHeader title="Loyalty & Rewards" subtitle="Earn points for activity, unlock investor tiers." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <StatCard label="Current Tier" value={current?.name ?? "—"} icon={<Trophy className="h-4 w-4" />} />
        <StatCard label="Points" value={pts.toLocaleString()} icon={<Star className="h-4 w-4" />} />
        <StatCard label="Lifetime" value={Number(points?.lifetime_points ?? 0).toLocaleString()} icon={<Sparkles className="h-4 w-4" />} />
        <StatCard label="To Next Tier" value={next ? `${Math.max(0, next.min_points - pts).toLocaleString()} pts` : "MAX"} />
      </div>

      <Panel title="Tier Progress" className="mb-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="font-display text-lg" style={{ color: current?.color ?? "#fff" }}>{current?.name}</span>
          {next && <span className="text-xs text-muted-foreground">→ {next.name}</span>}
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-accent-blue to-purple-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 text-xs text-muted-foreground">{progress.toFixed(0)}% to {next?.name ?? "max tier"}</div>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="All Tiers">
          <ul className="space-y-2">
            {levels.map((l) => {
              const benefits: string[] = Array.isArray(l.benefits) ? l.benefits : [];
              const isCurrent = l.tier === current?.tier;
              return (
                <li key={l.id} className={`rounded-lg border p-3 ${isCurrent ? "border-accent-blue/40 bg-accent-blue/5" : "border-border"}`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="font-medium" style={{ color: l.color }}>{l.name} <span className="text-xs text-muted-foreground ml-1">Tier {l.tier}</span></div>
                    <div className="text-xs font-mono text-muted-foreground">{l.min_points.toLocaleString()}+ pts</div>
                  </div>
                  <ul className="text-xs text-muted-foreground list-disc ml-4 mt-1">
                    {benefits.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Recent Activity">
          <ul className="divide-y divide-border">
            {ledger.length === 0 && <li className="py-6 text-center text-xs text-muted-foreground">No reward activity yet.</li>}
            {ledger.map((t) => (
              <li key={t.id} className="py-3 grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center">
                <div className="min-w-0">
                  <div className="text-sm text-foreground truncate">{t.reason}</div>
                  <div className="text-[11px] text-muted-foreground">{new Date(t.created_at).toLocaleString()}</div>
                </div>
                <Pill tone={t.delta > 0 ? "success" : "warning"}>{t.delta > 0 ? `+${t.delta}` : t.delta} pts</Pill>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
