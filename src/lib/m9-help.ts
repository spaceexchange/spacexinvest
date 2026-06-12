// Help Center + Achievements browser helpers.
import { supabase } from "@/integrations/supabase/client";

export type HelpArticle = {
  id: string; slug: string; title: string; category: string; summary: string | null;
  body: string; tags: string[]; view_count: number; published: boolean;
};

export async function listHelpArticles(opts?: { category?: string; search?: string }) {
  let q = supabase.from("help_articles").select("*").eq("published", true).order("category").order("title").limit(200);
  if (opts?.category) q = q.eq("category", opts.category);
  if (opts?.search) q = q.or(`title.ilike.%${opts.search}%,summary.ilike.%${opts.search}%,body.ilike.%${opts.search}%`);
  const { data } = await q;
  return (data ?? []) as HelpArticle[];
}

export async function getHelpArticle(slug: string) {
  const { data } = await supabase.from("help_articles").select("*").eq("slug", slug).maybeSingle();
  if (data) await supabase.from("help_articles").update({ view_count: (data.view_count ?? 0) + 1 }).eq("id", data.id);
  return data as HelpArticle | null;
}

export async function helpCategories() {
  const { data } = await supabase.from("help_articles").select("category").eq("published", true);
  return Array.from(new Set((data ?? []).map((r: any) => r.category))).sort();
}

// ---- Achievements ----
export type Achievement = {
  id: string; code: string; title: string; description: string; category: string;
  points: number; tier: string; icon: string | null; criteria: any; active: boolean;
};

export async function listAchievements() {
  const { data } = await supabase.from("achievements").select("*").eq("active", true).order("category").order("points");
  return (data ?? []) as Achievement[];
}

export async function listMyAchievements() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("user_achievements")
    .select("*, achievement:achievements(*)")
    .eq("user_id", user.id)
    .order("awarded_at", { ascending: false });
  return data ?? [];
}

export async function leaderboardAchievements(limit = 20) {
  const { data } = await supabase.from("user_achievements").select("user_id");
  const counts = new Map<string, number>();
  (data ?? []).forEach((r: any) => counts.set(r.user_id, (counts.get(r.user_id) ?? 0) + 1));
  const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit);
  if (!top.length) return [];
  const { data: profs } = await supabase.from("profiles").select("id,display_name,first_name,last_name").in("id", top.map(([id]) => id));
  const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
  return top.map(([id, n], i) => {
    const p: any = map.get(id);
    return { rank: i + 1, user_id: id, name: p?.display_name || [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "Investor", count: n };
  });
}

// ---- Automation runs (admin) ----
export async function listAutomationRuns(rule_id?: string, limit = 100) {
  let q = supabase.from("automation_runs").select("*, rule:automation_rules(name,trigger_event)").order("created_at", { ascending: false }).limit(limit);
  if (rule_id) q = q.eq("rule_id", rule_id);
  const { data } = await q;
  return data ?? [];
}
