import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader, Panel, Pill } from "@/components/dashboard/ui";
import { supabase } from "@/integrations/supabase/client";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/data/portal";
import { archiveNotification } from "@/lib/m7";
import { Bell, TrendingUp, ShieldAlert, Info, BadgeCheck, Inbox, Archive, ArchiveRestore, Sparkles, Users, Megaphone, Banknote, FileCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account/notifications")({
  head: () => ({ meta: [{ title: "Notifications — SpaceX IPO Exchange" }] }),
  component: NotificationsPage,
});

const CATEGORIES = [
  { key: "All", icon: <Bell className="h-3.5 w-3.5" /> },
  { key: "investment", icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { key: "funding", icon: <Banknote className="h-3.5 w-3.5" /> },
  { key: "withdrawal", icon: <Banknote className="h-3.5 w-3.5" /> },
  { key: "compliance", icon: <FileCheck className="h-3.5 w-3.5" /> },
  { key: "security", icon: <ShieldAlert className="h-3.5 w-3.5" /> },
  { key: "verification", icon: <BadgeCheck className="h-3.5 w-3.5" /> },
  { key: "rewards", icon: <Sparkles className="h-3.5 w-3.5" /> },
  { key: "referrals", icon: <Users className="h-3.5 w-3.5" /> },
  { key: "announcements", icon: <Megaphone className="h-3.5 w-3.5" /> },
  { key: "system", icon: <Info className="h-3.5 w-3.5" /> },
];

const iconFor = (t: string) => CATEGORIES.find((c) => c.key === t)?.icon ?? <Bell className="h-4 w-4" />;

function NotificationsPage() {
  const [tab, setTab] = useState("All");
  const [view, setView] = useState<"inbox" | "unread" | "archived">("inbox");
  const [days, setDays] = useState<number>(30);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const since = new Date(Date.now() - days * 86400_000).toISOString();
    const { data } = await supabase.from("notifications")
      .select("*").gte("created_at", since)
      .order("created_at", { ascending: false }).limit(500);
    setItems(data ?? []);
    setLoading(false);
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [days]);

  const list = useMemo(() => {
    let l = items;
    if (view === "inbox") l = l.filter((n) => !n.archived);
    else if (view === "unread") l = l.filter((n) => !n.read_status && !n.archived);
    else l = l.filter((n) => n.archived);
    if (tab !== "All") l = l.filter((n) => (n.category ?? n.notification_type) === tab);
    return l;
  }, [items, view, tab]);

  const unread = items.filter((n) => !n.read_status && !n.archived).length;

  async function markRead(id: string) { await markNotificationRead(id); refresh(); }
  async function markAll() { await markAllNotificationsRead(); toast.success("All marked read"); refresh(); }
  async function archive(id: string) { await archiveNotification(id); refresh(); }
  async function restore(id: string) {
    await supabase.from("notifications").update({ archived: false }).eq("id", id);
    refresh();
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread · last ${days} days`}
        action={
          <div className="flex gap-2">
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="h-9 px-2 rounded-md border border-border bg-secondary text-xs">
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={365}>1 year</option>
            </select>
            <button onClick={markAll} className="h-9 px-3 rounded-md border border-border text-xs font-medium hover:border-accent-blue/40 hover:text-accent-blue transition-colors">Mark all read</button>
          </div>
        }
      />

      <div className="flex gap-2 mb-3">
        {(["inbox","unread","archived"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} className={`h-9 px-3 rounded-md text-xs font-medium capitalize transition-colors ${view === v ? "bg-accent-blue text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{v}</button>
        ))}
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button key={c.key} onClick={() => setTab(c.key)} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium whitespace-nowrap capitalize transition-colors ${tab === c.key ? "bg-accent-blue text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {c.icon}{c.key}
          </button>
        ))}
      </div>

      <Panel>
        <ul className="divide-y divide-border">
          {loading && <li className="py-10 text-center text-xs text-muted-foreground">Loading…</li>}
          {!loading && list.map((n) => {
            const cat = n.category ?? n.notification_type;
            return (
              <li key={n.id} className={`py-4 grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 items-start ${!n.read_status ? "" : "opacity-70"}`}>
                <div className="h-9 w-9 rounded-full bg-secondary grid place-items-center text-accent-blue shrink-0 relative">
                  {iconFor(cat)}
                  {!n.read_status && !n.archived && <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent-blue ring-2 ring-background" />}
                </div>
                <div className="min-w-0 cursor-pointer" onClick={() => !n.read_status && markRead(n.id)}>
                  <div className="text-sm font-medium text-foreground">{n.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.message}</div>
                  <div className="text-[10px] text-muted-foreground/70 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Pill tone={cat === "security" ? "danger" : cat === "investment" ? "info" : "default"}>{cat}</Pill>
                  {n.archived ? (
                    <button onClick={() => restore(n.id)} title="Restore" className="text-muted-foreground hover:text-accent-blue p-1.5"><ArchiveRestore className="h-3.5 w-3.5" /></button>
                  ) : (
                    <button onClick={() => archive(n.id)} title="Archive" className="text-muted-foreground hover:text-accent-blue p-1.5"><Archive className="h-3.5 w-3.5" /></button>
                  )}
                </div>
              </li>
            );
          })}
          {!loading && list.length === 0 && (
            <li className="py-12 text-center text-sm text-muted-foreground">
              <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" /> Nothing here.
            </li>
          )}
        </ul>
      </Panel>
    </div>
  );
}
