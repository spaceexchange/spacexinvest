import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DEMO_PASSWORD = "DemoAccess!2026";

const DEMOS = {
  investor: {
    email: "demo.investor@spacex-ipo.exchange",
    first_name: "Alex",
    last_name: "Investor",
    roles: ["registered", "verified", "vip"] as const,
    country: "US",
    phone: "+15551110001",
  },
  support: {
    email: "demo.support@spacex-ipo.exchange",
    first_name: "Sam",
    last_name: "Support",
    roles: ["registered", "verified", "employee", "support"] as const,
    country: "US",
    phone: "+15551110002",
  },
  admin: {
    email: "demo.admin@spacex-ipo.exchange",
    first_name: "Morgan",
    last_name: "Admin",
    roles: ["registered", "verified", "employee", "admin"] as const,
    country: "US",
    phone: "+15551110003",
  },
} as const;

const inputSchema = z.object({ kind: z.enum(["investor", "support", "admin"]) });

export const provisionDemoAccount = createServerFn({ method: "POST" })
  .inputValidator((d) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    // SECURITY: demo provisioning is disabled in production unless explicitly enabled.
    const demoEnabled =
      process.env.ENABLE_DEMO_MODE === "true" || process.env.NODE_ENV !== "production";
    if (!demoEnabled) {
      throw new Error("Demo accounts are disabled in production.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const demo = DEMOS[data.kind];

    // Find existing user by email via listUsers (pagination ok — small directory)
    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) throw new Error(listErr.message);
    let user = list.users.find((u) => u.email?.toLowerCase() === demo.email);

    if (!user) {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: demo.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: {
          first_name: demo.first_name,
          last_name: demo.last_name,
          phone: demo.phone,
          country: demo.country,
          demo_account: true,
          demo_kind: data.kind,
        },
      });
      if (createErr || !created.user) throw new Error(createErr?.message ?? "Failed to create demo user");
      user = created.user;
    } else {
      // Reset password so demo always works
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          ...(user.user_metadata ?? {}),
          first_name: demo.first_name,
          last_name: demo.last_name,
          demo_account: true,
          demo_kind: data.kind,
        },
      });
    }

    // Ensure profile exists & mark verified
    await supabaseAdmin.from("profiles").upsert(
      {
        id: user.id,
        email: demo.email,
        first_name: demo.first_name,
        last_name: demo.last_name,
        phone: demo.phone,
        country: demo.country,
        email_verified: true,
        display_name: `${demo.first_name} ${demo.last_name}`,
      },
      { onConflict: "id" },
    );

    // Ensure roles
    for (const role of demo.roles) {
      await supabaseAdmin.from("user_roles").upsert(
        { user_id: user.id, role },
        { onConflict: "user_id,role" },
      );
    }

    // Seed operational data for the demo investor only (once)
    if (data.kind === "investor") {
      // Wallet with balance
      const { data: wallet } = await supabaseAdmin.from("wallets")
        .upsert({ user_id: user.id, currency: "USD", balance: 18320, status: "active" }, { onConflict: "user_id,currency" })
        .select().single();

      const hasTx = await supabaseAdmin.from("wallet_transactions").select("id", { head: true, count: "exact" }).eq("wallet_id", wallet!.id);
      if ((hasTx.count ?? 0) === 0 && wallet) {
        const txs = [
          { wallet_id: wallet.id, transaction_type: "deposit", amount: 60000, balance_before: 0, balance_after: 60000, reference: "DEP-001", status: "completed" },
          { wallet_id: wallet.id, transaction_type: "investment", amount: 32500, balance_before: 60000, balance_after: 27500, reference: "INV-001", status: "completed" },
          { wallet_id: wallet.id, transaction_type: "deposit", amount: 25000, balance_before: 27500, balance_after: 52500, reference: "DEP-002", status: "completed" },
          { wallet_id: wallet.id, transaction_type: "investment", amount: 12500, balance_before: 52500, balance_after: 40000, reference: "INV-002", status: "completed" },
          { wallet_id: wallet.id, transaction_type: "dividend", amount: 412.55, balance_before: 40000, balance_after: 40412.55, reference: "DIV-001", status: "completed" },
          { wallet_id: wallet.id, transaction_type: "withdrawal", amount: 22092.55, balance_before: 40412.55, balance_after: 18320, reference: "WTH-001", status: "completed" },
        ];
        await supabaseAdmin.from("wallet_transactions").insert(txs);
      }

      // KYC approved
      const { data: existingKyc } = await supabaseAdmin.from("kyc_submissions").select("id").eq("user_id", user.id).maybeSingle();
      if (!existingKyc) {
        await supabaseAdmin.from("kyc_submissions").insert({
          user_id: user.id, status: "approved", first_name: demo.first_name, last_name: demo.last_name,
          nationality: "United States", address: "1 Rocket Road, Hawthorne CA", document_type: "passport",
          reviewed_at: new Date().toISOString(),
        });
        await supabaseAdmin.from("profiles").update({ kyc_status: "verified" }).eq("id", user.id);
      }

      // Sample investment in first open opportunity
      const { data: opp } = await supabaseAdmin.from("investment_opportunities").select("id,price_per_share").eq("status", "open").limit(1).maybeSingle();
      const { count: invCount } = await supabaseAdmin.from("investments").select("id", { head: true, count: "exact" }).eq("investor_id", user.id);
      if (opp && (invCount ?? 0) === 0) {
        await supabaseAdmin.from("investments").insert([
          { investor_id: user.id, opportunity_id: opp.id, amount: 32500, shares: 32500 / Number(opp.price_per_share || 1), status: "active", approval_status: "approved", reviewed_at: new Date().toISOString() },
          { investor_id: user.id, opportunity_id: opp.id, amount: 12500, shares: 12500 / Number(opp.price_per_share || 1), status: "pending", approval_status: "pending" },
        ]);
      }

      // Sample notifications
      const { count: nCount } = await supabaseAdmin.from("notifications").select("id", { head: true, count: "exact" }).eq("user_id", user.id);
      if ((nCount ?? 0) === 0) {
        await supabaseAdmin.from("notifications").insert([
          { user_id: user.id, title: "Welcome to SpaceX IPO Exchange", message: "Your investor account is ready.", notification_type: "system" },
          { user_id: user.id, title: "KYC approved", message: "Tier 2 limits unlocked.", notification_type: "verification", link: "/account/verification" },
          { user_id: user.id, title: "Investment active", message: "Your allocation has been confirmed.", notification_type: "investment", link: "/account/investments" },
        ]);
      }

      // Sample ticket
      const { count: tCount } = await supabaseAdmin.from("support_tickets").select("id", { head: true, count: "exact" }).eq("user_id", user.id);
      if ((tCount ?? 0) === 0) {
        const { data: t } = await supabaseAdmin.from("support_tickets").insert({
          user_id: user.id, subject: "Wire confirmation timing", category: "funding", priority: "normal", status: "open",
        }).select().single();
        if (t) await supabaseAdmin.from("support_messages").insert({
          ticket_id: t.id, sender_id: user.id, message: "How long does an international wire usually take to clear?",
        });
      }
    }

    return { email: demo.email, password: DEMO_PASSWORD };
  });
