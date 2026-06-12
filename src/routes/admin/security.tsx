import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Pill, DataTable, Td, btnPrimary, btnSecondary, btnGhost, inputCls, statusTone } from "@/components/staff/ui";
import { securityDashboard, severityFor } from "@/lib/staff-data";
import { staffGetAllUsers } from "@/lib/data/portal";
import { useServerFn } from "@tanstack/react-start";
import { setAccountSuspension, forcePasswordReset, revokeUserSessions } from "@/lib/data/ops.functions";
import { useRealtimeChannel } from "@/lib/data/portal";
import { ShieldAlert, ShieldOff, KeyRound, LogOut, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/security")({ component: SecurityCenter });

function SecurityCenter() {
  const [s, setS] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const suspendFn = useServerFn(setAccountSuspension);
  const resetFn = useServerFn(forcePasswordReset);
  const revokeFn = useServerFn(revokeUserSessions);

  const reload = async () => {
    setS(await securityDashboard());
    setUsers(await staffGetAllUsers(300));
  };
  useEffect(() => { reload(); }, []);
  useRealtimeChannel("sec-feed", [{ table: "security_events" }], reload);

  const filtered = users.filter((u) => !q || `${u.email} ${u.display_name ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  const suspend = async (u: any, on: boolean) => {
    const reason = on ? prompt("Suspension reason?") ?? "" : "";
    try { await suspendFn({ data: { user_id: u.id, suspend: on, reason } }); toast.success(on ? "Suspended" : "Reactivated"); reload(); }
    catch (e: any) { toast.error(e.message); }
  };
  const reset = async (u: any) => {
    try { await resetFn({ data: { user_id: u.id, email: u.email } }); toast.success("Password reset triggered"); }
    catch (e: any) { toast.error(e.message); }
  };
  const revoke = async (u: any) => {
    if (!confirm("Revoke all sessions?")) return;
    try { await revokeFn({ data: { user_id: u.id } }); toast.success("Sessions revoked"); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <PageHeader eyebrow="GOVERNANCE" title="Security Center" subtitle="Threat detection, account controls, MFA adoption and live security feed." />

      {s && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <Stat label="Failed logins (24h)" value={s.failedLogins} tone="warning" />
          <Stat label="Suspended accounts" value={s.suspendedAccounts} tone="danger" />
          <Stat label="MFA adoption" value={`${(s.mfaAdoption * 100).toFixed(0)}%`} tone="info" />
          <Stat label="High-risk users" value={s.highRiskUsers.length} tone="danger" />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <Panel title="Recent security events" padded={false}>
          <DataTable columns={["Event", "User", "Severity", "IP", "Time"]}>
            {(s?.recentEvents ?? []).map((e: any) => {
              const sev = severityFor(e.event_type);
              return (
                <tr key={e.id}>
                  <Td><Pill tone="info">{e.event_type}</Pill></Td>
                  <Td><span className="text-xs">{e.profile?.email ?? e.user_id?.slice(0, 8) ?? "—"}</span></Td>
                  <Td><Pill tone={sev === "critical" || sev === "high" ? "danger" : sev === "medium" ? "warning" : "default"}>{sev}</Pill></Td>
                  <Td><span className="font-mono text-xs">{e.ip_address ?? "—"}</span></Td>
                  <Td><span className="text-[11px] text-muted-foreground font-mono">{new Date(e.created_at).toLocaleString()}</span></Td>
                </tr>
              );
            })}
          </DataTable>
          {(!s?.recentEvents || s.recentEvents.length === 0) && <div className="py-8 text-center text-sm text-muted-foreground">No events.</div>}
        </Panel>

        <Panel title="Failed login attempts" padded={false}>
          <DataTable columns={["Identifier", "IP", "Result", "Time"]}>
            {(s?.recentLogins ?? []).slice(0, 30).map((l: any, i: number) => (
              <tr key={i}>
                <Td><span className="text-xs">{l.identifier}</span></Td>
                <Td><span className="font-mono text-xs">{l.ip_address ?? "—"}</span></Td>
                <Td><Pill tone={l.success ? "success" : "danger"}>{l.success ? "ok" : "failed"}</Pill></Td>
                <Td><span className="text-[11px] text-muted-foreground font-mono">{new Date(l.attempted_at).toLocaleString()}</span></Td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      </div>

      {s?.highRiskUsers?.length > 0 && (
        <Panel title="High-risk identifiers (5+ failed logins / 24h)" className="mb-5">
          <div className="flex flex-wrap gap-2">
            {s.highRiskUsers.map((u: any) => (
              <Pill key={u.identifier} tone="danger">
                <ShieldAlert className="h-3 w-3 inline mr-1" />{u.identifier} · {u.failed} fails
              </Pill>
            ))}
          </div>
        </Panel>
      )}

      <Panel title="Account controls" padded={false}>
        <div className="px-5 pt-4 pb-2 flex items-center gap-2">
          <input className={`${inputCls} flex-1`} placeholder="Search users by email or name" value={q} onChange={(e) => setQ(e.target.value)} />
          <span className="text-xs text-muted-foreground">{filtered.length} users</span>
        </div>
        <DataTable columns={["User", "Status", "KYC", "MFA", "Created", "Actions"]}>
          {filtered.slice(0, 50).map((u: any) => (
            <tr key={u.id}>
              <Td>
                <div className="text-sm font-medium">{u.display_name ?? u.email}</div>
                <div className="text-[11px] text-muted-foreground">{u.email}</div>
              </Td>
              <Td><Pill tone={statusTone(u.account_status ?? "active")}>{u.account_status ?? "active"}</Pill></Td>
              <Td><Pill tone={statusTone(u.kyc_status)}>{u.kyc_status}</Pill></Td>
              <Td><Pill tone={u.two_factor_enabled ? "success" : "neutral"}>{u.two_factor_enabled ? "on" : "off"}</Pill></Td>
              <Td><span className="text-xs text-muted-foreground font-mono">{new Date(u.created_at).toLocaleDateString()}</span></Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  {u.account_status === "suspended"
                    ? <button className={btnSecondary} style={{ height: 28 }} onClick={() => suspend(u, false)}><Lock className="h-3 w-3" /> Unsuspend</button>
                    : <button className={btnGhost} onClick={() => suspend(u, true)}><ShieldOff className="h-3.5 w-3.5" /> Suspend</button>}
                  <button className={btnGhost} onClick={() => reset(u)}><KeyRound className="h-3.5 w-3.5" /> Reset PW</button>
                  <button className={btnGhost} onClick={() => revoke(u)}><LogOut className="h-3.5 w-3.5" /> Revoke</button>
                </div>
              </Td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}

function Stat({ label, value, tone }: any) {
  const color = tone === "danger" ? "text-red-400" : tone === "warning" ? "text-yellow-400" : tone === "success" ? "text-emerald-400" : "text-accent-blue";
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="text-[10px] font-mono tracking-[0.25em] text-muted-foreground uppercase mb-1">{label}</div>
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}
