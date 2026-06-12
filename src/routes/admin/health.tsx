import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Pill } from "@/components/staff/ui";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Database, Zap, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin/health")({ component: HealthPage });

function HealthPage() {
  const [checks, setChecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const run = async () => {
    setLoading(true);
    const start = Date.now();
    const results: any[] = [];

    // DB latency
    const t0 = Date.now();
    const { error: pingErr } = await supabase.from("profiles").select("id", { head: true, count: "exact" }).limit(1);
    results.push({ name: "Database connectivity", status: pingErr ? "down" : "ok", detail: pingErr?.message ?? `${Date.now() - t0}ms`, icon: <Database className="h-4 w-4" /> });

    // Realtime
    const realtimeOk = await new Promise<boolean>((resolve) => {
      const ch = supabase.channel(`health-${Math.random()}`);
      const timer = setTimeout(() => { supabase.removeChannel(ch); resolve(false); }, 3000);
      ch.subscribe((status) => {
        if (status === "SUBSCRIBED") { clearTimeout(timer); supabase.removeChannel(ch); resolve(true); }
      });
    });
    results.push({ name: "Realtime channel", status: realtimeOk ? "ok" : "degraded", detail: realtimeOk ? "subscribed" : "no ack within 3s", icon: <Zap className="h-4 w-4" /> });

    // Recent error events from audit_logs (action_type contains 'error' or 'fail')
    const since = new Date(Date.now() - 3600_000).toISOString();
    const { count: errors } = await supabase.from("audit_logs").select("id", { head: true, count: "exact" }).gte("created_at", since).or("action_type.ilike.%error%,action_type.ilike.%fail%");
    results.push({ name: "Errors (1h)", status: (errors ?? 0) > 50 ? "degraded" : "ok", detail: `${errors ?? 0} error events`, icon: <AlertTriangle className="h-4 w-4" /> });

    // Pending funding queue
    const { count: pendDep } = await supabase.from("funding_requests").select("id", { head: true, count: "exact" }).eq("status", "pending").eq("request_type", "deposit");
    const { count: pendWd } = await supabase.from("funding_requests").select("id", { head: true, count: "exact" }).eq("status", "pending").eq("request_type", "withdrawal");
    results.push({ name: "Pending deposits", status: (pendDep ?? 0) > 20 ? "degraded" : "ok", detail: `${pendDep ?? 0} pending`, icon: <Activity className="h-4 w-4" /> });
    results.push({ name: "Pending withdrawals", status: (pendWd ?? 0) > 20 ? "degraded" : "ok", detail: `${pendWd ?? 0} pending`, icon: <Activity className="h-4 w-4" /> });

    // KYC queue
    const { count: kycPend } = await supabase.from("kyc_submissions").select("id", { head: true, count: "exact" }).eq("status", "pending");
    results.push({ name: "KYC queue", status: (kycPend ?? 0) > 30 ? "degraded" : "ok", detail: `${kycPend ?? 0} pending`, icon: <Activity className="h-4 w-4" /> });

    setChecks(results);
    setLoading(false);
    console.log(`Health checks completed in ${Date.now() - start}ms`);
  };

  useEffect(() => { run(); const t = setInterval(run, 30_000); return () => clearInterval(t); }, []);

  const allOk = checks.every((c) => c.status === "ok");
  return (
    <div>
      <PageHeader eyebrow="OPERATIONS" title="System Health" subtitle="Live infrastructure and operational metrics. Refreshes every 30s." />

      <Panel className="mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${allOk ? "bg-emerald-400" : "bg-yellow-400"} ${loading ? "animate-pulse" : ""}`} />
            <div>
              <div className="font-semibold">{allOk ? "All systems operational" : "Some systems degraded"}</div>
              <div className="text-xs text-muted-foreground">{checks.length} checks · last run {new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid md:grid-cols-2 gap-3">
        {checks.map((c, i) => (
          <Panel key={i}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-accent-blue">{c.icon}</span>
                <div>
                  <div className="font-medium text-sm">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.detail}</div>
                </div>
              </div>
              <Pill tone={c.status === "ok" ? "success" : c.status === "down" ? "danger" : "warning"}>{c.status}</Pill>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
