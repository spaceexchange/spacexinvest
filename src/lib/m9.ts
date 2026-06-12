// Mission 9 data layer — referrals, rewards, KYC docs.
import { supabase } from "@/integrations/supabase/client";

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

// ---------- Referrals ----------
export async function getMyReferralProfile() {
  const id = await uid();
  const { data } = await supabase.from("profiles").select("referral_code, referred_by").eq("id", id).maybeSingle();
  return data;
}

export async function getMyReferrals() {
  const id = await uid();
  const { data } = await supabase
    .from("referrals")
    .select("id, code, status, created_at, referred_user_id")
    .eq("referrer_id", id)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getMyReferralRewards() {
  const id = await uid();
  const { data } = await supabase
    .from("referral_rewards")
    .select("*")
    .eq("referrer_id", id)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getMyReferralClicks() {
  const id = await uid();
  const { data } = await supabase
    .from("referral_clicks")
    .select("id, converted, created_at, referer")
    .eq("referrer_id", id)
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

export async function getMyAffiliatePayouts() {
  const id = await uid();
  const { data } = await supabase
    .from("affiliate_payouts")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function requestPayout(amount: number, method: string = "wallet") {
  const id = await uid();
  const { data, error } = await supabase
    .from("affiliate_payouts")
    .insert({ user_id: id, amount, method, status: "pending" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getReferralLeaderboard(limit = 10) {
  const { data } = await supabase
    .from("referral_rewards")
    .select("referrer_id, amount, status");
  const totals = new Map<string, number>();
  (data ?? []).forEach((r: any) => {
    if (r.status === "rejected") return;
    totals.set(r.referrer_id, (totals.get(r.referrer_id) ?? 0) + Number(r.amount));
  });
  const ranked = Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  if (!ranked.length) return [];
  const { data: profs } = await supabase
    .from("profiles")
    .select("id, display_name, first_name, last_name")
    .in("id", ranked.map((r) => r[0]));
  const pmap = new Map((profs ?? []).map((p: any) => [p.id, p]));
  return ranked.map(([id, amt], i) => {
    const p: any = pmap.get(id);
    const name = p?.display_name || [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "Anonymous";
    return { rank: i + 1, user_id: id, name, earned: amt };
  });
}

// ---------- Rewards / Points ----------
export async function getRewardLevels() {
  const { data } = await supabase.from("reward_levels").select("*").order("tier", { ascending: true });
  return data ?? [];
}

export async function getMyPoints() {
  const id = await uid();
  const { data } = await supabase.from("investor_points").select("*").eq("user_id", id).maybeSingle();
  return data ?? { user_id: id, points: 0, lifetime_points: 0, level_tier: 1, updated_at: new Date().toISOString() };
}

export async function getMyRewardLedger(limit = 25) {
  const id = await uid();
  const { data } = await supabase
    .from("reward_transactions")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

// ---------- KYC documents (multi-doc) ----------
export async function getMyKycDocs() {
  const id = await uid();
  const { data } = await supabase
    .from("kyc_documents")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function uploadKycDoc(
  docType: "passport" | "drivers_license" | "national_id" | "selfie" | "proof_of_address",
  file: File,
) {
  const id = await uid();
  const path = `${id}/${docType}-${Date.now()}-${file.name}`;
  const up = await supabase.storage.from("kyc-documents").upload(path, file, { upsert: false });
  if (up.error) throw up.error;
  const { data, error } = await supabase
    .from("kyc_documents")
    .insert({ user_id: id, doc_type: docType, storage_path: path, status: "pending" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function referralLink(code?: string | null) {
  if (typeof window === "undefined") return "";
  if (!code) return `${window.location.origin}/auth/signup`;
  return `${window.location.origin}/auth/signup?ref=${encodeURIComponent(code)}`;
}
