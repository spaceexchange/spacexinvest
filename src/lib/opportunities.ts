// Opportunity helpers + browser queries.
import { supabase } from "@/integrations/supabase/client";

export const OPP_STATUSES = ["draft", "pending_review", "active", "paused", "closed", "fully_funded", "archived"] as const;
export type OppStatus = typeof OPP_STATUSES[number];

// Legacy DB status values used by existing reads
export const LEGACY_OPEN = ["open", "active", "funded"];

export const RISK_LEVELS = ["low", "medium", "high"] as const;
export const INVESTMENT_TYPES = ["shares", "bond", "fund", "spv", "convertible"] as const;
export const INDUSTRIES = ["Aerospace", "Energy", "AI", "Mobility", "Biotech", "Real Estate", "Fintech", "Defense", "Other"];

export function slugify(s: string): string {
  return (s ?? "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export async function listOpportunitiesPublic() {
  const { data } = await supabase
    .from("investment_opportunities")
    .select("*")
    .in("status", ["active", "open", "funded", "closed", "fully_funded"])
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function listOpportunitiesAdmin() {
  const { data } = await supabase
    .from("investment_opportunities")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getOpportunityBySlugOrId(slugOrId: string) {
  // try slug first
  const { data: bySlug } = await supabase.from("investment_opportunities").select("*").eq("slug", slugOrId).maybeSingle();
  if (bySlug) return bySlug;
  const { data: byId } = await supabase.from("investment_opportunities").select("*").eq("id", slugOrId).maybeSingle();
  return byId;
}

export async function getOpportunityDocuments(opportunityId: string) {
  const { data } = await supabase.from("opportunity_documents").select("*").eq("opportunity_id", opportunityId).order("created_at", { ascending: false });
  return data ?? [];
}

export async function getOpportunityInvestors(opportunityId: string) {
  const { data } = await supabase.from("investments").select("id,amount,shares,investor_id,created_at,approval_status").eq("opportunity_id", opportunityId);
  return data ?? [];
}

export async function getOppMediaSignedUrl(path: string, bucket = "opportunity-media") {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function uploadOppMedia(file: File, opportunityId: string, bucket = "opportunity-media") {
  const path = `${opportunityId}/${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
  const up = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (up.error) throw up.error;
  return path;
}

export async function uploadOppDocument(file: File, opportunityId: string) {
  const path = `${opportunityId}/${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
  const up = await supabase.storage.from("opportunity-documents").upload(path, file, { upsert: false });
  if (up.error) throw up.error;
  return path;
}
