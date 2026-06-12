import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, Panel, Pill, inputCls } from "@/components/dashboard/ui";
import { SUPPORTED_LANGUAGES, SUPPORTED_COUNTRIES } from "@/i18n/config";
import { Bell, Globe, Languages, Shield, KeyRound, Smartphone, Mail, MessageSquare, Monitor } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account/settings")({
  head: () => ({ meta: [{ title: "Settings — SpaceX IPO Exchange" }] }),
  component: SettingsPage,
});

const devices = [
  { id: "d-1", name: "MacBook Pro 16″", browser: "Chrome 142 · macOS", location: "San Francisco, US", lastActive: "Now", current: true },
  { id: "d-2", name: "iPhone 17 Pro", browser: "Safari · iOS 19", location: "San Francisco, US", lastActive: "2h ago" },
  { id: "d-3", name: "Windows PC", browser: "Edge · Windows 11", location: "New York, US", lastActive: "5d ago" },
];

function SettingsPage() {
  const [prefs, setPrefs] = useState({
    emailInvestments: true, emailSecurity: true, emailMarketing: false,
    smsSecurity: true, smsInvestments: false,
    push: true,
  });
  const [twoFA, setTwoFA] = useState(true);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Personalize your investor portal experience." />

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Language & Region">
          <div className="space-y-3">
            <Field label="Display language" icon={<Languages className="h-4 w-4" />}>
              <select className={inputCls} defaultValue="en">
                {SUPPORTED_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.native}</option>)}
              </select>
            </Field>
            <Field label="Country" icon={<Globe className="h-4 w-4" />}>
              <select className={inputCls} defaultValue="US">
                {SUPPORTED_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
              </select>
            </Field>
            <Field label="Timezone">
              <input className={inputCls} defaultValue="America/Los_Angeles" />
            </Field>
            <Field label="Preferred currency">
              <select className={inputCls} defaultValue="USD">
                {["USD","EUR","GBP","CHF","AED","SGD","JPY","HKD"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <button onClick={() => toast.success("Preferences saved")} className="btn-primary w-full">Save preferences</button>
          </div>
        </Panel>

        <Panel title="Notifications" action={<Bell className="h-4 w-4 text-muted-foreground" />}>
          <div className="space-y-1">
            <Section icon={<Mail className="h-4 w-4" />} title="Email" />
            <Toggle label="Investment updates" v={prefs.emailInvestments} onChange={(v) => setPrefs((p) => ({ ...p, emailInvestments: v }))} />
            <Toggle label="Security alerts" v={prefs.emailSecurity} onChange={(v) => setPrefs((p) => ({ ...p, emailSecurity: v }))} />
            <Toggle label="Marketing & newsletters" v={prefs.emailMarketing} onChange={(v) => setPrefs((p) => ({ ...p, emailMarketing: v }))} />
            <Section icon={<MessageSquare className="h-4 w-4" />} title="SMS" />
            <Toggle label="Security alerts" v={prefs.smsSecurity} onChange={(v) => setPrefs((p) => ({ ...p, smsSecurity: v }))} />
            <Toggle label="Investment updates" v={prefs.smsInvestments} onChange={(v) => setPrefs((p) => ({ ...p, smsInvestments: v }))} />
            <Section icon={<Smartphone className="h-4 w-4" />} title="Push" />
            <Toggle label="Push notifications" v={prefs.push} onChange={(v) => setPrefs((p) => ({ ...p, push: v }))} />
          </div>
        </Panel>

        <Panel title="Security" action={<Shield className="h-4 w-4 text-muted-foreground" />}>
          <div className="space-y-3">
            <Row label="Two-factor authentication" desc="Authenticator app · TOTP">
              <Toggle inline v={twoFA} onChange={setTwoFA} />
            </Row>
            <Row label="Login alerts" desc="Email me on new device sign-in">
              <Toggle inline v={true} />
            </Row>
            <Row label="Session timeout" desc="Auto sign-out after 30 minutes of inactivity">
              <select className="h-8 rounded border border-border bg-surface/60 px-2 text-xs text-foreground">
                <option>15 min</option><option>30 min</option><option>1 hour</option><option>4 hours</option>
              </select>
            </Row>
            <Link to="/account/security" className="block text-xs text-accent-blue hover:underline mt-3">Open full security center →</Link>
          </div>
        </Panel>

        <Panel title="Change Password" action={<KeyRound className="h-4 w-4 text-muted-foreground" />}>
          <div className="space-y-3">
            <Field label="Current password"><input type="password" className={inputCls} /></Field>
            <Field label="New password"><input type="password" className={inputCls} /></Field>
            <Field label="Confirm new password"><input type="password" className={inputCls} /></Field>
            <button onClick={() => toast.success("Password updated")} className="btn-primary w-full">Update password</button>
          </div>
        </Panel>

        <Panel title="Device Management" className="lg:col-span-2" action={<Monitor className="h-4 w-4 text-muted-foreground" />}>
          <ul className="divide-y divide-border">
            {devices.map((d) => (
              <li key={d.id} className="py-3 grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 items-center">
                <div className="h-10 w-10 rounded-md bg-secondary grid place-items-center text-accent-blue shrink-0"><Monitor className="h-4 w-4" /></div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground flex items-center gap-2">
                    {d.name} {d.current && <Pill tone="success">This device</Pill>}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{d.browser} · {d.location} · {d.lastActive}</div>
                </div>
                {!d.current && <button className="h-8 px-3 rounded border border-red-500/30 text-xs font-medium text-red-400 hover:bg-red-500/10">Revoke</button>}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase block mb-1.5 flex items-center gap-1.5">{icon} {label}</span>
      {children}
    </label>
  );
}

function Section({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <div className="pt-3 first:pt-0 pb-1 text-[10px] font-mono tracking-[0.25em] text-muted-foreground flex items-center gap-1.5">{icon} {title.toUpperCase()}</div>;
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <div className="text-sm text-foreground">{label}</div>
        {desc && <div className="text-[11px] text-muted-foreground mt-0.5">{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, v, onChange, inline }: { label?: string; v: boolean; onChange?: (v: boolean) => void; inline?: boolean }) {
  const btn = (
    <button
      onClick={() => onChange?.(!v)}
      className={`h-6 w-11 rounded-full transition-colors relative shrink-0 ${v ? "bg-accent-blue" : "bg-secondary"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${v ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
  if (inline) return btn;
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-foreground">{label}</span>
      {btn}
    </div>
  );
}
