import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader, Panel, Pill, StatCard, inputCls } from "@/components/dashboard/ui";
import { Copy, Users, Trophy, Share2, Gift, Send } from "lucide-react";
import {
  getMyReferralProfile,
  getMyReferrals,
  getMyReferralRewards,
  getMyAffiliatePayouts,
  getReferralLeaderboard,
  requestPayout,
  referralLink,
} from "@/lib/m9";
import { money } from "@/lib/data/portal";

export const Route = createFileRoute("/_authenticated/account/referrals")({
  head: () => ({ meta: [{ title: "Referrals — SpaceX IPO Exchange" }] }),
  component: ReferralsPage,
});

function ReferralsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [refs, setRefs] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [board, setBoard] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const [p, r, rw, po, lb] = await Promise.all([
      getMyReferralProfile(), getMyReferrals(), getMyReferralRewards(), getMyAffiliatePayouts(), getReferralLeaderboard(10),
    ]);
    setProfile(p); setRefs(r); setRewards(rw); setPayouts(po); setBoard(lb);
  }
  useEffect(() => { refresh(); }, []);

  const link = referralLink(profile?.referral_code);
  const totalEarned = rewards.reduce((a, b) => a + (b.status !== "rejected" ? Number(b.amount) : 0), 0);
  const paidOut = payouts.filter((p) => p.status === "paid").reduce((a, b) => a + Number(b.amount), 0);
  const pendingPayouts = payouts.filter((p) => p.status !== "paid").reduce((a, b) => a + Number(b.amount), 0);
  const available = Math.max(0, totalEarned - paidOut - pendingPayouts);
  const qualified = refs.filter((r) => r.status === "qualified" || r.status === "active").length;

  function copyLink() {
    if (!link) return;
    navigator.clipboard?.writeText(link);
    setCopied(true);
    toast.success("Referral link copied");
    setTimeout(() => setCopied(false), 1500);
  }

  async function submitPayout() {
    const a = Number(amount);
    if (!a || a <= 0) return toast.error("Enter an amount");
    if (a > available) return toast.error("Exceeds available balance");
    setBusy(true);
    try {
      await requestPayout(a);
      toast.success("Payout requested");
      setAmount("");
      await refresh();
    } catch (e: any) { toast.error(e.message); }
    setBusy(false);
  }

  return (
    <div>
      <PageHeader title="Referral Center" subtitle="Earn rewards by inviting qualified investors." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <StatCard label="Total Referred" value={String(refs.length)} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Qualified" value={String(qualified)} icon={<Trophy className="h-4 w-4" />} />
        <StatCard label="Total Earnings" value={money(totalEarned)} icon={<Gift className="h-4 w-4" />} />
        <StatCard label="Available" value={money(available)} />
      </div>

      <Panel title="Your Referral Link" className="mb-4">
        <div className="grid sm:grid-cols-[1fr_auto] gap-3">
          <div className="rounded-md border border-border bg-surface/60 px-4 h-12 flex items-center font-mono text-xs sm:text-sm text-foreground truncate">
            {link || "Loading…"}
          </div>
          <button onClick={copyLink} className="btn-primary !min-h-[48px] flex items-center gap-2">
            <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy link"}
          </button>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs flex-wrap">
          <span className="text-muted-foreground">Code:</span>
          <span className="font-mono text-accent-blue">{profile?.referral_code ?? "—"}</span>
          <span className="text-muted-foreground">· Earn up to 1% of referred investments</span>
        </div>
      </Panel>

      <Panel title="Request Payout" className="mb-4">
        <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
          <label className="block">
            <span className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase block mb-1.5">Amount (USD)</span>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Available: ${money(available)}`} className={inputCls} />
          </label>
          <button onClick={submitPayout} disabled={busy || available <= 0} className="btn-primary disabled:opacity-50 flex items-center gap-2">
            <Send className="h-4 w-4" /> {busy ? "Requesting…" : "Request"}
          </button>
        </div>
        {payouts.length > 0 && (
          <ul className="mt-4 divide-y divide-border">
            {payouts.slice(0, 5).map((p) => (
              <li key={p.id} className="py-2 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 items-center text-sm">
                <div className="text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</div>
                <div className="font-medium">{money(Number(p.amount))}</div>
                <Pill tone={p.status === "paid" ? "success" : p.status === "failed" ? "danger" : "warning"}>{p.status}</Pill>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Referral History" action={<Share2 className="h-4 w-4 text-muted-foreground" />}>
          <ul className="divide-y divide-border">
            {refs.length === 0 && <li className="py-6 text-center text-xs text-muted-foreground">No referrals yet. Share your link!</li>}
            {refs.map((h) => {
              const reward = rewards.find((r) => r.referred_user_id === h.referred_user_id);
              return (
                <li key={h.id} className="py-3 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 items-center">
                  <div className="min-w-0">
                    <div className="text-sm text-foreground truncate font-mono text-xs">{h.referred_user_id?.slice(0, 8)}…</div>
                    <div className="text-[11px] text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</div>
                  </div>
                  <Pill tone={h.status === "qualified" ? "success" : "warning"}>{h.status}</Pill>
                  <div className="text-sm font-medium text-emerald-400">{reward ? `+${money(Number(reward.amount))}` : "—"}</div>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Top Referrers Leaderboard">
          <ol className="space-y-2">
            {board.length === 0 && <li className="py-6 text-center text-xs text-muted-foreground">Leaderboard empty.</li>}
            {board.map((l) => (
              <li key={l.rank} className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 items-center rounded-md p-3 border border-border">
                <div className={`h-7 w-7 rounded-md grid place-items-center text-xs font-bold ${l.rank <= 3 ? "bg-gradient-to-br from-amber-400 to-amber-600 text-background" : "bg-secondary text-foreground"}`}>
                  {l.rank}
                </div>
                <div className="text-sm text-foreground truncate">{l.name}</div>
                <div className="text-sm font-mono text-foreground">{money(Number(l.earned))}</div>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </div>
  );
}
