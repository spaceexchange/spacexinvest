import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InvestSchema = z.object({
  opportunity_id: z.string().uuid(),
  amount: z.number().positive().max(100_000_000),
  wallet_id: z.string().uuid(),
});

export const allocateInvestment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => InvestSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: opp, error: oppErr } = await supabase.from("investment_opportunities")
      .select("id,title,status,price_per_share,minimum_investment,maximum_investment,target_amount,raised_amount,available_shares,investor_count")
      .eq("id", data.opportunity_id).single();
    if (oppErr || !opp) throw new Error("Opportunity not found");
    if (opp.status !== "open" && opp.status !== "active") throw new Error("This opportunity is not currently open for investment.");
    if (data.amount < Number(opp.minimum_investment)) throw new Error(`Minimum investment is ${opp.minimum_investment}`);
    if (opp.maximum_investment && data.amount > Number(opp.maximum_investment)) throw new Error(`Maximum investment is ${opp.maximum_investment}`);
    const remaining = Number(opp.target_amount) - Number(opp.raised_amount);
    if (remaining > 0 && data.amount > remaining) throw new Error(`Only ${remaining.toFixed(2)} remaining in this opportunity.`);

    const pps = Number(opp.price_per_share) || 1;
    const shares = data.amount / pps;

    // Atomic CAS debit — DB enforces sufficient funds + active wallet + ownership
    const { data: debitRows, error: debitErr } = await (supabaseAdmin as any).rpc("debit_wallet_atomic", {
      _wallet_id: data.wallet_id, _user_id: userId, _amount: data.amount,
    });
    if (debitErr) throw new Error(debitErr.message ?? "Insufficient funds");
    const debit = Array.isArray(debitRows) ? debitRows[0] : debitRows;
    if (!debit) throw new Error("Insufficient funds or wallet unavailable");
    const balanceBefore = Number(debit.balance_before);
    const newBalance = Number(debit.balance_after);
    const wallet = { id: data.wallet_id, currency: debit.currency };

    const { data: inv, error: invErr } = await (supabaseAdmin as any).from("investments").insert({
      investor_id: userId, opportunity_id: opp.id, amount: data.amount, shares,
      status: "active", approval_status: "approved",
    }).select().single();
    if (invErr) {
      // Refund on failure to preserve invariant
      await (supabaseAdmin as any).from("wallets").update({ balance: balanceBefore }).eq("id", wallet.id);
      throw new Error(invErr.message);
    }

    await (supabaseAdmin as any).from("wallet_transactions").insert({
      wallet_id: wallet.id, transaction_type: "investment_debit", amount: -data.amount,
      balance_before: balanceBefore, balance_after: newBalance, status: "completed",
      reference: `INV-${inv.id.slice(0, 8)}`,
    });
    await (supabaseAdmin as any).from("investment_opportunities").update({
      raised_amount: Number(opp.raised_amount) + data.amount,
      available_shares: Math.max(0, Number(opp.available_shares ?? 0) - shares),
      investor_count: Number(opp.investor_count ?? 0) + 1,
    }).eq("id", opp.id);
    await (supabaseAdmin as any).from("ledger_entries").insert({
      user_id: userId, entry_type: "investment", amount: data.amount, currency: wallet.currency,
      reference_id: inv.id, reference_type: "investment",
    });
    await (supabaseAdmin as any).from("audit_logs").insert({
      actor_id: userId, actor_role: "investor", action_type: "investment.created",
      entity_type: "investment", entity_id: inv.id, metadata: { amount: data.amount, opportunity_id: opp.id },
    });
    await (supabaseAdmin as any).from("notifications").insert({
      user_id: userId, notification_type: "investment", category: "investment",
      title: "Investment confirmed",
      message: `Your investment of ${wallet.currency} ${data.amount.toLocaleString()} in ${opp.title} has been recorded.`,
      link: `/account/investments`,
    });
    return { ok: true, investment_id: inv.id, shares, balance: newBalance };
  });
