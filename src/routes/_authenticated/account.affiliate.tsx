import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Coins, TrendingUp, Award, Copy, Wallet } from "lucide-react";
import { PageHeader, Panel, Pill, StatCard, inputCls } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getMyReferralProfile, getMyReferrals, requestPayout, getMyAffiliatePayouts } from "@/lib/m9";
import { getMyCommissions, getMyCommissionSummary, getMyDownline, getLeaderboard } from "@/lib/m10";

export const Route = createFileRoute("/_authenticated/account/affiliate")({
  head: () => ({ meta: [{ title: "Affiliate Center — SpaceX IPO Exchange" }] }),
  component: AffiliatePage,
});

function AffiliatePage() {
  const [profile, setProfile] = useState<any>(null);
  const [refs, setRefs] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ total: 0, pending: 0, approved: 0, paid: 0, count: 0 });
  const [downline, setDownline] = useState<any>({ l1: [], l2: [], l3: [] });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [payAmt, setPayAmt] = useState("");

  const reload = async () => {
    const [p, r, c, s, d, lb, py] = await Promise.all([
      getMyReferralProfile(), getMyReferrals(), getMyCommissions(), getMyCommissionSummary(),
      getMyDownline(), getLeaderboard(10), getMyAffiliatePayouts(),
    ]);
    setProfile(p); setRefs(r); setCommissions(c); setSummary(s);
    setDownline(d); setLeaderboard(lb); setPayouts(py);
  };
  useEffect(() => { reload(); }, []);

  const refLink = profile?.referral_code ? `${typeof window !== "undefined" ? window.location.origin : ""}/auth/register?ref=${profile.referral_code}` : "";

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied"); };

  const requestPay = async () => {
    const amt = Number(payAmt);
    if (!amt || amt <= 0) return;
    if (amt > summary.approved) { toast.error("Amount exceeds approved balance"); return; }
    try { await requestPayout(amt, "wallet"); toast.success("Payout requested"); setPayAmt(""); reload(); }
    catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  const totalDown = downline.l1.length + downline.l2.length + downline.l3.length;
  

  return (
    <div>
      <PageHeader title="Affiliate Center" subtitle="Grow your network and earn 3-level commissions." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <StatCard label="Total Earnings" value={`$${summary.total.toFixed(2)}`} icon={<Coins className="h-4 w-4" />} />
        <StatCard label="Pending" value={`$${summary.pending.toFixed(2)}`} />
        <StatCard label="Approved" value={`$${summary.approved.toFixed(2)}`} />
        <StatCard label="Paid Out" value={`$${summary.paid.toFixed(2)}`} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <StatCard label="Direct Referrals" value={downline.l1.length} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Level 2" value={downline.l2.length} />
        <StatCard label="Level 3" value={downline.l3.length} />
        <StatCard label="Network Total" value={totalDown} icon={<TrendingUp className="h-4 w-4" />} />
      </div>

      <div className="grid lg:grid-cols-1 gap-4 mb-6">
        <Panel title="Your Referral Link">
          {profile?.referral_code ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-mono text-muted-foreground mb-1">CODE</div>
                <div className="flex gap-2">
                  <input className={inputCls} readOnly value={profile.referral_code} />
                  <Button variant="outline" size="sm" onClick={() => copy(profile.referral_code)}><Copy className="h-4 w-4" /></Button>
                </div>
              </div>
              <div>
                <div className="text-xs font-mono text-muted-foreground mb-1">LINK</div>
                <div className="flex gap-2">
                  <input className={inputCls} readOnly value={refLink} />
                  <Button variant="outline" size="sm" onClick={() => copy(refLink)}><Copy className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ) : <p className="text-sm text-muted-foreground">Loading…</p>}
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Panel title="Commission Ledger" action={<Pill>{commissions.length}</Pill>}>
          <div className="max-h-72 overflow-y-auto">
            {commissions.length === 0 ? <p className="text-sm text-muted-foreground">No commissions yet.</p> : (
              <table className="w-full text-sm">
                <thead><tr className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase border-b border-border"><th className="text-left py-2">Event</th><th className="text-left">Lvl</th><th className="text-right">Amount</th><th className="text-left pl-3">Status</th></tr></thead>
                <tbody className="divide-y divide-border/60">
                  {commissions.slice(0, 50).map((c) => (
                    <tr key={c.id}>
                      <td className="py-2">{c.event_type}</td>
                      <td>L{c.level}</td>
                      <td className="text-right">${Number(c.amount).toFixed(2)}</td>
                      <td className="pl-3"><Pill tone={c.status === "paid" ? "success" : c.status === "rejected" ? "danger" : c.status === "approved" ? "info" : "warning"}>{c.status}</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Panel>

        <Panel title="Request Payout" action={<Wallet className="h-4 w-4 text-muted-foreground" />}>
          <p className="text-xs text-muted-foreground mb-3">Approved balance: <span className="text-foreground font-semibold">${summary.approved.toFixed(2)}</span></p>
          <div className="flex gap-2 mb-4">
            <input className={inputCls} placeholder="Amount (USD)" type="number" min="1" value={payAmt} onChange={(e) => setPayAmt(e.target.value)} />
            <Button onClick={requestPay} disabled={!summary.approved}>Request</Button>
          </div>
          <div className="text-[10px] font-mono tracking-widest text-muted-foreground mb-2">RECENT PAYOUTS</div>
          <ul className="space-y-1 text-sm">
            {payouts.length === 0 && <li className="text-muted-foreground">None yet</li>}
            {payouts.slice(0, 5).map((p) => (
              <li key={p.id} className="flex justify-between">
                <span className="text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                <span>${Number(p.amount).toFixed(2)}</span>
                <Pill tone={p.status === "paid" ? "success" : "warning"}>{p.status}</Pill>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="My Referrals">
          {refs.length === 0 ? <p className="text-sm text-muted-foreground">No referrals yet. Share your link!</p> : (
            <ul className="text-sm divide-y divide-border/60">
              {refs.slice(0, 10).map((r) => (
                <li key={r.id} className="py-2 flex justify-between"><span className="font-mono">{r.code}</span><span className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span><Pill tone={r.status === "active" ? "success" : "default"}>{r.status}</Pill></li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Top Affiliates" action={<Award className="h-4 w-4 text-muted-foreground" />}>
          {leaderboard.length === 0 ? <p className="text-sm text-muted-foreground">No data yet.</p> : (
            <ul className="text-sm divide-y divide-border/60">
              {leaderboard.map((row: any) => (
                <li key={row.rank} className="py-2 flex justify-between items-center">
                  <span className="flex items-center gap-2"><span className="font-mono text-muted-foreground w-6">#{row.rank}</span>{row.user?.display_name ?? row.user?.email ?? "Anon"}</span>
                  <span className="font-mono">${row.total.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
