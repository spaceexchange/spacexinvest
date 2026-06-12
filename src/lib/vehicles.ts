// Tesla Vehicle Marketplace data layer (Mission 17).
import { supabase } from "@/integrations/supabase/client";

import modelS from "@/assets/tesla-model-s.jpg";
import model3 from "@/assets/tesla-model-3.jpg";
import modelX from "@/assets/tesla-model-x.jpg";
import modelY from "@/assets/tesla-model-y.jpg";
import cybertruck from "@/assets/tesla-cybertruck.jpg";

export const VEHICLE_IMAGES: Record<string, string> = {
  "model-s": modelS,
  "model-3": model3,
  "model-x": modelX,
  "model-y": modelY,
  "cybertruck": cybertruck,
};

export type Vehicle = {
  id: string; slug: string; model: string; tagline: string; description: string;
  base_price: number; range_miles: number; top_speed_mph: number; acceleration_sec: number;
  battery_kwh: number; delivery_estimate: string; inventory: number; active: boolean;
  colors: Array<{ name: string; hex: string; price: number }>;
  wheels: Array<{ name: string; price: number }>;
  interiors: Array<{ name: string; price: number }>;
  battery_options: Array<{ name: string; price: number }>;
  performance_options: Array<{ name: string; price: number }>;
  features: string[];
};

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export async function listVehicles(): Promise<Vehicle[]> {
  const { data } = await supabase.from("tesla_vehicles" as any).select("*").eq("active", true).order("display_order");
  return (data ?? []) as unknown as Vehicle[];
}

export async function getVehicle(slug: string): Promise<Vehicle | null> {
  const { data } = await supabase.from("tesla_vehicles" as any).select("*").eq("slug", slug).maybeSingle();
  return (data ?? null) as Vehicle | null;
}

export type Configuration = {
  color: string; wheels: string; interior: string;
  battery: string; performance: string;
};

export type OrderInput = {
  vehicle_id: string; order_type: "reservation" | "purchase";
  configuration: Configuration; base_price: number; options_total: number;
  total_price: number; deposit_amount: number; payment_method: string;
  delivery_address?: string;
};

export async function createOrder(input: OrderInput) {
  const id = await uid();
  const { data, error } = await supabase.from("tesla_vehicle_orders" as any).insert({
    user_id: id, ...input,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function getMyOrders() {
  const id = await uid();
  const { data } = await supabase.from("tesla_vehicle_orders" as any)
    .select("*, tesla_vehicles(model, slug)")
    .eq("user_id", id).order("created_at", { ascending: false });
  return (data ?? []) as any[];
}

// Admin
export async function adminListOrders() {
  const { data } = await supabase.from("tesla_vehicle_orders" as any)
    .select("*, tesla_vehicles(model, slug)")
    .order("created_at", { ascending: false }).limit(300);
  return (data ?? []) as any[];
}
export async function adminUpdateOrder(id: string, fields: Record<string, any>) {
  const { error } = await supabase.from("tesla_vehicle_orders" as any).update(fields).eq("id", id);
  if (error) throw error;
}
export async function adminListVehicles() {
  const { data } = await supabase.from("tesla_vehicles" as any).select("*").order("display_order");
  return (data ?? []) as unknown as Vehicle[];
}
export async function adminUpdateVehicle(id: string, fields: Record<string, any>) {
  const { error } = await supabase.from("tesla_vehicles" as any).update(fields).eq("id", id);
  if (error) throw error;
}
