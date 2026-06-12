import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, Pill, btnSecondary } from "@/components/staff/ui";
import { getMyNotifications, markAllNotificationsRead } from "@/lib/data/portal";

export const Route = createFileRoute("/employee/notifications")({ component: NotifPage });

function NotifPage() {
  const [items, setItems] = useState<any[]>([]);
  async function load() { setItems(await getMyNotifications()); }
  useEffect(() => { load(); }, []);
  async function markAll() { await markAllNotificationsRead(); toast.success("Marked all read"); load(); }
  return (
    <div>
      <PageHeader eyebrow="STAFF WORKSPACE" title="Notifications"
        action={<button onClick={markAll} className={btnSecondary}><CheckCheck className="h-4 w-4" />Mark all read</button>} />
      <Panel padded={false}>
        <ul className="divide-y divide-border/60">
          {items.map((n: any) => (
            <li key={n.id} className="flex items-start gap-3 p-4 hover:bg-surface/30">
              <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${!n.read_status ? "bg-accent-blue" : "bg-muted-foreground/30"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium truncate">{n.title}</div>
                  <Pill>{n.notification_type}</Pill>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{n.message}</div>
                <div className="text-[10px] text-muted-foreground mt-1 font-mono">{new Date(n.created_at).toLocaleString()}</div>
              </div>
            </li>
          ))}
          {items.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No notifications.</div>}
        </ul>
      </Panel>
    </div>
  );
}
