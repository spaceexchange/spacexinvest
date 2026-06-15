import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "visitor" | "registered" | "verified" | "vip"
  | "employee" | "support" | "compliance" | "finance"
  | "admin" | "super_admin";
export type Portal = "admin" | "support" | "compliance" | "finance" | "employee" | "investor";

export async function fetchUserRoles(userId: string): Promise<AppRole[]> {
  console.log("ROLE CHECK USER ID:", userId);
  const { data } = await supabase
  .from("user_roles")
  .select("role")
  .eq("user_id", userId);

console.log("ROLES FOUND:", data);

return (data ?? []).map((r: any) => r.role as AppRole);
}

export function resolvePortal(roles: AppRole[]): Portal {
  if (roles.includes("super_admin") || roles.includes("admin")) return "admin";
  if (roles.includes("compliance")) return "compliance";
  if (roles.includes("finance")) return "finance";
  if (roles.includes("support")) return "support";
  if (roles.includes("employee")) return "employee";
  return "investor";
}

export function portalPath(p: Portal): string {
  return p === "admin" ? "/admin/dashboard"
    : p === "compliance" ? "/compliance/dashboard"
    : p === "finance" ? "/finance/dashboard"
    : p === "support" ? "/support/dashboard"
    : p === "employee" ? "/employee/dashboard"
    : "/account/dashboard";
}

export async function getRedirectAfterLogin(userId: string): Promise<string> {
  const roles = await fetchUserRoles(userId);
  return portalPath(resolvePortal(roles));
}
