import { createFileRoute, Outlet } from "@tanstack/react-router";
import { StaffShell, type NavGroup } from "@/components/staff/StaffShell";
import { StickyNote, MessageSquare, LayoutDashboard } from "lucide-react";

const nav: NavGroup[] = [
  { group: "COLLABORATION", items: [
    { to: "/staff/notes", label: "Internal Notes", icon: StickyNote },
    { to: "/staff/messaging", label: "Team Messaging", icon: MessageSquare },
    { to: "/employee/dashboard", label: "Back to workspace", icon: LayoutDashboard },
  ]},
];

export const Route = createFileRoute("/staff")({
  ssr: false,
  head: () => ({ meta: [{ title: "Staff Collaboration — SpaceX IPO Exchange" }] }),
  component: () => (
    <StaffShell portal="employee" nav={nav} allowedRoles={["admin", "super_admin", "compliance", "finance", "support", "employee"]}>
      <Outlet />
    </StaffShell>
  ),
});
