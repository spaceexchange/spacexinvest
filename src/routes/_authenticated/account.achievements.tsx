import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Pill } from "@/components/dashboard/ui";
import { listAchievements, listMyAchievements, leaderboardAchievements, type Achievement } from "@/lib/m9-help";
import { Award, Lock, Trophy, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account/achievements")({
  head: () => ({ meta: [{ title: "Achievements — SpaceX IPO Exchange" }] }),
  component: AchievementsPage,
});

const tierColors: Record<string, string> = {
  bronze: "from-orange-700 to-orange-500",
  silver: "from-slate-400 to-slate-200",
  gold: "from-yellow-500 to-yellow-300",
  platinum: "from-cyan-400 to-purple-400",
  diamond: "from-blue-400 to-fuchsia-400",
};

function AchievementsPage() {
  const [all, setAll] = useState<Achievement[]>([]);
  const [mine, setMine] = useState<any[]>([]);
  const [lb, setLb] = useState<any[]>([]);
  useEffect(() => {
    listAchievements().then(setAll);
    listMyAchievements().then(setMine);
    leaderboardAchievements(10).then(setLb);
  }, []);

  const ownedIds = new Set(mine.map((m) => m.achievement_id));
  const totalPoints = mine.reduce((s, m) => s + Number(m.achievement?.points ?? 0), 0);
  const byCategory = new Map<string, Achievement[]>();
  all.forEach((a) => { if (!byCategory.has(a.category)) byCategory.set(a.category, []); byCategory.get(a.category)!.push(a); });

  return (
    <div>
      <PageHeader title="Achievements" subtitle="Earn badges as you invest, refer friends, and reach milestones." />

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat icon={<Award />} label="Earned" value={`${mine.length} / ${all.length}`} />
        <Stat icon={<Sparkles />} label="Points" value={totalPoints.toLocaleString()} />
        <Stat icon={<Trophy />} label="Categories" value={String(byCategory.size)} />
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        <div className="space-y-5">
          {Array.from(byCategory.entries()).map(([cat, items]) => (
            <Panel key={cat} title={cat.toUpperCase()}>
              <div className="grid sm:grid-cols-2 gap-3">
                {items.map((a) => {
                  const owned = ownedIds.has(a.id);
                  const earned = mine.find((m) => m.achievement_id === a.id);
                  return (
                    <div key={a.id} className={`rounded-xl p-4 border ${owned ? "border-accent-blue/40 bg-accent-blue/5" : "border-border bg-surface/40 opacity-70"}`}>
                      <div className="flex items-start gap-3">
                        <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${tierColors[a.tier] ?? tierColors.bronze} grid place-items-center text-background shrink-0`}>
                          {owned ? <Award className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-semibold text-sm">{a.title}</div>
                            <Pill tone={owned ? "success" : "default"}>{a.tier}</Pill>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{a.description}</div>
                          <div className="flex items-center gap-3 mt-2 text-[11px]">
                            <span className="text-accent-blue font-mono">+{a.points} pts</span>
                            {owned && earned && <span className="text-muted-foreground">Earned {new Date(earned.awarded_at).toLocaleDateString()}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          ))}
          {all.length === 0 && <Panel><div className="py-10 text-center text-sm text-muted-foreground">No achievements available yet.</div></Panel>}
        </div>

        <Panel title="LEADERBOARD">
          <ol className="space-y-2">
            {lb.map((r) => (
              <li key={r.user_id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-xs font-mono w-6 ${r.rank <= 3 ? "text-accent-blue" : "text-muted-foreground"}`}>#{r.rank}</span>
                  <span className="truncate">{r.name}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{r.count}</span>
              </li>
            ))}
            {lb.length === 0 && <li className="py-8 text-center text-xs text-muted-foreground">No leaderboard data yet.</li>}
          </ol>
        </Panel>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: any) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono tracking-[0.25em] text-muted-foreground uppercase">{label}</span>
        <span className="text-accent-blue">{icon}</span>
      </div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
