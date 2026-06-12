// Mission 10 — Affiliate & Commission data layer.
import { supabase } from "@/integrations/supabase/client";

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export async function getMyCommissions() {
  const id = await uid();
  const { data } = await supabase.from("commissions" as any).select("*").eq("beneficiary_id", id).order("created_at", { ascending: false });
  return (data ?? []) as any[];
}

export async function getMyCommissionSummary() {
  const rows = await getMyCommissions();
  const sum = (s: string) => rows.filter((r) => r.status === s).reduce((a, b) => a + Number(b.amount), 0);
  return {
    total: rows.reduce((a, b) => a + Number(b.amount), 0),
    pending: sum("pending"),
    approved: sum("approved"),
    paid: sum("paid"),
    count: rows.length,
  };
}

export async function getMyDownline() {
  const id = await uid();
  // Level 1
  const { data: l1 } = await supabase.from("profiles").select("id, display_name, email, created_at, referred_by").eq("referred_by", id);
  const l1Ids = (l1 ?? []).map((p: any) => p.id);
  let l2: any[] = [];
  if (l1Ids.length) {
    const { data } = await supabase.from("profiles").select("id, display_name, email, created_at, referred_by").in("referred_by", l1Ids);
    l2 = data ?? [];
  }
  const l2Ids = l2.map((p: any) => p.id);
  let l3: any[] = [];
  if (l2Ids.length) {
    const { data } = await supabase.from("profiles").select("id, display_name, email, created_at, referred_by").in("referred_by", l2Ids);
    l3 = data ?? [];
  }
  return { l1: l1 ?? [], l2, l3 };
}

export async function getCommissionRules() {
  const { data } = await supabase.from("commission_rules" as any).select("*").order("event_type").order("level");
  return (data ?? []) as any[];
}

// Admin
export async function adminListCommissions(status?: string) {
  let q = supabase.from("commissions" as any).select("*").order("created_at", { ascending: false }).limit(500);
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return (data ?? []) as any[];
}

export async function adminApproveCommission(id: string) {
  const { error } = await supabase.from("commissions" as any).update({ status: "approved" }).eq("id", id);
  if (error) throw error;
}
export async function adminRejectCommission(id: string) {
  const { error } = await supabase.from("commissions" as any).update({ status: "rejected" }).eq("id", id);
  if (error) throw error;
}
export async function adminPayCommission(id: string) {
  const { error } = await supabase.rpc("pay_commission" as any, { _commission_id: id } as any);
  if (error) throw error;
}

export async function adminUpsertRule(rule: any) {
  if (rule.id) {
    const { id, ...rest } = rule;
    const { error } = await supabase.from("commission_rules" as any).update(rest).eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("commission_rules" as any).insert(rule);
    if (error) throw error;
  }
}

export async function adminToggleRule(id: string, active: boolean) {
  const { error } = await supabase.from("commission_rules" as any).update({ active }).eq("id", id);
  if (error) throw error;
}

export async function getLeaderboard(limit = 25) {
  const { data } = await supabase.from("commissions" as any).select("beneficiary_id, amount, status");
  const totals = new Map<string, number>();
  ((data as any[]) ?? []).forEach((r: any) => {
    if (r.status === "rejected") return;
    totals.set(r.beneficiary_id, (totals.get(r.beneficiary_id) ?? 0) + Number(r.amount));
  });
  const ranked = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit);
  if (!ranked.length) return [];
  const ids = ranked.map(([id]) => id);
  const { data: profiles } = await supabase.from("profiles").select("id, display_name, email").in("id", ids);
  const map = new Map((profiles ?? []).map((p: any) => [p.id, p]));
  return ranked.map(([id, total], i) => ({ rank: i + 1, user: map.get(id), total }));
}
