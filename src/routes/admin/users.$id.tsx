import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Plus, Minus, Wallet as WalletIcon, ShieldAlert, ShieldCheck, KeyRound, Snowflake, Sun, FileText, Check, X, Equal } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Pill, btnGhost, btnSecondary, btnPrimary, inputCls } from "@/components/staff/ui";
import { StaffNotesPanel } from "@/components/staff/StaffNotesPanel";
import { moneyc } from "@/lib/data/portal";
import {
  reviewKyc, reviewFunding, advanceFunding, reviewInvestment,
  adjustWallet, setWalletStatus, setExactWalletBalance,
  setAccountStatus, sendUserPasswordReset, getAdminSignedUrl,
} from "@/lib/data/admin.functions";

export const Route = createFileRoute("/admin/users/$id")({ component: UserDetailPage });

type Tab = "overview" | "wallet" | "investments" | "deposits" | "withdrawals" | "kyc" | "referrals" | "audit";

function UserDetailPage() {
  const { id } = Route.useParams();
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [walletTx, setWalletTx] = useState<any[]>([]);
  const [invs, setInvs] = useState<any[]>([]);
  const [funding, setFunding] = useState<any[]>([]);
  const [kycs, setKycs] = useState<any[]>([]);
  const [refs, setRefs] = useState<any[]>([]);
  const [refRewards, setRefRewards] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [lastLogin, setLastLogin] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [p, r, w, i, f, k, rf, rr, al, ld] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", id),
      supabase.from("wallets").select("*").eq("user_id", id).eq("currency", "USD").maybeSingle(),
      supabase.from("investments").select("*, opportunity:investment_opportunities(title)").eq("investor_id", id).order("created_at", { ascending: false }),
      supabase.from("funding_requests").select("*").eq("user_id", id).order("created_at", { ascending: false }),
      supabase.from("kyc_submissions").select("*").eq("user_id", id).order("submitted_at", { ascending: false }),
      supabase.from("referrals").select("*, referred:profiles!referrals_referred_user_id_fkey(email,display_name,created_at)").eq("referrer_id", id).order("created_at", { ascending: false }),
      supabase.from("commissions").select("*").eq("beneficiary_id", id).order("created_at", { ascending: false }).limit(50),
      supabase.from("audit_logs").select("*").eq("entity_id", id).order("created_at", { ascending: false }).limit(50),
      supabase.from("security_events").select("created_at,event_type").eq("user_id", id).eq("event_type", "2fa_challenge_success").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    setProfile(p.data);
    setRoles((r.data ?? []).map((x: any) => x.role));
    setWallet(w.data);
    setInvs(i.data ?? []);
    setFunding(f.data ?? []);
    setKycs(k.data ?? []);
    setRefs(rf.data ?? []);
    setRefRewards(rr.data ?? []);
    setAudit(al.data ?? []);
    setLastLogin((ld.data as any)?.created_at ?? null);
    if (w.data) {
      const { data: wt } = await supabase.from("wallet_transactions").select("*").eq("wallet_id", w.data.id).order("created_at", { ascending: false }).limit(100);
      setWalletTx(wt ?? []);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // server-fn hooks
  const fnAdjust = useServerFn(adjustWallet);
  const fnSetBal = useServerFn(setExactWalletBalance);
  const fnFreeze = useServerFn(setWalletStatus);
  const fnInv = useServerFn(reviewInvestment);
  const fnFund = useServerFn(reviewFunding);
  const fnAdvFund = useServerFn(advanceFunding);
  const fnKyc = useServerFn(reviewKyc);
  const fnStatus = useServerFn(setAccountStatus);
  const fnReset = useServerFn(sendUserPasswordReset);
  const fnUrl = useServerFn(getAdminSignedUrl);

  async function act<T>(fn: () => Promise<T>, success: string) {
    try { await fn(); toast.success(success); await load(); }
    catch (e: any) { toast.error(e?.message ?? "Action failed"); }
  }

  async function openDoc(bucket: string, path: string) {
    try { const { url } = await fnUrl({ data: { bucket, path } }); window.open(url, "_blank"); }
    catch (e: any) { toast.error(e?.message ?? "Could not open document"); }
  }

  if (loading) return <div className="py-10 text-center text-sm text-muted-foreground">Loading user…</div>;
  if (!profile) return <div className="py-10 text-center text-sm text-muted-foreground">User not found.</div>;

  const status = profile.account_status ?? "active";
  const totalRefEarnings = refRewards.filter((c: any) => c.status === "paid").reduce((s: number, c: any) => s + Number(c.amount ?? 0), 0);

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "wallet", label: "Wallet", count: walletTx.length },
    { id: "investments", label: "Investments", count: invs.length },
    { id: "deposits", label: "Deposits", count: funding.filter(f => f.request_type === "deposit").length },
    { id: "withdrawals", label: "Withdrawals", count: funding.filter(f => f.request_type === "withdrawal").length },
    { id: "kyc", label: "KYC", count: kycs.length },
    { id: "referrals", label: "Referrals", count: refs.length },
    { id: "audit", label: "Audit", count: audit.length },
  ];

  return (
    <div>
      <Link to="/admin/users" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"><ArrowLeft className="h-3 w-3" />Back to users</Link>
      <PageHeader
        eyebrow="USER PROFILE"
        title={profile.display_name ?? profile.email ?? "User"}
        subtitle={profile.email}
        action={
          <div className="flex items-center gap-2">
            <Pill tone={profile.kyc_status === "verified" ? "success" : "warning"}>KYC: {profile.kyc_status ?? "unverified"}</Pill>
            <Pill tone={status === "active" ? "success" : status === "suspended" ? "warning" : "danger"}>{status}</Pill>
          </div>
        }
      />

      {/* Security control bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        {status === "active" ? (
          <>
            <button onClick={() => { const reason = prompt("Reason to suspend:") ?? undefined; act(() => fnStatus({ data: { user_id: id, status: "suspended", reason } }), "Account suspended"); }} className={btnGhost}><ShieldAlert className="h-3.5 w-3.5 text-yellow-400" />Suspend</button>
            <button onClick={() => { const reason = prompt("Reason to lock:") ?? undefined; act(() => fnStatus({ data: { user_id: id, status: "locked", reason } }), "Account locked"); }} className={btnGhost}><ShieldAlert className="h-3.5 w-3.5 text-red-400" />Lock</button>
          </>
        ) : (
          <button onClick={() => act(() => fnStatus({ data: { user_id: id, status: "active" } }), "Account reactivated")} className={btnGhost}><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />Reactivate</button>
        )}
        <button onClick={() => act(() => fnReset({ data: { user_id: id } }), "Password reset email sent")} className={btnGhost}><KeyRound className="h-3.5 w-3.5" />Send password reset</button>
        {wallet && (
          <button onClick={() => act(() => fnFreeze({ data: { wallet_id: wallet.id, status: wallet.status === "active" ? "frozen" : "active" } }), "Wallet updated")} className={btnGhost}>
            {wallet.status === "active" ? <><Snowflake className="h-3.5 w-3.5 text-accent-blue" />Freeze wallet</> : <><Sun className="h-3.5 w-3.5 text-yellow-400" />Unfreeze wallet</>}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-4 border-b border-border">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 h-9 text-sm border-b-2 -mb-px ${tab === t.id ? "border-accent-blue text-accent-blue" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label}{typeof t.count === "number" && <span className="text-[10px] text-muted-foreground ml-1">({t.count})</span>}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {tab === "overview" && (
            <>
              <Panel title="Personal Information">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <Field label="Full Name" value={`${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || profile.display_name || "—"} />
                  <Field label="Email" value={profile.email ?? "—"} />
                  <Field label="Phone" value={profile.phone ?? "—"} />
                  <Field label="Country" value={profile.country ?? "—"} />
                  <Field label="Registered" value={profile.created_at ? new Date(profile.created_at).toLocaleString() : "—"} />
                  <Field label="Last Login" value={lastLogin ? new Date(lastLogin).toLocaleString() : "—"} />
                  <Field label="Account Status" value={status} />
                  <Field label="Email Verified" value={profile.email_verified ? "Yes" : "No"} />
                  <Field label="2FA" value={profile.two_factor_enabled ? "On" : "Off"} />
                  <Field label="Roles" value={roles.join(", ") || "—"} />
                  <Field label="Referral Code" value={profile.referral_code ?? "—"} mono />
                  <Field label="User ID" value={profile.id} mono />
                </dl>
                {profile.suspended_reason && (
                  <div className="mt-3 text-xs p-2 rounded border border-yellow-500/30 bg-yellow-500/5 text-yellow-200">
                    Suspended: {profile.suspended_reason}
                  </div>
                )}
              </Panel>
              <Panel title="Quick Stats">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <Stat label="Wallet" value={wallet ? moneyc(Number(wallet.balance)) : "—"} />
                  <Stat label="Investments" value={invs.length} />
                  <Stat label="Deposits" value={funding.filter(f => f.request_type === "deposit").length} />
                  <Stat label="Withdrawals" value={funding.filter(f => f.request_type === "withdrawal").length} />
                  <Stat label="Referrals" value={refs.length} />
                  <Stat label="Referral Earnings" value={moneyc(totalRefEarnings)} />
                  <Stat label="KYC Submissions" value={kycs.length} />
                  <Stat label="Audit Events" value={audit.length} />
                </div>
              </Panel>
            </>
          )}

          {tab === "wallet" && (
            <Panel title="Wallet" action={<span className="text-xs font-mono">{wallet ? moneyc(Number(wallet.balance)) : "no wallet"}</span>}>
              <div className="flex flex-wrap gap-2 mb-4">
                <button onClick={async () => {
                  const v = prompt("Credit amount (USD):"); if (!v) return;
                  const reason = prompt("Reason:") ?? "manual credit";
                  act(() => fnAdjust({ data: { user_id: id, delta: Number(v), reason } }), "Wallet credited");
                }} className={btnSecondary}><Plus className="h-3.5 w-3.5" />Credit</button>
                <button onClick={async () => {
                  const v = prompt("Debit amount (USD):"); if (!v) return;
                  const reason = prompt("Reason:") ?? "manual debit";
                  act(() => fnAdjust({ data: { user_id: id, delta: -Number(v), reason } }), "Wallet debited");
                }} className={btnSecondary}><Minus className="h-3.5 w-3.5" />Debit</button>
                <button onClick={async () => {
                  const v = prompt("Set exact balance (USD):", wallet ? String(wallet.balance) : "0"); if (v === null) return;
                  const reason = prompt("Reason (required):"); if (!reason) return;
                  act(() => fnSetBal({ data: { user_id: id, balance: Number(v), reason } }), "Balance set");
                }} className={btnSecondary}><Equal className="h-3.5 w-3.5" />Set exact</button>
              </div>
              <div className="text-[10px] font-mono tracking-[0.25em] text-muted-foreground mb-2">TRANSACTIONS</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="py-2 pr-3">Date</th><th className="pr-3">Type</th><th className="pr-3">Amount</th><th className="pr-3">Before</th><th className="pr-3">After</th><th>Reference</th>
                  </tr></thead>
                  <tbody>
                    {walletTx.map(t => (
                      <tr key={t.id} className="border-b border-border/40">
                        <td className="py-2 pr-3 font-mono text-[11px]">{new Date(t.created_at).toLocaleString()}</td>
                        <td className="pr-3"><Pill tone={t.transaction_type === "debit" || t.transaction_type === "withdrawal" || t.transaction_type === "investment" ? "danger" : "success"}>{t.transaction_type}</Pill></td>
                        <td className="pr-3 font-mono">{moneyc(Number(t.amount))}</td>
                        <td className="pr-3 font-mono text-xs">{moneyc(Number(t.balance_before))}</td>
                        <td className="pr-3 font-mono text-xs">{moneyc(Number(t.balance_after))}</td>
                        <td className="font-mono text-[11px] text-muted-foreground">{t.reference ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {walletTx.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">No transactions.</div>}
              </div>
            </Panel>
          )}

          {tab === "investments" && (
            <Panel title="Investments">
              {invs.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">No investments.</div>}
              <div className="space-y-2">
                {invs.map(i => (
                  <div key={i.id} className="border border-border rounded-md p-3 text-sm">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{i.opportunity?.title ?? "—"}</div>
                        <div className="text-[11px] font-mono text-muted-foreground">{new Date(i.created_at).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{moneyc(Number(i.amount))}</span>
                        <Pill tone={i.approval_status === "approved" ? "success" : i.approval_status === "rejected" ? "danger" : "warning"}>{i.approval_status}</Pill>
                        <Pill tone={i.status === "active" ? "success" : i.status === "cancelled" ? "danger" : "default"}>{i.status}</Pill>
                      </div>
                    </div>
                    {i.approval_status === "pending" && (
                      <div className="flex gap-1 justify-end mt-2">
                        <button className={btnGhost} onClick={() => act(() => fnInv({ data: { id: i.id, decision: "approved" } }), "Investment approved")}><Check className="h-3.5 w-3.5 text-emerald-400" />Approve</button>
                        <button className={btnGhost} onClick={() => { const notes = prompt("Reason:") ?? undefined; act(() => fnInv({ data: { id: i.id, decision: "rejected", notes } }), "Investment rejected"); }}><X className="h-3.5 w-3.5 text-red-400" />Reject / Cancel</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {tab === "deposits" && (
            <Panel title="Deposits">
              {funding.filter(f => f.request_type === "deposit").length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">No deposits.</div>}
              <div className="space-y-2">
                {funding.filter(f => f.request_type === "deposit").map(d => (
                  <div key={d.id} className="border border-border rounded-md p-3 text-sm">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <div className="font-medium">{moneyc(Number(d.amount))} <span className="text-xs text-muted-foreground">· {d.payment_method}</span></div>
                        <div className="text-[11px] font-mono text-muted-foreground">{new Date(d.created_at).toLocaleString()} · ref {d.reference_number ?? "—"}</div>
                      </div>
                      <Pill tone={d.status === "approved" ? "success" : d.status === "rejected" ? "danger" : "warning"}>{d.status}</Pill>
                    </div>
                    {d.proof_url && (
                      <button onClick={() => openDoc("funding-proofs", d.proof_url)} className="text-xs text-accent-blue mt-1 inline-flex items-center gap-1"><FileText className="h-3 w-3" />View payment proof</button>
                    )}
                    {d.status === "pending" && (
                      <div className="flex gap-1 justify-end mt-2 flex-wrap">
                        <button className={btnGhost} onClick={() => act(() => fnFund({ data: { id: d.id, decision: "approved" } }), "Deposit approved & credited")}><Check className="h-3.5 w-3.5 text-emerald-400" />Approve & credit</button>
                        <button className={btnGhost} onClick={() => { const notes = prompt("Reason:") ?? undefined; act(() => fnFund({ data: { id: d.id, decision: "rejected", notes } }), "Deposit rejected"); }}><X className="h-3.5 w-3.5 text-red-400" />Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <button onClick={async () => {
                  const v = prompt("Manual deposit amount (USD):"); if (!v) return;
                  const reason = prompt("Note / source:") ?? "manual deposit";
                  act(() => fnAdjust({ data: { user_id: id, delta: Number(v), reason: `Manual deposit: ${reason}` } }), "Account credited");
                }} className={btnPrimary}><Plus className="h-3.5 w-3.5" />Manual deposit credit</button>
              </div>
            </Panel>
          )}

          {tab === "withdrawals" && (
            <Panel title="Withdrawals">
              {funding.filter(f => f.request_type === "withdrawal").length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">No withdrawals.</div>}
              <div className="space-y-2">
                {funding.filter(f => f.request_type === "withdrawal").map(w => (
                  <div key={w.id} className="border border-border rounded-md p-3 text-sm">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <div className="font-medium">{moneyc(Number(w.amount))} <span className="text-xs text-muted-foreground">· {w.payment_method}</span></div>
                        <div className="text-[11px] font-mono text-muted-foreground">{new Date(w.created_at).toLocaleString()} · stage {w.workflow_stage ?? w.status}</div>
                        {w.destination_address && <div className="text-[11px] font-mono break-all text-muted-foreground">→ {w.destination_address}</div>}
                      </div>
                      <Pill tone={w.status === "approved" ? "success" : w.status === "rejected" ? "danger" : "warning"}>{w.status}</Pill>
                    </div>
                    <div className="flex gap-1 justify-end mt-2 flex-wrap">
                      {(w.workflow_stage === "pending" || w.workflow_stage === "compliance_review" || w.status === "pending") && (
                        <>
                          <button className={btnGhost} onClick={() => act(() => fnAdvFund({ data: { id: w.id, action: "finance_approve" } }), "Withdrawal approved (debited)")}><Check className="h-3.5 w-3.5 text-emerald-400" />Approve</button>
                          <button className={btnGhost} onClick={() => { const notes = prompt("Reason:") ?? undefined; act(() => fnAdvFund({ data: { id: w.id, action: "finance_reject", notes } }), "Withdrawal rejected"); }}><X className="h-3.5 w-3.5 text-red-400" />Reject</button>
                        </>
                      )}
                      {w.workflow_stage === "approved" && (
                        <button className={btnGhost} onClick={() => { const ref = prompt("Payment reference / tx hash:") ?? undefined; act(() => fnAdvFund({ data: { id: w.id, action: "mark_sent", notes: ref } }), "Marked sent"); }}>Mark sent</button>
                      )}
                      {(w.workflow_stage === "approved" || w.workflow_stage === "sent") && (
                        <button className={btnGhost} onClick={() => { const notes = prompt("Completion note:") ?? undefined; act(() => fnAdvFund({ data: { id: w.id, action: "mark_completed", notes } }), "Withdrawal completed"); }}>Mark completed</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {tab === "kyc" && (
            <Panel title="KYC Submissions">
              {kycs.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">No KYC submissions.</div>}
              <div className="space-y-3">
                {kycs.map(k => (
                  <div key={k.id} className="border border-border rounded-md p-3 text-sm">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                      <div>
                        <div className="font-medium">{k.first_name} {k.last_name} <span className="text-xs text-muted-foreground">· {k.nationality ?? "—"}</span></div>
                        <div className="text-[11px] font-mono text-muted-foreground">{k.document_type} · submitted {new Date(k.submitted_at).toLocaleString()}</div>
                      </div>
                      <Pill tone={k.status === "approved" ? "success" : k.status === "rejected" ? "danger" : "warning"}>{k.status}</Pill>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {k.document_url && <button onClick={() => openDoc("kyc-documents", k.document_url)} className="text-xs text-accent-blue inline-flex items-center gap-1"><FileText className="h-3 w-3" />Document</button>}
                      {k.selfie_url && <button onClick={() => openDoc("kyc-documents", k.selfie_url)} className="text-xs text-accent-blue inline-flex items-center gap-1"><FileText className="h-3 w-3" />Selfie</button>}
                    </div>
                    {k.review_notes && <div className="text-xs p-2 mb-2 rounded border border-border bg-muted/20">Notes: {k.review_notes}</div>}
                    {k.status === "pending" && (
                      <div className="flex gap-1 justify-end flex-wrap">
                        <button className={btnGhost} onClick={() => { const notes = prompt("Review note (optional):") ?? undefined; act(() => fnKyc({ data: { id: k.id, decision: "approved", notes } }), "KYC approved"); }}><Check className="h-3.5 w-3.5 text-emerald-400" />Approve</button>
                        <button className={btnGhost} onClick={() => { const notes = prompt("What info is needed?") ?? undefined; act(() => fnKyc({ data: { id: k.id, decision: "info_requested", notes } }), "Info requested"); }}><FileText className="h-3.5 w-3.5 text-yellow-400" />Request info</button>
                        <button className={btnGhost} onClick={() => { const notes = prompt("Rejection reason:") ?? undefined; act(() => fnKyc({ data: { id: k.id, decision: "rejected", notes } }), "KYC rejected"); }}><X className="h-3.5 w-3.5 text-red-400" />Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {tab === "referrals" && (
            <>
              <Panel title="Referral Performance">
                <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                  <Stat label="Referred users" value={refs.length} />
                  <Stat label="Commissions earned" value={moneyc(totalRefEarnings)} />
                  <Stat label="Pending commissions" value={moneyc(refRewards.filter(c => c.status !== "paid").reduce((s, c) => s + Number(c.amount ?? 0), 0))} />
                </div>
                <div className="text-[10px] font-mono tracking-[0.25em] text-muted-foreground mb-2">REFERRED USERS</div>
                {refs.length === 0 && <div className="text-sm text-muted-foreground py-2">No referrals yet.</div>}
                <ul className="space-y-1">
                  {refs.map(r => (
                    <li key={r.id} className="flex items-center justify-between text-sm border-b border-border/40 py-1">
                      <span>{r.referred?.display_name ?? r.referred?.email ?? r.referred_user_id}</span>
                      <span className="text-[11px] font-mono text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-[10px] font-mono tracking-[0.25em] text-muted-foreground mt-4 mb-2">RECENT COMMISSIONS</div>
                {refRewards.length === 0 && <div className="text-sm text-muted-foreground py-2">None yet.</div>}
                <ul className="space-y-1">
                  {refRewards.map(c => (
                    <li key={c.id} className="flex items-center justify-between text-sm border-b border-border/40 py-1">
                      <span className="font-mono text-xs">{c.event_type} L{c.level}</span>
                      <span className="font-mono">{moneyc(Number(c.amount))} <Pill tone={c.status === "paid" ? "success" : "warning"}>{c.status}</Pill></span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </>
          )}

          {tab === "audit" && (
            <Panel title="Audit Log (this user)">
              {audit.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">No audit events.</div>}
              <ul className="space-y-2">
                {audit.map(l => (
                  <li key={l.id} className="text-sm border border-border rounded-md px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-accent-blue">{l.action_type}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{new Date(l.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{l.entity_type} · actor {l.actor_id?.slice(0, 8)}…</div>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <div className="space-y-4">
          <StaffNotesPanel entityType="user" entityId={id} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: any; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{label}</dt>
      <dd className={`text-sm text-foreground break-words ${mono ? "font-mono text-xs" : ""}`}>{value ?? "—"}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="border border-border rounded-md p-2">
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
