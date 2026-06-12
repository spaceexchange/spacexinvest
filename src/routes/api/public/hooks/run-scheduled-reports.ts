// Cron: pg_cron pings this on a schedule. Runs due scheduled_reports, materializes CSV to storage.
// SECURITY: requires HMAC SHA-256 signed POST. See src/lib/webhook-auth.ts.
import { createFileRoute } from "@tanstack/react-router";
import { verifyWebhookRequest, rejectionResponse } from "@/lib/webhook-auth";

export const Route = createFileRoute("/api/public/hooks/run-scheduled-reports")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { result } = await verifyWebhookRequest(request);
        if (!result.ok) {
          console.warn("[run-scheduled-reports] rejected:", result.reason);
          return rejectionResponse(result.reason, result.status);
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const sb = supabaseAdmin as any;
        const now = new Date();
        const { data: due, error } = await sb.from("scheduled_reports").select("*").eq("active", true).limit(50);
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

        const results: any[] = [];
        for (const rep of due ?? []) {
          if (!isDue(rep.schedule, rep.last_run_at, now)) continue;
          const runStart = new Date();
          let status = "success"; let error_msg: string | null = null; let rows = 0; let file_url: string | null = null;
          try {
            const rangeDays = (rep.filters?.range_days as number | undefined) ?? 30;
            const since = new Date(Date.now() - rangeDays * 86400000).toISOString();
            const dataset = await collectDataset(sb, rep.report_type, since);
            rows = dataset.length;
            const csv = toCsv(dataset);
            file_url = `${rep.id}/${runStart.toISOString().replace(/[:.]/g, "-")}.csv`;
            const { error: upErr } = await sb.storage.from("reports").upload(file_url, new Blob([csv], { type: "text/csv" }), { upsert: true, contentType: "text/csv" });
            if (upErr) throw upErr;
          } catch (e: any) {
            status = "failed"; error_msg = e?.message ?? String(e);
          }

          await sb.from("report_runs").insert({
            scheduled_report_id: rep.id, status, row_count: rows,
            file_url, bucket: "reports", report_type: rep.report_type,
            format: rep.format ?? "csv", filters: { ...(rep.filters ?? {}), error: error_msg },
          });
          await sb.from("scheduled_reports").update({ last_run_at: runStart.toISOString(), last_status: status }).eq("id", rep.id);

          if (rep.created_by) {
            await sb.from("notifications").insert({
              user_id: rep.created_by, notification_type: "system", category: "report",
              title: status === "success" ? `Report generated: ${rep.report_type}` : `Report failed: ${rep.report_type}`,
              message: status === "success" ? `${rows} rows. CSV saved to reports bucket.` : (error_msg ?? "Unknown error"),
              link: "/finance/reports",
            });
          }
          await sb.from("audit_logs").insert({
            actor_role: "system", action_type: "scheduled_report.run",
            entity_type: "scheduled_report", entity_id: rep.id,
            metadata: { status, rows, file_url },
          });
          results.push({ id: rep.id, status, rows });
        }
        return Response.json({ ok: true, processed: results.length, results });
      },
    },
  },
});

function isDue(schedule: string, lastRunAt: string | null, now: Date): boolean {
  if (!lastRunAt) return true;
  const last = new Date(lastRunAt).getTime();
  const ms = now.getTime() - last;
  if (schedule === "daily") return ms >= 23 * 3600 * 1000;
  if (schedule === "weekly") return ms >= 6.9 * 24 * 3600 * 1000;
  if (schedule === "monthly") return ms >= 27 * 24 * 3600 * 1000;
  return ms >= 23 * 3600 * 1000;
}

async function collectDataset(sb: any, type: string, since: string): Promise<any[]> {
  switch (type) {
    case "deposits": return (await sb.from("funding_requests").select("id,user_id,amount,currency,status,workflow_stage,created_at").eq("request_type", "deposit").gte("created_at", since)).data ?? [];
    case "withdrawals": return (await sb.from("funding_requests").select("id,user_id,amount,currency,status,workflow_stage,created_at").eq("request_type", "withdrawal").gte("created_at", since)).data ?? [];
    case "investments": return (await sb.from("investments").select("id,investor_id,opportunity_id,amount,shares,status,approval_status,created_at").gte("created_at", since)).data ?? [];
    case "wallets": return (await sb.from("wallets").select("user_id,currency,balance,status,updated_at")).data ?? [];
    case "audit": return (await sb.from("audit_logs").select("id,actor_id,actor_role,action_type,entity_type,entity_id,created_at").gte("created_at", since)).data ?? [];
    case "compliance": return (await sb.from("kyc_submissions").select("id,user_id,status,submitted_at,reviewed_at").gte("submitted_at", since)).data ?? [];
    default: return [];
  }
}

function toCsv(rows: any[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}
