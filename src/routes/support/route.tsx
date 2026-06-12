import { createFileRoute, Outlet } from "@tanstack/react-router";
import { StaffShell, type NavGroup } from "@/components/staff/StaffShell";
import { LayoutDashboard, Inbox, Users, ShieldCheck } from "lucide-react";

const nav: NavGroup[] = [
  { group: "OVERVIEW", items: [{ to: "/support/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  { group: "CUSTOMER OPS", items: [
    { to: "/support/tickets", label: "Tickets", icon: Inbox },
    { to: "/support/customers", label: "Customers", icon: Users },
  ]},
  { group: "COMPLIANCE", items: [
    { to: "/support/compliance", label: "KYC & Compliance", icon: ShieldCheck },
  ]},
];

export const Route = createFileRoute("/support")({
  ssr: false,
  head: () => ({ meta: [{ title: "Support Desk — SpaceX IPO Exchange" }] }),
  component: () => (
    <StaffShell portal="support" nav={nav} allowedRoles={["support", "admin", "super_admin"]}>
      <Outlet />
    </StaffShell>
  ),
});
