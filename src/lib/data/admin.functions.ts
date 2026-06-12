// Privileged server functions for admin/finance/support actions.
// Every handler verifies the caller's role via has_role RPC before mutating.
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

async function audit(adminSb: any, actor: string, role: string, action: string, entity: string, entityId: string, oldV: any, newV: any) {
  await adminSb.from("audit_logs").insert({
    actor_id: actor, actor_role: role, action_type: action, entity_type: entity, entity_id: entityId,
    old_value: oldV, new_value: newV,
  });
}

async function notify(adminSb: any, userId: string, title: string, message: string, type: string, link?: string) {
  await adminSb.from("notifications").insert({ user_id: userId, title, message, notification_type: type, link });
}

async function ensureWallet(adminSb: any, userId: string, currency: string) {
  const { data: existing } = await adminSb.from("wallets").select("*").eq("user_id", userId).eq("currency", currency).maybeSingle();
  if (existing) return existing;
  const { data: created } = await adminSb.from("wallets").insert({ user_id: userId, currency, balance: 0, status: "active" }).select().single();
  return created;
}

// ============ KYC ============
export const reviewKyc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    decision: z.enum(["approved", "rejected", "info_requested"]),
    notes: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const role = await requireRole(context, ["admin", "super_admin", "support", "compliance"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: old } = await supabaseAdmin.from("kyc_submissions").select("*").eq("id", data.id).single();
    const { error } = await supabaseAdmin.from("kyc_submissions").update({
      status: data.decision, review_notes: data.notes ?? null,
      reviewer_id: context.userId, reviewed_at: new Date().toISOString(),
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    if (data.decision === "approved" && old) {
      await supabaseAdmin.from("user_roles").upsert({ user_id: old.user_id, role: "verified" }, { onConflict: "user_id,role" });
      await supabaseAdmin.from("profiles").update({ kyc_status: "verified" }).eq("id", old.user_id);
    }
    if (old) {
      await notify(supabaseAdmin, old.user_id,
        data.decision === "approved" ? "KYC approved" : data.decision === "rejected" ? "KYC rejected" : "More info requested",
        data.notes ?? "Your verification has been reviewed.",
        "verification", "/account/verification");
      await audit(supabaseAdmin, context.userId, role, `kyc.${data.decision}`, "kyc_submissions", data.id, old, { ...old, status: data.decision });
    }
    return { ok: true };
  });

// ============ FUNDING — simple approve/reject (legacy, used by deposits review) ============
export const reviewFunding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    decision: z.enum(["approved", "rejected"]),
    notes: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const role = await requireRole(context, ["admin", "super_admin", "finance"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: req } = await supabaseAdmin.from("funding_requests").select("*").eq("id", data.id).single();
    if (!req) throw new Error("Not found");
    if (!["pending", "finance_review"].includes(req.workflow_stage ?? req.status)) throw new Error("Not in a reviewable stage");

    const finalStage = data.decision === "approved"
      ? (req.request_type === "withdrawal" ? "approved" : "completed")
      : "rejected";
    const completedAt = data.decision === "approved" && req.request_type === "deposit" ? new Date().toISOString() : null;

    const upd = await supabaseAdmin.from("funding_requests").update({
      status: data.decision, workflow_stage: finalStage,
      admin_notes: data.notes ?? null,
      reviewed_by: context.userId, reviewed_at: new Date().toISOString(),
      ...(completedAt ? { completed_at: completedAt } : {}),
    }).eq("id", data.id);
    if (upd.error) throw new Error(upd.error.message);

    if (data.decision === "approved") {
      const currency = req.currency || req.asset || "USD";
      const wallet = await ensureWallet(supabaseAdmin, req.user_id, currency);
      const before = Number(wallet.balance);
      const delta = req.request_type === "deposit" ? Number(req.amount) : -Number(req.amount);
      const after = before + delta;
      if (after < 0) throw new Error("Insufficient funds");
      await supabaseAdmin.from("wallets").update({ balance: after }).eq("id", wallet.id);
      const { data: tx } = await supabaseAdmin.from("wallet_transactions").insert({
        wallet_id: wallet.id, transaction_type: req.request_type, amount: Math.abs(Number(req.amount)),
        balance_before: before, balance_after: after, reference: `FUND-${data.id.slice(0, 8)}`, status: "completed",
      }).select().single();
      if (tx) await supabaseAdmin.from("ledger_entries").insert({
        user_id: req.user_id, transaction_id: tx.id,
        debit: req.request_type === "withdrawal" ? Number(req.amount) : 0,
        credit: req.request_type === "deposit" ? Number(req.amount) : 0,
        description: `${req.request_type} via ${req.payment_method} (${currency})`,
      });
    }
    await notify(supabaseAdmin, req.user_id,
      `${req.request_type === "deposit" ? "Deposit" : "Withdrawal"} ${data.decision}`,
      data.notes ?? `Your ${req.request_type} of ${req.amount} ${req.currency} was ${data.decision}.`,
      "funding", "/account/funding");
    await audit(supabaseAdmin, context.userId, role, `funding.${data.decision}`, "funding_requests", data.id, req, { ...req, status: data.decision });
    return { ok: true };
  });

// ============ FUNDING — workflow advance (compliance -> finance -> approved -> sent -> completed) ============
export const advanceFunding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    action: z.enum(["compliance_clear", "compliance_reject", "finance_approve", "finance_reject", "mark_sent", "mark_completed", "hold", "escalate"]),
    notes: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const role = await requireRole(context, ["admin", "super_admin", "compliance", "finance"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: req } = await supabaseAdmin.from("funding_requests").select("*").eq("id", data.id).single();
    if (!req) throw new Error("Not found");

    const patch: any = { updated_at: new Date().toISOString() };
    let notif: { title: string; type: string } | null = null;

    switch (data.action) {
      case "compliance_clear":
        if (!["compliance", "admin", "super_admin"].includes(role)) throw new Error("Compliance role required");
        patch.workflow_stage = "finance_review";
        patch.compliance_reviewed_by = context.userId;
        patch.compliance_reviewed_at = new Date().toISOString();
        patch.compliance_notes = data.notes ?? null;
        notif = { title: "Withdrawal in finance review", type: "funding" };
        break;
      case "compliance_reject":
        patch.workflow_stage = "rejected";
        patch.status = "rejected";
        patch.compliance_reviewed_by = context.userId;
        patch.compliance_reviewed_at = new Date().toISOString();
        patch.compliance_notes = data.notes ?? null;
        notif = { title: "Withdrawal rejected by compliance", type: "funding" };
        break;
      case "finance_approve": {
        if (!["finance", "admin", "super_admin"].includes(role)) throw new Error("Finance role required");
        // debit wallet here
        const currency = req.currency || req.asset || "USD";
        const wallet = await ensureWallet(supabaseAdmin, req.user_id, currency);
        const before = Number(wallet.balance);
        if (before < Number(req.amount)) throw new Error("Insufficient balance");
        const after = before - Number(req.amount);
        await supabaseAdmin.from("wallets").update({ balance: after }).eq("id", wallet.id);
        const { data: tx } = await supabaseAdmin.from("wallet_transactions").insert({
          wallet_id: wallet.id, transaction_type: "withdrawal", amount: Number(req.amount),
          balance_before: before, balance_after: after, reference: `WD-${data.id.slice(0, 8)}`, status: "processing",
        }).select().single();
        if (tx) await supabaseAdmin.from("ledger_entries").insert({
          user_id: req.user_id, transaction_id: tx.id,
          debit: Number(req.amount), credit: 0,
          description: `Withdrawal via ${req.payment_method} (${currency})`,
        });
        patch.workflow_stage = "approved";
        patch.status = "approved";
        patch.reviewed_by = context.userId;
        patch.reviewed_at = new Date().toISOString();
        patch.admin_notes = data.notes ?? null;
        notif = { title: "Withdrawal approved", type: "funding" };
        break;
      }
      case "finance_reject":
        patch.workflow_stage = "rejected";
        patch.status = "rejected";
        patch.reviewed_by = context.userId;
        patch.reviewed_at = new Date().toISOString();
        patch.admin_notes = data.notes ?? null;
        notif = { title: "Withdrawal rejected", type: "funding" };
        break;
      case "mark_sent":
        patch.workflow_stage = "sent";
        patch.sent_at = new Date().toISOString();
        notif = { title: "Withdrawal sent", type: "funding" };
        break;
      case "mark_completed":
        patch.workflow_stage = "completed";
        patch.status = "approved";
        patch.completed_at = new Date().toISOString();
        notif = { title: "Withdrawal completed", type: "funding" };
        break;
      case "hold":
        patch.workflow_stage = "on_hold";
        patch.admin_notes = data.notes ?? null;
        notif = { title: "Request placed on hold", type: "funding" };
        break;
      case "escalate":
        patch.workflow_stage = "escalated";
        patch.admin_notes = data.notes ?? null;
        notif = { title: "Request escalated", type: "funding" };
        break;
    }

    const upd = await supabaseAdmin.from("funding_requests").update(patch).eq("id", data.id);
    if (upd.error) throw new Error(upd.error.message);

    if (notif) await notify(supabaseAdmin, req.user_id, notif.title, data.notes ?? `Update on your ${req.request_type}.`, notif.type, "/account/funding");
    await audit(supabaseAdmin, context.userId, role, `funding.${data.action}`, "funding_requests", data.id, req, { ...req, ...patch });
    return { ok: true };
  });

// ============ INVESTMENTS ============
export const reviewInvestment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    decision: z.enum(["approved", "rejected"]),
    notes: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const role = await requireRole(context, ["admin", "super_admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: inv } = await supabaseAdmin.from("investments").select("*").eq("id", data.id).single();
    if (!inv) throw new Error("Not found");

    await supabaseAdmin.from("investments").update({
      approval_status: data.decision,
      status: data.decision === "approved" ? "active" : "cancelled",
      reviewed_by: context.userId, reviewed_at: new Date().toISOString(), review_notes: data.notes ?? null,
    }).eq("id", data.id);

    if (data.decision === "approved") {
      const { data: wallet } = await supabaseAdmin.from("wallets").select("*").eq("user_id", inv.investor_id).eq("currency", "USD").maybeSingle();
      if (wallet) {
        const before = Number(wallet.balance);
        const after = before - Number(inv.amount);
        await supabaseAdmin.from("wallets").update({ balance: after }).eq("id", wallet.id);
        await supabaseAdmin.from("wallet_transactions").insert({
          wallet_id: wallet.id, transaction_type: "investment", amount: Number(inv.amount),
          balance_before: before, balance_after: after, reference: `INV-${data.id.slice(0, 8)}`, status: "completed",
        });
      }
      const { data: opp } = await supabaseAdmin.from("investment_opportunities").select("raised_amount,available_shares").eq("id", inv.opportunity_id).single();
      if (opp) await supabaseAdmin.from("investment_opportunities").update({
        raised_amount: Number(opp.raised_amount) + Number(inv.amount),
        available_shares: Math.max(0, Number(opp.available_shares) - Number(inv.shares)),
      }).eq("id", inv.opportunity_id);
      await supabaseAdmin.from("investment_allocations").insert({
        investment_id: inv.id, allocated_by: context.userId, allocation_notes: data.notes ?? null,
      });
    }
    await notify(supabaseAdmin, inv.investor_id,
      `Investment ${data.decision}`,
      data.notes ?? `Your investment of $${inv.amount} has been ${data.decision}.`,
      "investment", "/account/investments");
    await audit(supabaseAdmin, context.userId, role, `investment.${data.decision}`, "investments", data.id, inv, { ...inv, approval_status: data.decision });
    return { ok: true };
  });

// ============ WALLET ADJUST ============
export const adjustWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    user_id: z.string().uuid(), delta: z.number(), reference: z.string().optional(), reason: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const role = await requireRole(context, ["admin", "super_admin", "finance"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: wallet } = await supabaseAdmin.from("wallets").select("*").eq("user_id", data.user_id).eq("currency", "USD").maybeSingle();
    if (!wallet) throw new Error("Wallet missing");
    const before = Number(wallet.balance);
    const after = before + data.delta;
    if (after < 0) throw new Error("Negative balance not permitted");
    await supabaseAdmin.from("wallets").update({ balance: after }).eq("id", wallet.id);
    await supabaseAdmin.from("wallet_transactions").insert({
      wallet_id: wallet.id, transaction_type: "adjustment", amount: Math.abs(data.delta),
      balance_before: before, balance_after: after, reference: data.reference ?? "MANUAL", status: "completed",
    });
    await audit(supabaseAdmin, context.userId, role, "wallet.adjust", "wallets", wallet.id, { balance: before }, { balance: after, reason: data.reason });
    return { ok: true, balance: after };
  });

export const setWalletStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ wallet_id: z.string().uuid(), status: z.enum(["active", "frozen", "closed"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const role = await requireRole(context, ["admin", "super_admin", "finance"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("wallets").update({ status: data.status }).eq("id", data.wallet_id);
    await audit(supabaseAdmin, context.userId, role, `wallet.${data.status}`, "wallets", data.wallet_id, null, { status: data.status });
    return { ok: true };
  });

// ============ CRYPTO ADDRESSES ============
export const assignCryptoAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    user_id: z.string().uuid(),
    asset: z.string().min(2),
    network: z.string().min(2),
    address: z.string().min(8),
    memo: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const role = await requireRole(context, ["admin", "super_admin", "finance"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = { ...data, assigned_by: context.userId, is_active: true };
    const { error } = await supabaseAdmin.from("crypto_deposit_addresses").upsert(payload, { onConflict: "user_id,asset,network" });
    if (error) throw new Error(error.message);
    await notify(supabaseAdmin, data.user_id, `${data.asset} deposit address assigned`,
      `Your ${data.asset} (${data.network}) deposit address is ready.`, "funding", "/account/funding");
    await audit(supabaseAdmin, context.userId, role, "crypto.address.assign", "crypto_deposit_addresses", data.user_id, null, payload);
    return { ok: true };
  });

// ============ OPPORTUNITIES ============
export const upsertOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid().optional(),
    title: z.string().min(2),
    category: z.string().default("equity"),
    description: z.string().optional(),
    investment_type: z.string().default("shares"),
    minimum_investment: z.number().nonnegative(),
    maximum_investment: z.number().nullable().optional(),
    target_amount: z.number().nonnegative(),
    available_shares: z.number().nonnegative(),
    price_per_share: z.number().nonnegative(),
    status: z.enum(["draft", "open", "closed", "funded", "archived"]),
    open_date: z.string().nullable().optional(),
    close_date: z.string().nullable().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const role = await requireRole(context, ["admin", "super_admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = { ...data, created_by: context.userId };
    if (data.id) {
      const { error } = await supabaseAdmin.from("investment_opportunities").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      await audit(supabaseAdmin, context.userId, role, "opportunity.update", "investment_opportunities", data.id, null, payload);
    } else {
      const { data: row, error } = await supabaseAdmin.from("investment_opportunities").insert(payload).select().single();
      if (error) throw new Error(error.message);
      await audit(supabaseAdmin, context.userId, role, "opportunity.create", "investment_opportunities", row!.id, null, payload);
    }
    return { ok: true };
  });

// ============ TICKETS (staff) ============
export const updateTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    status: z.enum(["open", "pending", "escalated", "resolved", "closed"]).optional(),
    priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
    assigned_to_self: z.boolean().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const role = await requireRole(context, ["admin", "super_admin", "support"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: any = {};
    if (data.status) patch.status = data.status;
    if (data.priority) patch.priority = data.priority;
    if (data.assigned_to_self) patch.assigned_to = context.userId;
    await supabaseAdmin.from("support_tickets").update(patch).eq("id", data.id);
    await audit(supabaseAdmin, context.userId, role, "ticket.update", "support_tickets", data.id, null, patch);
    return { ok: true };
  });

// ============ STAFF UPLOAD DOC FOR INVESTOR ============
export const uploadInvestorDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    user_id: z.string().uuid(),
    document_name: z.string(),
    document_type: z.enum(["statement", "contract", "tax", "verification", "other"]),
    file_url: z.string(),
    bucket: z.string(),
    size_bytes: z.number().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const role = await requireRole(context, ["admin", "super_admin", "employee"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("documents").insert({ ...data, uploaded_by: context.userId, visibility: "investor" });
    await notify(supabaseAdmin, data.user_id, "New document available", data.document_name, "system", "/account/documents");
    await audit(supabaseAdmin, context.userId, role, "document.upload", "documents", data.user_id, null, data);
    return { ok: true };
  });

// ============ TICKET REPLY ============
export const replyTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    ticket_id: z.string().uuid(), message: z.string().min(1), internal: z.boolean().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const role = await requireRole(context, ["admin", "super_admin", "support", "compliance"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("support_messages").insert({
      ticket_id: data.ticket_id, sender_id: context.userId, message: data.message,
    });
    await supabaseAdmin.from("support_tickets").update({ updated_at: new Date().toISOString(), status: "pending" }).eq("id", data.ticket_id);
    const { data: t } = await supabaseAdmin.from("support_tickets").select("user_id,subject").eq("id", data.ticket_id).single();
    if (t && !data.internal) await notify(supabaseAdmin, t.user_id, "Support replied", t.subject, "support", "/account/support");
    await audit(supabaseAdmin, context.userId, role, "ticket.reply", "support_tickets", data.ticket_id, null, { len: data.message.length });
    return { ok: true };
  });

// ============ ROLE GRANT ============
export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    user_id: z.string().uuid(),
    role: z.enum(["verified", "vip", "employee", "support", "compliance", "finance", "admin"]),
    action: z.enum(["grant", "revoke"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const role = await requireRole(context, ["admin", "super_admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.action === "grant") {
      await supabaseAdmin.from("user_roles").upsert({ user_id: data.user_id, role: data.role }, { onConflict: "user_id,role" });
    } else {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id).eq("role", data.role);
    }
    await audit(supabaseAdmin, context.userId, role, `role.${data.action}`, "user_roles", data.user_id, null, { role: data.role });
    return { ok: true };
  });

// ============ ACCOUNT STATUS (suspend / reactivate / lock) ============
export const setAccountStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    user_id: z.string().uuid(),
    status: z.enum(["active", "suspended", "locked"]),
    reason: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const role = await requireRole(context, ["admin", "super_admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: old } = await supabaseAdmin.from("profiles").select("account_status").eq("id", data.user_id).maybeSingle();
    await supabaseAdmin.from("profiles").update({
      account_status: data.status,
      suspended_at: data.status === "active" ? null : new Date().toISOString(),
      suspended_reason: data.status === "active" ? null : (data.reason ?? null),
    }).eq("id", data.user_id);
    // Freeze the wallet too for suspended/locked
    await supabaseAdmin.from("wallets").update({ status: data.status === "active" ? "active" : "frozen" }).eq("user_id", data.user_id);
    if (data.status !== "active") {
      // Sign the user out by invalidating refresh tokens
      try { await (supabaseAdmin.auth as any).admin.signOut(data.user_id, "global"); } catch { /* best-effort */ }
    }
    await notify(supabaseAdmin, data.user_id,
      data.status === "active" ? "Account reactivated" : data.status === "suspended" ? "Account suspended" : "Account locked",
      data.reason ?? `Your account status changed to ${data.status}.`, "security");
    await audit(supabaseAdmin, context.userId, role, `account.${data.status}`, "profiles", data.user_id, old, { account_status: data.status });
    return { ok: true };
  });

// ============ PASSWORD RESET (admin-triggered email) ============
export const sendUserPasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const role = await requireRole(context, ["admin", "super_admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prof } = await supabaseAdmin.from("profiles").select("email").eq("id", data.user_id).maybeSingle();
    if (!prof?.email) throw new Error("Email not found");
    const { error } = await (supabaseAdmin.auth as any).admin.generateLink({ type: "recovery", email: prof.email });
    if (error) throw new Error(error.message);
    await audit(supabaseAdmin, context.userId, role, "account.password_reset", "profiles", data.user_id, null, { email: prof.email });
    return { ok: true };
  });

// ============ SET EXACT WALLET BALANCE ============
export const setExactWalletBalance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    user_id: z.string().uuid(), balance: z.number().nonnegative(), reason: z.string().min(2),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const role = await requireRole(context, ["admin", "super_admin", "finance"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const wallet = await ensureWallet(supabaseAdmin, data.user_id, "USD");
    const before = Number(wallet.balance);
    const after = Number(data.balance);
    const delta = after - before;
    await supabaseAdmin.from("wallets").update({ balance: after }).eq("id", wallet.id);
    await supabaseAdmin.from("wallet_transactions").insert({
      wallet_id: wallet.id, transaction_type: "adjustment", amount: Math.abs(delta),
      balance_before: before, balance_after: after,
      reference: `SET-${Date.now().toString(36).toUpperCase()}`,
      description: `Admin set balance: ${data.reason}`, status: "completed",
    });
    await audit(supabaseAdmin, context.userId, role, "wallet.set_balance", "wallets", wallet.id, { balance: before }, { balance: after, reason: data.reason });
    return { ok: true, balance: after };
  });

// ============ ADMIN: signed URL for a KYC / investor document ============
export const getAdminSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ bucket: z.string(), path: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireRole(context, ["admin", "super_admin", "compliance", "support", "finance"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage.from(data.bucket).createSignedUrl(data.path, 600);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

