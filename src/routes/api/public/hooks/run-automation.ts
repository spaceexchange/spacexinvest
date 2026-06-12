// Cron: executes enabled automation_rules. Supports event-driven (cursor-based) and scheduled rules.
// Actions supported: notify_user, notify_admins, create_compliance_case, update_lead_stage, award_achievement, send_email_stub.
// SECURITY: requires HMAC SHA-256 signed POST. See src/lib/webhook-auth.ts.
import { createFileRoute } from "@tanstack/react-router";
import { verifyWebhookRequest, rejectionResponse } from "@/lib/webhook-auth";

type Rule = {
  id: string;
  name: string;
  trigger_event: string;
  conditions: any;
  actions: any[];
  enabled: boolean;
  last_run_at: string | null;
  run_count: number;
};

export const Route = createFileRoute("/api/public/hooks/run-automation")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { result } = await verifyWebhookRequest(request);
        if (!result.ok) {
          console.warn("[run-automation] rejected:", result.reason);
          return rejectionResponse(result.reason, result.status);
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const sb = supabaseAdmin as any;
        const { data: rules } = await sb.from("automation_rules").select("*").eq("enabled", true);
        const out: any[] = [];

        for (const rule of (rules ?? []) as Rule[]) {
          const since = rule.last_run_at ?? new Date(Date.now() - 24 * 3600 * 1000).toISOString();
          const events = await fetchTriggerEvents(sb, rule.trigger_event, since);
          for (const ev of events) {
            const t0 = Date.now();
            try {
              if (!matchConditions(rule.conditions, ev)) continue;
              const result = await executeActions(sb, rule.actions ?? [], ev, rule);
              await sb.from("automation_runs").insert({
                rule_id: rule.id, trigger: rule.trigger_event, status: "success",
                payload: ev, result, duration_ms: Date.now() - t0,
              });
              out.push({ rule: rule.name, event: rule.trigger_event, status: "success" });
            } catch (e: any) {
              await sb.from("automation_runs").insert({
                rule_id: rule.id, trigger: rule.trigger_event, status: "failed",
                payload: ev, error: e?.message ?? String(e), duration_ms: Date.now() - t0,
              });
              out.push({ rule: rule.name, status: "failed", error: e?.message });
            }
          }
          await sb.from("automation_rules").update({
            last_run_at: new Date().toISOString(),
            run_count: (rule.run_count ?? 0) + events.length,
          }).eq("id", rule.id);
        }
        return Response.json({ ok: true, runs: out.length, details: out });
      },
    },
  },
});

async function fetchTriggerEvents(sb: any, trigger: string, since: string): Promise<any[]> {
  switch (trigger) {
    case "investment.created": {
      const { data } = await sb.from("investments").select("id,user_id,amount,opportunity_id,created_at,approval_status").gte("created_at", since);
      return data ?? [];
    }
    case "kyc.approved": {
      const { data } = await sb.from("kyc_submissions").select("id,user_id,status,reviewed_at").eq("status", "approved").gte("reviewed_at", since);
      return data ?? [];
    }
    case "funding.large_deposit": {
      const { data } = await sb.from("funding_requests").select("id,user_id,amount,currency,request_type,created_at,status").eq("request_type", "deposit").gte("created_at", since);
      return data ?? [];
    }
    case "lead.created": {
      const { data } = await sb.from("crm_leads").select("id,email,full_name,status,created_at").gte("created_at", since);
      return data ?? [];
    }
    case "schedule.daily":
    case "schedule.hourly":
      return [{ scheduled_at: new Date().toISOString() }];
    default:
      return [];
  }
}

function matchConditions(conds: any, ev: any): boolean {
  if (!conds || typeof conds !== "object") return true;
  for (const [k, v] of Object.entries(conds)) {
    if (k === "min_amount" && Number(ev.amount ?? 0) < Number(v)) return false;
    if (k === "max_amount" && Number(ev.amount ?? 0) > Number(v)) return false;
    if (k === "currency" && ev.currency !== v) return false;
    if (k === "status" && ev.status !== v) return false;
  }
  return true;
}

async function executeActions(sb: any, actions: any[], ev: any, rule: Rule): Promise<any> {
  const results: any[] = [];
  for (const a of actions) {
    switch (a?.type) {
      case "notify_user": {
        if (!ev.user_id) break;
        await sb.from("notifications").insert({
          user_id: ev.user_id,
          title: tpl(a.title ?? rule.name, ev),
          message: tpl(a.message ?? "Automated notification", ev),
          notification_type: a.notification_type ?? "system",
          category: a.category ?? "automation",
          metadata: { rule_id: rule.id, event: ev },
        });
        results.push({ type: "notify_user", user_id: ev.user_id });
        break;
      }
      case "notify_admins": {
        const { data: admins } = await sb.from("user_roles").select("user_id").eq("role", "admin");
        const rows = (admins ?? []).map((r: any) => ({
          user_id: r.user_id,
          title: tpl(a.title ?? `Alert: ${rule.name}`, ev),
          message: tpl(a.message ?? JSON.stringify(ev), ev),
          notification_type: "system",
          category: "automation",
          metadata: { rule_id: rule.id, event: ev },
        }));
        if (rows.length) await sb.from("notifications").insert(rows);
        results.push({ type: "notify_admins", count: rows.length });
        break;
      }
      case "create_compliance_case": {
        await sb.from("compliance_cases").insert({
          subject_user_id: ev.user_id ?? null,
          case_type: a.case_type ?? "aml_review",
          severity: a.severity ?? "medium",
          title: tpl(a.title ?? `Auto-opened by ${rule.name}`, ev),
          description: tpl(a.description ?? "Created by automation rule.", ev),
          risk_flags: a.risk_flags ?? [],
        });
        results.push({ type: "create_compliance_case" });
        break;
      }
      case "update_lead_stage": {
        if (ev.id) await sb.from("crm_leads").update({ lifecycle_stage: a.stage, status: a.status }).eq("id", ev.id);
        results.push({ type: "update_lead_stage" });
        break;
      }
      case "award_achievement": {
        if (ev.user_id && a.code) {
          await sb.rpc("award_achievement", { _user_id: ev.user_id, _code: a.code });
          results.push({ type: "award_achievement", code: a.code });
        }
        break;
      }
      default:
        results.push({ type: a?.type ?? "unknown", skipped: true });
    }
  }
  return { actions: results };
}

function tpl(str: string, ev: any): string {
  return str.replace(/\{(\w+)\}/g, (_, k) => String(ev?.[k] ?? ""));
}
