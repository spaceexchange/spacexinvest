// Browser-side query helpers for the Mission 5/6 operational schema.
// All reads are protected by RLS; writes return data + error.
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export type FundingType = "deposit" | "withdrawal";
export type FundingMethod = "wire" | "card" | "crypto" | "ach";
export type CryptoAsset = "BTC" | "ETH" | "USDT" | "USDC";
export type CryptoNetwork = "BTC" | "ETH" | "TRON" | "SOLANA" | "POLYGON";

export const money = (n: number, frac = 0) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: frac }).format(n);
export const moneyc = (n: number) => money(n, 2);

export async function getMyWallet() {
  const { data } = await supabase.from("wallets").select("*").eq("currency", "USD").maybeSingle();
  return data;
}

export async function getMyAllWallets() {
  const { data } = await supabase.from("wallets").select("*").order("currency");
  return data ?? [];
}

export async function getMyWalletTransactions(limit = 50) {
  const w = await getMyWallet();
  if (!w) return [];
  const { data } = await supabase
    .from("wallet_transactions").select("*")
    .eq("wallet_id", w.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getMyInvestments() {
  const { data } = await supabase.from("investments")
    .select("*, opportunity:investment_opportunities(id,title,category,price_per_share,status)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getOpportunities() {
  const { data } = await supabase.from("investment_opportunities")
    .select("*").in("status", ["open", "funded", "closed"])
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function reserveAllocation(opportunityId: string, amount: number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data: opp } = await supabase.from("investment_opportunities").select("price_per_share").eq("id", opportunityId).single();
  const pps = Number(opp?.price_per_share ?? 1) || 1;
  const shares = amount / pps;
  const { error } = await supabase.from("investments").insert({
    investor_id: user.id, opportunity_id: opportunityId, amount, shares,
    status: "pending", approval_status: "pending",
  });
  if (error) throw error;
}

// ============== FUNDING ==============
export async function getMyFundingRequests() {
  const { data } = await supabase.from("funding_requests").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export async function createBankDeposit(input: {
  amount: number; sending_bank: string; reference_number: string; transfer_date: string;
  notes?: string; proof_url?: string | null;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { error } = await supabase.from("funding_requests").insert({
    user_id: user.id, request_type: "deposit", amount: input.amount, currency: "USD", asset: "USD",
    payment_method: "wire", status: "pending", workflow_stage: "pending",
    reference_number: input.reference_number, proof_url: input.proof_url ?? null,
    details: { sending_bank: input.sending_bank, transfer_date: input.transfer_date, notes: input.notes ?? "" },
  });
  if (error) throw error;
}

export async function createBankWithdrawal(input: {
  amount: number; destination_bank: string; account_holder: string; account_number: string;
  swift?: string; notes?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { error } = await supabase.from("funding_requests").insert({
    user_id: user.id, request_type: "withdrawal", amount: input.amount, currency: "USD", asset: "USD",
    payment_method: "wire", status: "pending", workflow_stage: "compliance_review",
    details: {
      destination_bank: input.destination_bank, account_holder: input.account_holder,
      account_number: input.account_number, swift: input.swift ?? "", notes: input.notes ?? "",
    },
  });
  if (error) throw error;
}

export async function createCryptoDeposit(input: {
  amount: number; asset: CryptoAsset; network: CryptoNetwork; tx_hash: string; notes?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { error } = await supabase.from("funding_requests").insert({
    user_id: user.id, request_type: "deposit", amount: input.amount, currency: input.asset, asset: input.asset,
    network: input.network, payment_method: "crypto", status: "pending", workflow_stage: "pending",
    tx_hash: input.tx_hash, details: { notes: input.notes ?? "" },
  });
  if (error) throw error;
}

export async function createCryptoWithdrawal(input: {
  amount: number; asset: CryptoAsset; network: CryptoNetwork; destination_address: string; memo?: string; notes?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { error } = await supabase.from("funding_requests").insert({
    user_id: user.id, request_type: "withdrawal", amount: input.amount, currency: input.asset, asset: input.asset,
    network: input.network, payment_method: "crypto", status: "pending", workflow_stage: "compliance_review",
    destination_address: input.destination_address,
    details: { memo: input.memo ?? "", notes: input.notes ?? "" },
  });
  if (error) throw error;
}

export async function getMyCryptoAddresses() {
  const { data, error } = await supabase.from("crypto_deposit_addresses").select("*").eq("is_active", true);

  console.log("CRYPTO DATA:", data);
  console.log("CRYPTO ERROR:", error);
  return data ?? [];
}

// ============== KYC ==============
export async function getMyKyc() {
  const { data } = await supabase.from("kyc_submissions").select("*").order("submitted_at", { ascending: false }).limit(1).maybeSingle();
  return data;
}

export async function submitKyc(input: {
  first_name: string; last_name: string; nationality: string; address: string;
  date_of_birth?: string | null; document_type: string; document_url?: string | null; selfie_url?: string | null;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const existing = await getMyKyc();
  const payload = { user_id: user.id, status: "pending" as const, ...input };
  if (existing && ["rejected", "info_requested", "pending"].includes(existing.status)) {
    const { error } = await supabase.from("kyc_submissions").update(payload).eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("kyc_submissions").insert(payload);
    if (error) throw error;
  }
}

// ============== DOCS ==============
export async function getMyDocuments() {
  const { data } = await supabase.from("documents").select("*").order("uploaded_at", { ascending: false });
  return data ?? [];
}

export async function uploadDocument(file: File, type: string, bucket = "investor-documents") {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const path = `${user.id}/${Date.now()}-${file.name}`;
  const up = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (up.error) throw up.error;
  const { error } = await supabase.from("documents").insert({
    user_id: user.id, document_name: file.name, document_type: type, file_url: path, bucket, uploaded_by: user.id, size_bytes: file.size,
  });
  if (error) throw error;
}

export async function uploadProof(file: File, bucket = "funding-proofs") {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const path = `${user.id}/${Date.now()}-${file.name}`;
  const up = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (up.error) throw up.error;
  return path;
}

export async function getSignedDocumentUrl(bucket: string, path: string) {
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 300);
  return data?.signedUrl;
}

// ============== NOTIFICATIONS ==============
export async function getMyNotifications(limit = 50) {
  const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(limit);
  return data ?? [];
}
export async function markNotificationRead(id: string) {
  await supabase.from("notifications").update({ read_status: true }).eq("id", id);
}
export async function markAllNotificationsRead() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("notifications").update({ read_status: true }).eq("user_id", user.id).eq("read_status", false);
}

// ============== SUPPORT ==============
export async function getMyTickets() {
  const { data } = await supabase.from("support_tickets").select("*").order("updated_at", { ascending: false });
  return data ?? [];
}

export async function createTicket(input: { subject: string; category?: string; priority?: string; first_message: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data: t, error } = await supabase.from("support_tickets").insert({
    user_id: user.id, subject: input.subject, category: input.category ?? "general", priority: input.priority ?? "normal", status: "open",
  }).select().single();
  if (error) throw error;
  await supabase.from("support_messages").insert({ ticket_id: t.id, sender_id: user.id, message: input.first_message });
  return t;
}

export async function getTicketMessages(ticketId: string) {
  const { data } = await supabase.from("support_messages").select("*").eq("ticket_id", ticketId).order("created_at", { ascending: true });
  return data ?? [];
}

export async function postTicketMessage(ticketId: string, message: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  await supabase.from("support_messages").insert({ ticket_id: ticketId, sender_id: user.id, message });
}

// ============== STAFF-WIDE READS ==============
export async function staffGetAllFundingRequests() {
  const { data } = await supabase.from("funding_requests").select("*, profile:profiles!funding_requests_user_id_fkey(display_name,email)").order("created_at", { ascending: false }).limit(500);
  return data ?? [];
}
export async function staffGetAllKyc() {
  const { data } = await supabase.from("kyc_submissions").select("*, profile:profiles!kyc_submissions_user_id_fkey(display_name,email)").order("submitted_at", { ascending: false }).limit(200);
  return data ?? [];
}
export async function staffGetAllInvestments() {
  const { data } = await supabase.from("investments").select("*, opportunity:investment_opportunities(title), profile:profiles!investments_investor_id_fkey(display_name,email)").order("created_at", { ascending: false }).limit(200);
  return data ?? [];
}
export async function staffGetAllTickets() {
  const { data } = await supabase.from("support_tickets").select("*, profile:profiles!support_tickets_user_id_fkey(display_name,email)").order("updated_at", { ascending: false }).limit(200);
  return data ?? [];
}
export async function staffGetAllWallets() {
  const { data } = await supabase.from("wallets").select("*, profile:profiles!wallets_user_id_fkey(display_name,email)").order("balance", { ascending: false }).limit(200);
  return data ?? [];
}

export async function getCount(table: string, filters?: Record<string, string>) {
  let q = supabase.from(table as any).select("*", { count: "exact", head: true });
  for (const [k, v] of Object.entries(filters ?? {})) q = q.eq(k, v);
  const { count } = await q;
  return count ?? 0;
}

export async function staffGetAllUsers(limit = 200) {
  const { data } = await supabase.from("profiles")
    .select("id,email,display_name,first_name,last_name,country,kyc_status,created_at,phone,referral_code")
    .order("created_at", { ascending: false }).limit(limit);
  return data ?? [];
}

export async function staffGetUserRoles(userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r: any) => r.role as string);
}

export async function staffGetAllOpportunities() {
  const { data } = await supabase.from("investment_opportunities").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export async function staffGetAllDocuments(limit = 200) {
  const { data } = await supabase.from("documents")
    .select("*, profile:profiles!documents_user_id_fkey(display_name,email)")
    .order("uploaded_at", { ascending: false }).limit(limit);
  return data ?? [];
}

export async function staffGetAuditLogs(limit = 200) {
  const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(limit);
  return data ?? [];
}

export async function staffGetTicketMessages(ticketId: string) {
  const { data } = await supabase.from("support_messages").select("*").eq("ticket_id", ticketId).order("created_at", { ascending: true });
  return data ?? [];
}

export async function staffGetWalletTransactions(limit = 200) {
  const { data } = await supabase.from("wallet_transactions").select("*").order("created_at", { ascending: false }).limit(limit);
  return data ?? [];
}

export async function staffGetSecurityEvents(limit = 100) {
  const { data } = await supabase.from("security_events" as any)
    .select("*, profile:profiles!security_events_user_id_fkey(display_name,email)")
    .order("created_at", { ascending: false }).limit(limit);
  return data ?? [];
}

export async function staffGetDashboardStats() {
  const [users, investors, opps, fundingPending, kycPending, ticketsOpen, walletsAgg, securityHigh] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("kyc_status", "verified"),
    supabase.from("investment_opportunities").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("funding_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("kyc_submissions").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("support_tickets").select("*", { count: "exact", head: true }).in("status", ["open", "pending", "escalated"]),
    supabase.from("wallets").select("balance,currency"),
    supabase.from("security_events").select("*", { count: "exact", head: true }),
  ]);
  const aumRes = await supabase.from("investments").select("amount").eq("approval_status", "approved");
  return {
    totalUsers: users.count ?? 0,
    verifiedInvestors: investors.count ?? 0,
    openOpportunities: opps.count ?? 0,
    pendingFunding: fundingPending.count ?? 0,
    pendingKyc: kycPending.count ?? 0,
    openTickets: ticketsOpen.count ?? 0,
    walletBalances: (walletsAgg.data ?? []).filter((w: any) => w.currency === "USD").reduce((s: number, w: any) => s + Number(w.balance ?? 0), 0),
    aum: (aumRes.data ?? []).reduce((s: number, i: any) => s + Number(i.amount ?? 0), 0),
    securityHigh: securityHigh.count ?? 0,
  };
}

export async function staffGetCryptoAddresses(userId?: string) {
  let q = supabase.from("crypto_deposit_addresses").select("*, profile:profiles!crypto_deposit_addresses_user_id_fkey(display_name,email)").order("created_at", { ascending: false });
  if (userId) q = q.eq("user_id", userId);
  const { data } = await q;
  return data ?? [];
}

export async function financeGetTreasuryStats() {
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
  const since7 = new Date(Date.now() - 7 * 86400000).toISOString();
  const since1 = new Date(Date.now() - 86400000).toISOString();
  const [wallets, deposits30, withdraw30, pendingDeps, pendingWds, complianceQueue, completed, txDaily, txWeekly, aum] = await Promise.all([
    supabase.from("wallets").select("balance,currency,status"),
    supabase.from("funding_requests").select("amount,created_at,status").eq("request_type", "deposit").eq("status", "approved").gte("created_at", since30),
    supabase.from("funding_requests").select("amount,created_at,status").eq("request_type", "withdrawal").eq("status", "approved").gte("created_at", since30),
    supabase.from("funding_requests").select("amount").eq("request_type", "deposit").eq("status", "pending"),
    supabase.from("funding_requests").select("amount").eq("request_type", "withdrawal").in("workflow_stage", ["compliance_review", "finance_review"]),
    supabase.from("funding_requests").select("*", { count: "exact", head: true }).eq("workflow_stage", "compliance_review"),
    supabase.from("funding_requests").select("*", { count: "exact", head: true }).eq("workflow_stage", "completed"),
    supabase.from("wallet_transactions").select("amount,transaction_type").gte("created_at", since1),
    supabase.from("wallet_transactions").select("amount,transaction_type").gte("created_at", since7),
    supabase.from("investments").select("amount").eq("approval_status", "approved"),
  ]);
  const sumByType = (rows: any[] | null, types: string[]) =>
    (rows ?? []).filter((r: any) => types.includes(r.transaction_type)).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
  return {
    totalAssets: (wallets.data ?? []).filter((w: any) => w.currency === "USD").reduce((s: number, w: any) => s + Number(w.balance ?? 0), 0),
    cryptoAssets: (wallets.data ?? []).filter((w: any) => w.currency !== "USD"),
    aum: (aum.data ?? []).reduce((s: number, r: any) => s + Number(r.amount), 0),
    pendingDeposits: (pendingDeps.data ?? []).reduce((s: number, r: any) => s + Number(r.amount), 0),
    pendingWithdrawals: (pendingWds.data ?? []).reduce((s: number, r: any) => s + Number(r.amount), 0),
    complianceQueue: complianceQueue.count ?? 0,
    completedCount: completed.count ?? 0,
    volumeDaily: sumByType(txDaily.data, ["deposit", "withdrawal"]),
    volumeWeekly: sumByType(txWeekly.data, ["deposit", "withdrawal"]),
    volumeMonthly: (deposits30.data ?? []).reduce((s: number, r: any) => s + Number(r.amount), 0)
      + (withdraw30.data ?? []).reduce((s: number, r: any) => s + Number(r.amount), 0),
    depositsMonthly: (deposits30.data ?? []).reduce((s: number, r: any) => s + Number(r.amount), 0),
    withdrawalsMonthly: (withdraw30.data ?? []).reduce((s: number, r: any) => s + Number(r.amount), 0),
    walletCount: (wallets.data ?? []).length,
    frozenWallets: (wallets.data ?? []).filter((w: any) => w.status === "frozen").length,
  };
}

// ============== REALTIME HOOK ==============
export function useRealtimeChannel(
  channelName: string,
  configs: Array<{ table: string; filter?: string; event?: "INSERT" | "UPDATE" | "DELETE" | "*" }>,
  onChange: () => void,
) {
  useEffect(() => {
    const ch = supabase.channel(channelName);
    configs.forEach((c) =>
      ch.on(
        "postgres_changes" as any,
        { event: c.event ?? "*", schema: "public", table: c.table, ...(c.filter ? { filter: c.filter } : {}) },
        () => onChange(),
      ),
    );
    ch.subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName]);
}
