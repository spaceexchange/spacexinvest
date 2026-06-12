import { createFileRoute, Outlet } from "@tanstack/react-router";
import { StaffShell, type NavGroup } from "@/components/staff/StaffShell";
import { LayoutDashboard, FolderArchive, FileBarChart, ListChecks, Bell } from "lucide-react";

const nav: NavGroup[] = [
  { group: "OVERVIEW", items: [{ to: "/employee/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  { group: "WORKSPACE", items: [
    { to: "/employee/documents", label: "Document Center", icon: FolderArchive },
    { to: "/employee/reports", label: "Reports", icon: FileBarChart },
    { to: "/employee/tasks", label: "Tasks", icon: ListChecks },
    { to: "/employee/notifications", label: "Notifications", icon: Bell },
  ]},
];

export const Route = createFileRoute("/employee")({
  ssr: false,
  head: () => ({ meta: [{ title: "Staff Workspace — SpaceX IPO Exchange" }] }),
  component: () => (
    <StaffShell portal="employee" nav={nav} allowedRoles={["employee", "support", "admin", "super_admin"]}>
      <Outlet />
    </StaffShell>
  ),
});
