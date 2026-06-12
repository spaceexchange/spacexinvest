// Mission 5 — Tesla Stock Center data layer.
import { supabase } from "@/integrations/supabase/client";

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export async function getQuote(symbol = "TSLA") {
  const { data } = await supabase.from("tesla_quotes" as any).select("*").eq("symbol", symbol).maybeSingle();
  return data as any;
}

export async function getMyHolding(symbol = "TSLA") {
  const id = await uid();
  const { data } = await supabase.from("tesla_holdings" as any).select("*").eq("user_id", id).eq("symbol", symbol).maybeSingle();
  return data as any;
}

export async function getMyOrders(limit = 50) {
  const id = await uid();
  const { data } = await supabase.from("tesla_orders" as any).select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as any[];
}

export type PaymentMethod = "wallet" | "crypto" | "bank";

export async function getMyWalletBalance(): Promise<number> {
  const id = await uid();
  const { data } = await supabase.from("wallets" as any).select("balance").eq("user_id", id).eq("currency", "USD").maybeSingle();
  return Number((data as any)?.balance ?? 0);
}

export async function placeBuyOrder(shares: number, price: number, symbol = "TSLA", payment_method: PaymentMethod = "wallet") {
  const id = await uid();
  const amount = Number((shares * price).toFixed(2));
  const status = payment_method === "wallet" ? "filled" : "pending";
  const { data, error } = await supabase.from("tesla_orders" as any).insert({
    user_id: id, symbol, side: "buy", shares, price, amount, status, payment_method,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function placeSellOrder(shares: number, price: number, symbol = "TSLA") {
  const id = await uid();
  const amount = Number((shares * price).toFixed(2));
  const { data, error } = await supabase.from("tesla_orders" as any).insert({
    user_id: id, symbol, side: "sell", shares, price, amount, status: "filled", payment_method: "wallet",
  }).select().single();
  if (error) throw error;
  return data;
}

export async function getInvoiceForOrder(orderId: string, source: "tesla_order" | "spacex_order" | "tesla_vehicle_order") {
  const { data } = await supabase.from("invoices" as any).select("id").eq("source_id", orderId).eq("source_type", source).maybeSingle();
  return (data as any)?.id as string | undefined;
}

export async function getWatchlist() {
  const id = await uid();
  const { data } = await supabase.from("watchlist" as any).select("*").eq("user_id", id).order("created_at", { ascending: false });
  return (data ?? []) as any[];
}

export async function addWatchlist(symbol: string, company_name?: string) {
  const id = await uid();
  const { error } = await supabase.from("watchlist" as any).insert({ user_id: id, symbol: symbol.toUpperCase(), company_name });
  if (error) throw error;
}

export async function removeWatchlist(id: string) {
  const { error } = await supabase.from("watchlist" as any).delete().eq("id", id);
  if (error) throw error;
}

// Admin
export async function adminListOrders(limit = 200) {
  const { data } = await supabase.from("tesla_orders" as any).select("*").order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as any[];
}
export async function adminListHoldings() {
  const { data } = await supabase.from("tesla_holdings" as any).select("*").order("total_invested", { ascending: false });
  return (data ?? []) as any[];
}
export async function adminUpdateQuote(symbol: string, fields: Record<string, any>) {
  const { error } = await supabase.from("tesla_quotes" as any).update({ ...fields, updated_at: new Date().toISOString() }).eq("symbol", symbol);
  if (error) throw error;
}
