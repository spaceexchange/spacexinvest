import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel } from "@/components/dashboard/ui";
import { notificationPreferences, setNotificationPreference } from "@/lib/m7";
import { toast } from "sonner";
import { Bell, Mail, Smartphone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account/notification-preferences")({
  head: () => ({ meta: [{ title: "Notification Preferences — SpaceX IPO Exchange" }] }),
  component: PrefsPage,
});

const CATEGORIES = [
  { key: "investment", label: "Investment activity", desc: "Allocations, approvals and opportunity updates." },
  { key: "funding", label: "Deposits & withdrawals", desc: "Status changes and confirmations." },
  { key: "security", label: "Security alerts", desc: "Login attempts, MFA, account changes." },
  { key: "verification", label: "KYC & verification", desc: "Status of document and identity reviews." },
  { key: "announcements", label: "Announcements", desc: "Platform news and bulletins." },
  { key: "support", label: "Support replies", desc: "Updates on your tickets." },
  { key: "system", label: "System & maintenance", desc: "Planned downtime and product changes." },
];

function PrefsPage() {
  const [prefs, setPrefs] = useState<Record<string, any>>({});
  const reload = async () => {
    const rows = await notificationPreferences();
    const map: any = {};
    for (const r of rows) map[r.category] = r;
    setPrefs(map);
  };
  useEffect(() => { reload(); }, []);

  const update = async (category: string, patch: any) => {
    try { await setNotificationPreference(category, patch); await reload(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <PageHeader title="Notification Preferences" subtitle="Choose how you want to be notified for each category." />
      <Panel>
        <div className="divide-y divide-border">
          {CATEGORIES.map((c) => {
            const p = prefs[c.key] ?? { in_app: true, email: true, push: false };
            return (
              <div key={c.key} className="py-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center">
                <div>
                  <div className="font-medium text-foreground">{c.label}</div>
                  <div className="text-xs text-muted-foreground">{c.desc}</div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Toggle icon={<Bell className="h-3 w-3" />} label="In-app" on={p.in_app !== false} onChange={(v) => update(c.key, { in_app: v })} />
                  <Toggle icon={<Mail className="h-3 w-3" />} label="Email" on={p.email !== false} onChange={(v) => update(c.key, { email: v })} />
                  <Toggle icon={<Smartphone className="h-3 w-3" />} label="Push" on={p.push === true} onChange={(v) => update(c.key, { push: v })} />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function Toggle({ icon, label, on, onChange }: { icon: any; label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md border text-xs font-medium transition-colors ${on ? "bg-accent-blue/15 border-accent-blue/30 text-accent-blue" : "bg-secondary border-border text-muted-foreground"}`}>
      {icon}{label}
    </button>
  );
}
