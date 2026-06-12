// Privileged server functions added in Mission 6B/C/D.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireRole(ctx: { supabase: any; userId: string }, roles: string[]) {
  for (const r of roles) {
    const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: r });
    if (data === true) return r;
  }
  throw new Error("Forbidden");
}
async function audit(adminSb: any, actor: string, role: string, action: string, entity: string, entityId: string | null, oldV: any, newV: any) {
  await adminSb.from("audit_logs").insert({
    actor_id: actor, actor_role: role, action_type: action, entity_type: entity, entity_id: entityId,
    old_value: oldV, new_value: newV,
  });
}
async function notify(adminSb: any, userId: string, title: string, message: string, type: string, link?: string) {
  await adminSb.from("notifications").insert({ user_id: userId, title, message, notification_type: type, link });
}

// ============ OPPORTUNITY: full upsert with rich fields ============
const oppFields = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(2),
  slug: z.string().optional().nullable(),
  category: z.string().default("equity"),
  investment_type: z.string().default("shares"),
  industry: z.string().optional().nullable(),
  risk_level: z.enum(["low", "medium", "high"]).default("medium"),
  currency: z.string().default("USD"),
  short_description: z.string().optional().nullable(),
  full_description: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  minimum_investment: z.number().nonnegative(),
  maximum_investment: z.number().nullable().optional(),
  target_amount: z.number().nonnegative(),
  available_shares: z.number().nonnegative(),
  price_per_share: z.number().nonnegative(),
  expected_roi: z.number().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  open_date: z.string().nullable().optional(),
  close_date: z.string().nullable().optional(),
  status: z.enum(["draft", "pending_review", "active", "open", "paused", "closed", "fully_funded", "funded", "archived"]).default("draft"),
  featured: z.boolean().default(false),
  cover_image: z.string().nullable().optional(),
  gallery_images: z.array(z.string()).default([]),
  highlights: z.array(z.string()).default([]),
  faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
});

export const upsertOpportunityRich = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => oppFields.parse(d))
  .handler(async ({ data, context }) => {
    const role = await requireRole(context, ["admin", "super_admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const payload: any = { ...rest, created_by: context.userId };
    if (data.status === "active" || data.status === "open") payload.published_at = new Date().toISOString();

    if (id) {
      const { data: old } = await supabaseAdmin.from("investment_opportunities").select("*").eq("id", id).single();
      const { error } = await supabaseAdmin.from("investment_opportunities").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      await audit(supabaseAdmin, context.userId, role, "opportunity.update", "investment_opportunities", id, old, payload);
      return { ok: true, id };
    } else {
      const { data: row, error } = await supabaseAdmin.from("investment_opportunities").insert(payload).select().single();
      if (error) throw new Error(error.message);
      await audit(supabaseAdmin, context.userId, role, "opportunity.create", "investment_opportunities", row.id, null, payload);
      return { ok: true, id: row.id };
    }
  });

export const setOpportunityStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), status: z.string(), notes: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const role = await requireRole(context, ["admin", "super_admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: old } = await supabaseAdmin.from("investment_opportunities").select("*").eq("id", data.id).single();
    const patch: any = { status: data.status };
    if (data.status === "active" || data.status === "open") patch.published_at = new Date().toISOString();
    await supabaseAdmin.from("investment_opportunities").update(patch).eq("id", data.id);
    await audit(supabaseAdmin, context.userId, role, `opportunity.${data.status}`, "investment_opportunities", data.id, old, patch);
    return { ok: true };
  });

export const toggleOpportunityFeatured = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), featured: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const role = await requireRole(context, ["admin", "super_admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("investment_opportunities").update({ featured: data.featured }).eq("id", data.id);
    await audit(supabaseAdmin, context.userId, role, `opportunity.featured.${data.featured}`, "investment_opportunities", data.id, null, { featured: data.featured });
    return { ok: true };
  });

export const attachOpportunityDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    opportunity_id: z.string().uuid(),
    document_name: z.string(),
    document_type: z.string(),
    file_url: z.string(),
    size_bytes: z.number().optional(),
    visibility: z.enum(["investor", "staff"]).default("investor"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const role = await requireRole(context, ["admin", "super_admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("opportunity_documents").insert({ ...data, uploaded_by: context.userId, bucket: "opportunity-documents" });
    await audit(supabaseAdmin, context.userId, role, "opportunity.document.attach", "opportunity_documents", data.opportunity_id, null, data);
    return { ok: true };
  });

export const deleteOpportunityDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const role = await requireRole(context, ["admin", "super_admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: doc } = await supabaseAdmin.from("opportunity_documents").select("*").eq("id", data.id).single();
    if (doc) await supabaseAdmin.storage.from(doc.bucket).remove([doc.file_url]).catch(() => {});
    await supabaseAdmin.from("opportunity_documents").delete().eq("id", data.id);
    await audit(supabaseAdmin, context.userId, role, "opportunity.document.delete", "opportunity_documents", data.id, doc, null);
    return { ok: true };
  });

// ============ ACCOUNT CONTROLS (security center) ============
export const setAccountSuspension = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    user_id: z.string().uuid(),
    suspend: z.boolean(),
    reason: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const role = await requireRole(context, ["admin", "super_admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch = data.suspend
      ? { account_status: "suspended", suspended_at: new Date().toISOString(), suspended_reason: data.reason ?? null }
      : { account_status: "active", suspended_at: null, suspended_reason: null };
    await supabaseAdmin.from("profiles").update(patch).eq("id", data.user_id);
    // Best-effort: also ban/unban via auth admin if available
    try {
      await supabaseAdmin.auth.admin.updateUserById(data.user_id, { ban_duration: data.suspend ? "876000h" : "none" });
    } catch { /* ignore */ }
    await audit(supabaseAdmin, context.userId, role, data.suspend ? "account.suspend" : "account.unsuspend", "profiles", data.user_id, null, patch);
    await notify(supabaseAdmin, data.user_id,
      data.suspend ? "Account suspended" : "Account reactivated",
      data.reason ?? (data.suspend ? "Your account has been suspended by an administrator." : "Your account has been reactivated."),
      "security", "/account/security");
    return { ok: true };
  });

export const forcePasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ user_id: z.string().uuid(), email: z.string().email() }).parse(d))
  .handler(async ({ data, context }) => {
    const role = await requireRole(context, ["admin", "super_admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      await supabaseAdmin.auth.admin.generateLink({ type: "recovery", email: data.email });
    } catch { /* ignore */ }
    await audit(supabaseAdmin, context.userId, role, "account.force_password_reset", "profiles", data.user_id, null, { email: data.email });
    await notify(supabaseAdmin, data.user_id, "Password reset required",
      "An administrator has requested you reset your password. Check your email.", "security", "/account/security");
    return { ok: true };
  });

export const revokeUserSessions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const role = await requireRole(context, ["admin", "super_admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      // Invalidate all refresh tokens for the user
      await supabaseAdmin.auth.admin.signOut(data.user_id, "global" as any);
    } catch { /* ignore */ }
    await audit(supabaseAdmin, context.userId, role, "account.revoke_sessions", "profiles", data.user_id, null, null);
    return { ok: true };
  });

// ============ RECONCILIATION ============
export const runReconciliation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const role = await requireRole(context, ["admin", "super_admin", "finance"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Pull last 7 days approved funding requests and try matching to wallet transactions by user + amount window
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: fr } = await supabaseAdmin.from("funding_requests").select("id,user_id,amount,currency,request_type,status,created_at").gte("created_at", since).in("status", ["approved"]);
    const { data: tx } = await supabaseAdmin.from("wallet_transactions").select("id,wallet_id,amount,transaction_type,reference,created_at").gte("created_at", since);
    const { data: wallets } = await supabaseAdmin.from("wallets").select("id,user_id,currency");
    const walletByUser: Record<string, string[]> = {};
    (wallets ?? []).forEach((w: any) => { walletByUser[w.user_id] ??= []; walletByUser[w.user_id].push(w.id); });

    let matched = 0; let unmatched = 0;
    for (const f of fr ?? []) {
      const candidates = (tx ?? []).filter((t: any) =>
        walletByUser[f.user_id]?.includes(t.wallet_id)
        && Number(t.amount) === Number(f.amount)
        && (t.transaction_type === f.request_type)
      );
      const hit = candidates[0];
      const { data: existing } = await supabaseAdmin.from("reconciliation_records").select("id").eq("funding_request_id", f.id).maybeSingle();
      if (existing) continue;
      if (hit) {
        await supabaseAdmin.from("reconciliation_records").insert({
          source_type: "funding_request", source_id: f.id,
          transaction_id: hit.id, funding_request_id: f.id,
          amount: f.amount, currency: f.currency, expected_amount: f.amount, difference_amount: 0,
          status: "matched", reviewed_by: null, notes: `Auto-matched ${f.request_type} ${f.amount} ${f.currency}`,
        });
        matched++;
      } else {
        await supabaseAdmin.from("reconciliation_records").insert({
          source_type: "funding_request", source_id: f.id,
          funding_request_id: f.id,
          amount: f.amount, currency: f.currency, expected_amount: f.amount, difference_amount: Number(f.amount),
          status: "unmatched", notes: `No matching wallet transaction for ${f.request_type} ${f.amount} ${f.currency}`,
        });
        unmatched++;
      }
    }
    await audit(supabaseAdmin, context.userId, role, "reconciliation.run", "reconciliation_records", null, null, { matched, unmatched });
    return { ok: true, matched, unmatched };
  });

export const updateReconciliation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    status: z.enum(["matched", "unmatched", "exception", "investigating", "resolved"]),
    notes: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const role = await requireRole(context, ["admin", "super_admin", "finance"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("reconciliation_records").update({
      status: data.status, notes: data.notes ?? null,
      reviewed_by: context.userId, reviewed_at: new Date().toISOString(),
    }).eq("id", data.id);
    await audit(supabaseAdmin, context.userId, role, `recon.${data.status}`, "reconciliation_records", data.id, null, data);
    return { ok: true };
  });

// ============ SCHEDULED REPORTS ============
export const upsertScheduledReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid().optional(),
    report_type: z.string(),
    schedule: z.enum(["daily", "weekly", "monthly"]),
    format: z.enum(["csv", "xlsx", "pdf"]),
    filters: z.record(z.string(), z.any()).default({}),
    recipients: z.array(z.string().email()).default([]),
    active: z.boolean().default(true),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const role = await requireRole(context, ["admin", "super_admin", "finance"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const payload = { ...rest, created_by: context.userId };
    if (id) {
      await supabaseAdmin.from("scheduled_reports").update(payload).eq("id", id);
    } else {
      await supabaseAdmin.from("scheduled_reports").insert(payload);
    }
    await audit(supabaseAdmin, context.userId, role, "report.schedule", "scheduled_reports", id ?? null, null, payload);
    return { ok: true };
  });

export const deleteScheduledReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const role = await requireRole(context, ["admin", "super_admin", "finance"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("scheduled_reports").delete().eq("id", data.id);
    await audit(supabaseAdmin, context.userId, role, "report.unschedule", "scheduled_reports", data.id, null, null);
    return { ok: true };
  });

export const recordReportRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    report_type: z.string(), format: z.string(), row_count: z.number().optional(),
    filters: z.record(z.string(), z.any()).default({}),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const role = await requireRole(context, ["admin", "super_admin", "finance"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("report_runs").insert({ ...data, status: "completed", generated_by: context.userId });
    await audit(supabaseAdmin, context.userId, role, "report.generate", "report_runs", null, null, data);
    return { ok: true };
  });
