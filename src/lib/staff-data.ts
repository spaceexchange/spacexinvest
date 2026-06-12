// Browser-side helpers for staff notes, reconciliation, reports, security center.
import { supabase } from "@/integrations/supabase/client";

// ============ STAFF NOTES ============
export type NoteEntityType = "user" | "investment" | "funding_request" | "withdrawal" | "support_ticket" | "compliance_case" | "opportunity" | "general";

export async function listNotes(opts?: { entity_type?: string; entity_id?: string; mineOnly?: boolean }) {
  let q = supabase.from("staff_notes")
    .select("*, author:profiles!staff_notes_author_id_fkey(display_name,email)")
    .eq("archived", false)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);
  if (opts?.entity_type) q = q.eq("entity_type", opts.entity_type);
  if (opts?.entity_id) q = q.eq("entity_id", opts.entity_id);
  if (opts?.mineOnly) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) q = q.eq("author_id", user.id);
  }
  const { data } = await q;
  return data ?? [];
}

export async function createNote(input: {
  entity_type: string; entity_id?: string | null;
  title?: string; content: string; visibility?: "private" | "department" | "management";
  mentions?: string[];
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data, error } = await supabase.from("staff_notes").insert({
    author_id: user.id,
    entity_type: input.entity_type,
    entity_id: input.entity_id ?? null,
    title: input.title ?? null,
    content: input.content,
    visibility: input.visibility ?? "department",
    mentions: input.mentions ?? [],
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateNote(id: string, patch: Partial<{ title: string; content: string; visibility: string; pinned: boolean; archived: boolean }>) {
  const { error } = await supabase.from("staff_notes").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteNote(id: string) {
  const { error } = await supabase.from("staff_notes").delete().eq("id", id);
  if (error) throw error;
}

// ============ RECONCILIATION ============
export async function listReconciliation(status?: string) {
  let q = supabase.from("reconciliation_records").select("*").order("created_at", { ascending: false }).limit(200);
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return data ?? [];
}

export async function reconciliationStats() {
  const [matched, unmatched, exception, investigating, resolved] = await Promise.all([
    supabase.from("reconciliation_records").select("*", { count: "exact", head: true }).eq("status", "matched"),
    supabase.from("reconciliation_records").select("*", { count: "exact", head: true }).eq("status", "unmatched"),
    supabase.from("reconciliation_records").select("*", { count: "exact", head: true }).eq("status", "exception"),
    supabase.from("reconciliation_records").select("*", { count: "exact", head: true }).eq("status", "investigating"),
    supabase.from("reconciliation_records").select("*", { count: "exact", head: true }).eq("status", "resolved"),
  ]);
  return {
    matched: matched.count ?? 0,
    unmatched: unmatched.count ?? 0,
    exception: exception.count ?? 0,
    investigating: investigating.count ?? 0,
    resolved: resolved.count ?? 0,
  };
}

// ============ REPORTS ============
export async function listScheduledReports() {
  const { data } = await supabase.from("scheduled_reports").select("*").order("created_at", { ascending: false });
  return data ?? [];
}
export async function listReportRuns(limit = 50) {
  const { data } = await supabase.from("report_runs").select("*").order("created_at", { ascending: false }).limit(limit);
  return data ?? [];
}

export async function reportDataset(type: string, filters?: { from?: string; to?: string }) {
  const from = filters?.from;
  const to = filters?.to;
  const range = (q: any): any => {
    if (from) q = q.gte("created_at", from);
    if (to) q = q.lte("created_at", to);
    return q;
  };
  switch (type) {
    case "deposits": {
      const { data } = await range(supabase.from("funding_requests").select("id,user_id,amount,currency,payment_method,status,workflow_stage,created_at").eq("request_type", "deposit").order("created_at", { ascending: false }));
      return data ?? [];
    }
    case "withdrawals": {
      const { data } = await range(supabase.from("funding_requests").select("id,user_id,amount,currency,payment_method,status,workflow_stage,created_at").eq("request_type", "withdrawal").order("created_at", { ascending: false }));
      return data ?? [];
    }
    case "investor_balances": {
      const { data } = await supabase.from("wallets").select("user_id,currency,balance,status,updated_at").order("balance", { ascending: false });
      return data ?? [];
    }
    case "wallet_balances": {
      const { data } = await supabase.from("wallets").select("user_id,currency,balance,status,updated_at");
      return data ?? [];
    }
    case "aum":
    case "investments": {
      const { data } = await range(supabase.from("investments").select("id,investor_id,opportunity_id,amount,shares,status,approval_status,created_at"));
      return data ?? [];
    }
    case "compliance": {
      const { data } = await range(supabase.from("kyc_submissions").select("id,user_id,status,first_name,last_name,nationality,submitted_at as created_at"));
      return data ?? [];
    }
    case "audit": {
      const { data } = await range(supabase.from("audit_logs").select("id,actor_id,actor_role,action_type,entity_type,entity_id,created_at"));
      return data ?? [];
    }
    case "treasury": {
      const { data } = await supabase.from("wallet_transactions").select("id,wallet_id,transaction_type,amount,balance_after,status,reference,created_at").order("created_at", { ascending: false }).limit(2000);
      return data ?? [];
    }
    default:
      return [];
  }
}

// ============ SECURITY ============
export async function securityDashboard() {
  const since24 = new Date(Date.now() - 86400000).toISOString();
  const since7 = new Date(Date.now() - 7 * 86400000).toISOString();
  const [failedLogins, recentLogins, suspendedAccounts, mfaEnabled, totalProfiles, recentEvents, devices] = await Promise.all([
    supabase.from("login_attempts").select("*", { count: "exact", head: true }).eq("success", false).gte("attempted_at", since24),
    supabase.from("login_attempts").select("identifier,ip_address,success,attempted_at").gte("attempted_at", since7).order("attempted_at", { ascending: false }).limit(50),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("account_status", "suspended"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("two_factor_enabled", true),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("security_events").select("*, profile:profiles!security_events_user_id_fkey(display_name,email)").order("created_at", { ascending: false }).limit(50),
    supabase.from("user_devices").select("*").order("last_seen_at", { ascending: false }).limit(50),
  ]);
  // Detect high-risk: identifiers with 5+ failed attempts in last 24h
  const failGroups: Record<string, number> = {};
  (recentLogins.data ?? []).filter((r: any) => !r.success).forEach((r: any) => {
    failGroups[r.identifier] = (failGroups[r.identifier] ?? 0) + 1;
  });
  const highRiskUsers = Object.entries(failGroups).filter(([, n]) => n >= 5).map(([id, n]) => ({ identifier: id, failed: n }));
  return {
    failedLogins: failedLogins.count ?? 0,
    suspendedAccounts: suspendedAccounts.count ?? 0,
    mfaEnabled: mfaEnabled.count ?? 0,
    mfaAdoption: totalProfiles.count ? (mfaEnabled.count ?? 0) / totalProfiles.count : 0,
    recentLogins: recentLogins.data ?? [],
    recentEvents: recentEvents.data ?? [],
    devices: devices.data ?? [],
    highRiskUsers,
  };
}

export function severityFor(eventType: string): "low" | "medium" | "high" | "critical" {
  const t = (eventType ?? "").toLowerCase();
  if (t.includes("locked") || t.includes("suspend") || t.includes("breach")) return "critical";
  if (t.includes("failed") || t.includes("denied")) return "high";
  if (t.includes("password") || t.includes("role")) return "medium";
  return "low";
}
