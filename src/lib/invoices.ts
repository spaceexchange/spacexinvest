// Universal invoice system for purchases and deposits.
import { supabase } from "@/integrations/supabase/client";

export type InvoiceStatus =
  | "awaiting_payment" | "pending_verification" | "partially_paid"
  | "paid" | "processing" | "completed" | "cancelled" | "expired"
  | "refunded" | "rejected";

export type Invoice = {
  id: string;
  user_id: string;
  invoice_number: string;
  kind: "deposit" | "purchase";
  source_type: string;
  source_id: string;
  funding_request_id: string | null;
  title: string;
  description: string | null;
  amount_due: number;
  amount_paid: number;
  currency: string;
  payment_method: string | null;
  status: InvoiceStatus;
  metadata: Record<string, any>;
  due_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export async function getMyInvoices(): Promise<Invoice[]> {
  const id = await uid();
  const { data } = await supabase.from("invoices" as any)
    .select("*").eq("user_id", id).order("created_at", { ascending: false });
  return (data ?? []) as unknown as Invoice[];
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const { data } = await supabase.from("invoices" as any).select("*").eq("id", id).maybeSingle();
  return (data ?? null) as Invoice | null;
}

export async function getInvoiceByNumber(num: string): Promise<Invoice | null> {
  const { data } = await supabase.from("invoices" as any).select("*").eq("invoice_number", num).maybeSingle();
  return (data ?? null) as Invoice | null;
}

// Admin
export async function adminListInvoices(opts: { kind?: "deposit" | "purchase"; status?: InvoiceStatus } = {}): Promise<Invoice[]> {
  let q = supabase.from("invoices" as any).select("*").order("created_at", { ascending: false }).limit(500);
  if (opts.kind) q = q.eq("kind", opts.kind);
  if (opts.status) q = q.eq("status", opts.status);
  const { data } = await q;
  return (data ?? []) as unknown as Invoice[];
}

export async function adminUpdateInvoice(id: string, fields: Partial<Invoice>) {
  const { error } = await supabase.from("invoices" as any).update(fields).eq("id", id);
  if (error) throw error;
}

export async function adminMarkPaid(id: string) {
  const inv = await getInvoice(id);
  if (!inv) throw new Error("Invoice not found");
  await adminUpdateInvoice(id, {
    status: "paid", amount_paid: inv.amount_due, paid_at: new Date().toISOString(),
  } as any);
}

export const INVOICE_TONE: Record<InvoiceStatus, "default" | "success" | "warning" | "info" | "danger"> = {
  awaiting_payment: "warning",
  pending_verification: "info",
  partially_paid: "info",
  paid: "success",
  processing: "info",
  completed: "success",
  cancelled: "danger",
  expired: "danger",
  refunded: "default",
  rejected: "danger",
};

export const formatInvoiceStatus = (s: InvoiceStatus) => s.replace(/_/g, " ");
