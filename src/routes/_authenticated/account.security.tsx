import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, Smartphone, Activity, Lock, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/account/security")({
  head: () => ({ meta: [{ title: "Security — SpaceX IPO Exchange" }] }),
  component: SecurityPage,
});

interface Event { id: string; event_type: string; created_at: string; ip_address: string | null; user_agent: string | null }
interface Device { id: string; device_name: string | null; browser: string | null; os: string | null; last_seen_at: string; trusted: boolean }

function SecurityPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [twoFA, setTwoFA] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const [{ data: evs }, { data: devs }, { data: prof }] = await Promise.all([
        supabase.from("security_events").select("*").eq("user_id", u.user.id).order("created_at", { ascending: false }).limit(20),
        supabase.from("user_devices").select("*").eq("user_id", u.user.id).order("last_seen_at", { ascending: false }),
        supabase.from("profiles").select("two_factor_enabled").eq("id", u.user.id).maybeSingle(),
      ]);
      setEvents(evs ?? []);
      setDevices(devs ?? []);
      setTwoFA(!!prof?.two_factor_enabled);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Security Center</h1>
        <p className="text-sm text-muted-foreground">Manage two-factor authentication, devices and account activity.</p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        <Action icon={<Shield className="h-5 w-5" />} title="Two-factor authentication" desc={twoFA ? "TOTP authenticator is active" : "Add an extra layer of security"} to="/auth/two-factor" status={twoFA ? "on" : "off"} />
        <Action icon={<Mail className="h-5 w-5" />} title="Verify email" desc="Confirm your email address" to="/auth/verify-email" />
        <Action icon={<Smartphone className="h-5 w-5" />} title="Verify phone" desc="Receive SMS-based 2FA codes" to="/auth/verify-phone" />
        <Action icon={<Lock className="h-5 w-5" />} title="Change password" desc="Update your password" to="/auth/forgot-password" />
      </div>

      <section className="glass-card rounded-xl p-6">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4"><Smartphone className="h-4 w-4" /> Trusted devices</h2>
        {devices.length === 0 ? <p className="text-sm text-muted-foreground">No devices recorded yet.</p> : (
          <ul className="space-y-2">
            {devices.map((d) => (
              <li key={d.id} className="flex items-center justify-between text-sm border border-border/60 rounded-md px-3 py-2.5">
                <div>
                  <div className="text-foreground">{d.device_name ?? `${d.browser} on ${d.os}`}</div>
                  <div className="text-[11px] text-muted-foreground">Last seen {new Date(d.last_seen_at).toLocaleString()}</div>
                </div>
                <span className={`text-[10px] font-mono tracking-[0.2em] ${d.trusted ? "text-emerald-400" : "text-muted-foreground"}`}>
                  {d.trusted ? "TRUSTED" : "RECOGNIZED"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="glass-card rounded-xl p-6">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4"><Activity className="h-4 w-4" /> Recent activity</h2>
        {events.length === 0 ? <p className="text-sm text-muted-foreground">No activity recorded yet.</p> : (
          <ul className="divide-y divide-border/60">
            {events.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <div className="text-foreground capitalize">{e.event_type.replace(/_/g, " ")}</div>
                  <div className="text-[11px] text-muted-foreground truncate max-w-md">{e.user_agent}</div>
                </div>
                <span className="text-[11px] text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Action({ icon, title, desc, to, status }: { icon: React.ReactNode; title: string; desc: string; to: string; status?: "on" | "off" }) {
  return (
    <Link to={to} className="glass-card rounded-xl p-5 flex items-start gap-3 hover:border-accent-blue/40 transition-colors">
      <div className="h-10 w-10 rounded-md bg-accent-blue/10 grid place-items-center text-accent-blue">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
      {status && (
        <span className={`text-[10px] font-mono tracking-[0.2em] ${status === "on" ? "text-emerald-400" : "text-yellow-400"}`}>{status.toUpperCase()}</span>
      )}
    </Link>
  );
}
