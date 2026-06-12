import { createFileRoute, Outlet } from "@tanstack/react-router";
import { StaffShell, type NavGroup } from "@/components/staff/StaffShell";
import { LayoutDashboard, ShieldCheck, FolderArchive, ScrollText, ShieldAlert } from "lucide-react";

const nav: NavGroup[] = [
  { group: "OVERVIEW", items: [{ to: "/compliance/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  { group: "REVIEW", items: [
    { to: "/compliance/kyc", label: "KYC Queue", icon: ShieldCheck },
    { to: "/compliance/cases", label: "Cases", icon: ShieldAlert },
    { to: "/compliance/documents", label: "Documents", icon: FolderArchive },
  ]},
  { group: "GOVERNANCE", items: [
    { to: "/compliance/audit", label: "Audit Log", icon: ScrollText },
  ]},
];

export const Route = createFileRoute("/compliance")({
  ssr: false,
  head: () => ({ meta: [{ title: "Compliance Desk — SpaceX IPO Exchange" }] }),
  component: () => (
    <StaffShell portal="compliance" nav={nav} allowedRoles={["compliance", "admin", "super_admin"]}>
      <Outlet />
    </StaffShell>
  ),
});
