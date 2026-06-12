// SpaceX Stock Center data layer (mirror of Tesla — Mission 5b).
import { supabase } from "@/integrations/supabase/client";

const SYM = "SPXI";

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export async function getQuote(symbol = SYM) {
  const { data } = await supabase.from("spacex_quotes" as any).select("*").eq("symbol", symbol).maybeSingle();
  return data as any;
}

export async function getMyHolding(symbol = SYM) {
  const id = await uid();
  const { data } = await supabase.from("spacex_holdings" as any).select("*").eq("user_id", id).eq("symbol", symbol).maybeSingle();
  return data as any;
}

export async function getMyOrders(limit = 50) {
  const id = await uid();
  const { data } = await supabase.from("spacex_orders" as any).select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as any[];
}

export type PaymentMethod = "wallet" | "crypto" | "bank";

export async function placeBuyOrder(shares: number, price: number, symbol = SYM, payment_method: PaymentMethod = "wallet") {
  const id = await uid();
  const amount = Number((shares * price).toFixed(2));
  const status = payment_method === "wallet" ? "filled" : "pending";
  const { data, error } = await supabase.from("spacex_orders" as any).insert({
    user_id: id, symbol, side: "buy", shares, price, amount, status, payment_method,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function placeSellOrder(shares: number, price: number, symbol = SYM) {
  const id = await uid();
  const amount = Number((shares * price).toFixed(2));
  const { data, error } = await supabase.from("spacex_orders" as any).insert({
    user_id: id, symbol, side: "sell", shares, price, amount, status: "filled", payment_method: "wallet",
  }).select().single();
  if (error) throw error;
  return data;
}

// Admin
export async function adminListOrders(limit = 200) {
  const { data } = await supabase.from("spacex_orders" as any).select("*").order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as any[];
}
export async function adminListHoldings() {
  const { data } = await supabase.from("spacex_holdings" as any).select("*").order("total_invested", { ascending: false });
  return (data ?? []) as any[];
}
export async function adminUpdateQuote(symbol: string, fields: Record<string, any>) {
  const { error } = await supabase.from("spacex_quotes" as any).update({ ...fields, updated_at: new Date().toISOString() }).eq("symbol", symbol);
  if (error) throw error;
}
