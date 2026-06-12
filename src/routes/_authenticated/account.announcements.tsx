import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Pill } from "@/components/dashboard/ui";
import { publishedAnnouncements } from "@/lib/m7";
import { Megaphone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account/announcements")({
  head: () => ({ meta: [{ title: "Announcements — SpaceX IPO Exchange" }] }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { publishedAnnouncements().then(setRows); }, []);

  return (
    <div>
      <PageHeader title="Announcements" subtitle="Updates and bulletins from Orbit Investments." />
      <div className="space-y-3">
        {rows.map((a) => (
          <Panel key={a.id}>
            <div className="flex flex-wrap gap-2 mb-2">
              <Pill tone={a.priority === "critical" ? "danger" : a.priority === "high" ? "warning" : "info"}>{a.priority}</Pill>
              <Pill>{a.audience}</Pill>
              <span className="text-[11px] text-muted-foreground font-mono">{new Date(a.published_at ?? a.created_at).toLocaleString()}</span>
            </div>
            <h2 className="text-lg font-semibold mb-1">{a.title}</h2>
            <p className="text-sm text-foreground/85 whitespace-pre-wrap leading-relaxed">{a.body}</p>
          </Panel>
        ))}
        {rows.length === 0 && <Panel><div className="py-10 text-center text-sm text-muted-foreground"><Megaphone className="h-8 w-8 mx-auto mb-2 opacity-50" />No announcements yet.</div></Panel>}
      </div>
    </div>
  );
}
