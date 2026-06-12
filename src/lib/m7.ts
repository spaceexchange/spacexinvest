// Mission 7 + Mission 8 browser data helpers. All RLS-scoped.
import { supabase } from "@/integrations/supabase/client";

// ============== CRM ==============
export type LeadStatus = "new" | "contacted" | "qualified" | "interested" | "kyc_pending" | "verified" | "invested" | "active" | "vip" | "dormant" | "suspended" | "lost";
export type LifecycleStage = "lead" | "prospect" | "investor" | "active_investor" | "vip" | "dormant";

export async function listLeads(filter?: { status?: string; stage?: string; search?: string; assignee?: string }) {
  let q = supabase.from("crm_leads")
    .select("*, assignee:profiles!crm_leads_assigned_to_fkey(display_name,email)")
    .order("updated_at", { ascending: false }).limit(500);
  if (filter?.status) q = q.eq("status", filter.status);
  if (filter?.stage) q = q.eq("lifecycle_stage", filter.stage);
  if (filter?.assignee) q = q.eq("assigned_to", filter.assignee);
  if (filter?.search) q = q.or(`email.ilike.%${filter.search}%,full_name.ilike.%${filter.search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}
export async function createLead(input: Partial<{ email: string; full_name: string; phone: string; country: string; source: string; status: string; lifecycle_stage: string; tags: string[]; notes: string }>) {
  const { error } = await supabase.from("crm_leads").insert(input as any);
  if (error) throw error;
}
export async function updateLead(id: string, patch: any) {
  const { error } = await supabase.from("crm_leads").update(patch).eq("id", id);
  if (error) throw error;
}
export async function logLeadActivity(lead_id: string, activity_type: string, details: any = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("crm_activities").insert({ lead_id, actor_id: user?.id ?? null, activity_type, details });
  if (error) throw error;
}
export async function listLeadActivities(lead_id: string) {
  const { data } = await supabase.from("crm_activities")
    .select("*, actor:profiles!crm_activities_actor_id_fkey(display_name,email)")
    .eq("lead_id", lead_id).order("created_at", { ascending: false });
  return data ?? [];
}

// ============== ANNOUNCEMENTS ==============
export async function listAnnouncements(status?: string) {
  let q = supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(200);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}
export async function publishedAnnouncements() {
  const { data } = await supabase.from("announcements").select("*").eq("status", "published").order("published_at", { ascending: false }).limit(50);
  return data ?? [];
}
export async function createAnnouncement(input: any) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("announcements").insert({ ...input, created_by: user?.id });
  if (error) throw error;
}
export async function updateAnnouncement(id: string, patch: any) {
  const { error } = await supabase.from("announcements").update(patch).eq("id", id);
  if (error) throw error;
}
export async function publishAnnouncement(id: string) {
  const { error } = await supabase.from("announcements").update({ status: "published", published_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

// ============== MESSAGING ==============
export async function myChannels() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase.from("channel_members")
    .select("channel:messaging_channels(*), last_read_at")
    .eq("user_id", user.id);
  return (data ?? []).map((r: any) => ({ ...r.channel, last_read_at: r.last_read_at })).filter(Boolean);
}
export async function createChannel(input: { name?: string; channel_type: string; description?: string; member_ids?: string[] }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data: ch, error } = await supabase.from("messaging_channels").insert({
    name: input.name ?? null, channel_type: input.channel_type, description: input.description ?? null, created_by: user.id,
  }).select().single();
  if (error) throw error;
  const members = Array.from(new Set([user.id, ...(input.member_ids ?? [])]));
  await supabase.from("channel_members").insert(members.map((uid) => ({ channel_id: ch.id, user_id: uid, role: uid === user.id ? "owner" : "member" })));
  return ch;
}
export async function channelMessages(channel_id: string, limit = 200) {
  const { data } = await supabase.from("channel_messages")
    .select("*, sender:profiles!channel_messages_sender_id_fkey(display_name,email,id)")
    .eq("channel_id", channel_id).order("created_at", { ascending: true }).limit(limit);
  return data ?? [];
}
export async function sendChannelMessage(channel_id: string, content: string, attachments: any[] = []) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const mentions = Array.from(content.matchAll(/@([a-zA-Z0-9_.-]+)/g)).map((m) => m[1]);
  const { error } = await supabase.from("channel_messages").insert({ channel_id, sender_id: user.id, content, attachments, mentions });
  if (error) throw error;
}
export async function markChannelRead(channel_id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("channel_members").update({ last_read_at: new Date().toISOString() }).eq("channel_id", channel_id).eq("user_id", user.id);
}
export async function toggleReaction(message_id: string, emoji: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: existing } = await supabase.from("message_reactions").select("*").eq("message_id", message_id).eq("user_id", user.id).eq("emoji", emoji).maybeSingle();
  if (existing) await supabase.from("message_reactions").delete().eq("message_id", message_id).eq("user_id", user.id).eq("emoji", emoji);
  else await supabase.from("message_reactions").insert({ message_id, user_id: user.id, emoji });
}
export async function staffDirectory() {
  // Anyone with non-investor role
  const { data: roleRows } = await supabase.from("user_roles").select("user_id,role").in("role", ["admin","super_admin","support","compliance","finance","employee"]);
  const ids = Array.from(new Set((roleRows ?? []).map((r: any) => r.user_id)));
  if (ids.length === 0) return [];
  const { data: profs } = await supabase.from("profiles").select("id,display_name,email").in("id", ids);
  return profs ?? [];
}

// ============== NOTIFICATIONS V2 ==============
export async function notificationPreferences() {
  const { data } = await supabase.from("notification_preferences").select("*");
  return data ?? [];
}
export async function setNotificationPreference(category: string, patch: { in_app?: boolean; email?: boolean; push?: boolean }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { error } = await supabase.from("notification_preferences").upsert({ user_id: user.id, category, ...patch }, { onConflict: "user_id,category" });
  if (error) throw error;
}
export async function archiveNotification(id: string) {
  await supabase.from("notifications").update({ archived: true }).eq("id", id);
}
export async function bulkMarkRead(ids: string[]) {
  if (!ids.length) return;
  await supabase.from("notifications").update({ read_status: true }).in("id", ids);
}

// ============== ACTIVITY TIMELINE ==============
export async function activityFeed(filter?: { actor?: string; entity_type?: string; since?: string }) {
  let q = supabase.from("audit_logs")
    .select("id,actor_id,actor_role,action_type,entity_type,entity_id,old_value,new_value,created_at")
    .order("created_at", { ascending: false }).limit(500);
  if (filter?.actor) q = q.eq("actor_id", filter.actor);
  if (filter?.entity_type) q = q.eq("entity_type", filter.entity_type);
  if (filter?.since) q = q.gte("created_at", filter.since);
  const { data, error } = await q;
  if (error) { console.error("activityFeed", error); return []; }
  const rows = data ?? [];
  const ids = Array.from(new Set(rows.map((r: any) => r.actor_id).filter(Boolean)));
  let map = new Map<string, any>();
  if (ids.length) {
    const { data: profs } = await supabase.from("profiles").select("id,display_name,email").in("id", ids);
    map = new Map((profs ?? []).map((p: any) => [p.id, p]));
  }
  return rows.map((r: any) => ({ ...r, action: r.action_type, actor: r.actor_id ? map.get(r.actor_id) ?? null : null }));
}

// ============== M8: COMPLIANCE CASES ==============
export async function listComplianceCases(status?: string) {
  let q = supabase.from("compliance_cases")
    .select("*, subject:profiles!compliance_cases_subject_user_id_fkey(display_name,email), assignee:profiles!compliance_cases_assigned_to_fkey(display_name,email)")
    .order("created_at", { ascending: false }).limit(200);
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return data ?? [];
}
export async function upsertComplianceCase(input: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (input.id) {
    const { id, ...patch } = input;
    const { error } = await supabase.from("compliance_cases").update(patch).eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("compliance_cases").insert({ ...input, opened_by: user?.id });
    if (error) throw error;
  }
}

// ============== M8: AUTOMATION ==============
export async function listAutomationRules() {
  const { data } = await supabase.from("automation_rules").select("*").order("created_at", { ascending: false });
  return data ?? [];
}
export async function upsertAutomationRule(input: any) {
  if (input.id) {
    const { id, ...patch } = input;
    const { error } = await supabase.from("automation_rules").update(patch).eq("id", id);
    if (error) throw error;
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("automation_rules").insert({ ...input, created_by: user?.id });
    if (error) throw error;
  }
}

// ============== M8: SEGMENTS ==============
export async function listSegments() {
  const { data } = await supabase.from("investor_segments").select("*").order("created_at", { ascending: false });
  return data ?? [];
}
export async function upsertSegment(input: any) {
  if (input.id) {
    const { id, ...patch } = input;
    const { error } = await supabase.from("investor_segments").update(patch).eq("id", id);
    if (error) throw error;
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("investor_segments").insert({ ...input, created_by: user?.id });
    if (error) throw error;
  }
}

// Compute segment dynamically from a stored jsonb definition shape.
// definition: { kyc_status?: 'approved', min_invested?: number, country?: string, dormant_days?: number, vip?: boolean }
export async function computeSegmentMembers(def: any): Promise<string[]> {
  let q: any = supabase.from("profiles").select("id,kyc_status,country");
  if (def?.kyc_status) q = q.eq("kyc_status", def.kyc_status);
  if (def?.country) q = q.eq("country", def.country);
  const { data } = await q;
  return (data ?? []).map((r: any) => r.id);
}

// ============== M8: OPS TASKS ==============
export async function listOpsTasks(filter?: { assignee?: string; status?: string }) {
  let q = supabase.from("ops_tasks")
    .select("*, assignee:profiles!ops_tasks_assignee_id_fkey(display_name,email), creator:profiles!ops_tasks_created_by_fkey(display_name,email)")
    .order("due_date", { ascending: true, nullsFirst: false }).limit(500);
  if (filter?.assignee) q = q.eq("assignee_id", filter.assignee);
  if (filter?.status) q = q.eq("status", filter.status);
  const { data } = await q;
  return data ?? [];
}
export async function upsertOpsTask(input: any) {
  if (input.id) {
    const { id, ...patch } = input;
    const { error } = await supabase.from("ops_tasks").update(patch).eq("id", id);
    if (error) throw error;
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("ops_tasks").insert({ ...input, created_by: user?.id });
    if (error) throw error;
  }
}

// ============== M8: EXECUTIVE ANALYTICS ==============
export async function executiveDashboard() {
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
  const [
    investors, kycApproved, investments, opportunities,
    wallets, deposits, withdrawals, tickets, leads,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("kyc_status", "verified"),
    supabase.from("investments").select("amount,approval_status,created_at"),
    supabase.from("investment_opportunities").select("status,target_amount,raised_amount"),
    supabase.from("wallets").select("balance,currency"),
    supabase.from("funding_requests").select("amount,status,created_at").eq("request_type", "deposit").gte("created_at", since30),
    supabase.from("funding_requests").select("amount,status,created_at").eq("request_type", "withdrawal").gte("created_at", since30),
    supabase.from("support_tickets").select("status"),
    supabase.from("crm_leads").select("status,lifecycle_stage,created_at"),
  ]);
  const invs = investments.data ?? [];
  const totalInvested = invs.filter((i: any) => i.approval_status === "approved").reduce((s: number, i: any) => s + Number(i.amount), 0);
  const aum = (wallets.data ?? []).filter((w: any) => w.currency === "USD").reduce((s: number, w: any) => s + Number(w.balance), 0) + totalInvested;
  return {
    investorCount: investors.count ?? 0,
    kycApproved: kycApproved.count ?? 0,
    aum,
    totalInvested,
    opportunityCount: (opportunities.data ?? []).length,
    openTickets: (tickets.data ?? []).filter((t: any) => t.status === "open").length,
    leadCount: (leads.data ?? []).length,
    convertedLeads: (leads.data ?? []).filter((l: any) => ["invested","active","vip"].includes(l.status)).length,
    deposits30d: (deposits.data ?? []).reduce((s: number, d: any) => s + Number(d.amount), 0),
    withdrawals30d: (withdrawals.data ?? []).reduce((s: number, d: any) => s + Number(d.amount), 0),
  };
}
