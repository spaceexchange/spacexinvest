import { createFileRoute, Outlet } from "@tanstack/react-router";
import { StaffShell, type NavGroup } from "@/components/staff/StaffShell";
import {
  LayoutDashboard, Users, ShieldCheck, Briefcase, Wallet, Banknote,
  ArrowDownToLine, ArrowUpFromLine, Receipt, ShieldAlert, ScrollText,
  Megaphone, Activity, BarChart3, Zap, Filter, HeartPulse, UserPlus, TrendingUp, Coins, Rocket, Car,
} from "lucide-react";

const nav: NavGroup[] = [
  { group: "OVERVIEW", items: [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/analytics", label: "Executive Analytics", icon: BarChart3 },
    { to: "/admin/health", label: "System Health", icon: HeartPulse },
  ]},
  { group: "GROWTH", items: [
    { to: "/admin/crm", label: "CRM", icon: UserPlus },
    { to: "/admin/segments", label: "Segments", icon: Filter },
    { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
  ]},
  { group: "USERS & COMPLIANCE", items: [
    { to: "/admin/users", label: "User Management", icon: Users },
    { to: "/admin/kyc", label: "KYC Review", icon: ShieldCheck },
    { to: "/admin/compliance-cases", label: "Compliance Cases", icon: ShieldAlert },
  ]},
  { group: "INVESTMENT OPS", items: [
    { to: "/admin/opportunities", label: "Opportunities", icon: Briefcase },
    { to: "/admin/investments", label: "Investments", icon: Briefcase },
    { to: "/admin/spacex", label: "SpaceX Stock", icon: Rocket },
    { to: "/admin/tesla", label: "Tesla Stock", icon: TrendingUp },
    { to: "/admin/tesla-vehicles", label: "Tesla Vehicles", icon: Car },
    { to: "/admin/wallets", label: "Wallets", icon: Wallet },
    { to: "/staff/notes", label: "Internal Notes", icon: ScrollText },
    { to: "/staff/messaging", label: "Team Messaging", icon: Banknote },
  ]},
  { group: "REVENUE", items: [
    { to: "/admin/affiliate", label: "Affiliate & Commissions", icon: Coins },
  ]},
  { group: "FINANCE", items: [
    { to: "/admin/funding", label: "Deposits", icon: ArrowDownToLine },
    { to: "/admin/withdrawals", label: "Withdrawals", icon: ArrowUpFromLine },
    { to: "/admin/invoices", label: "Invoices", icon: Receipt },
    { to: "/admin/transactions", label: "Transactions", icon: Receipt },
  ]},
  { group: "AUTOMATION", items: [
    { to: "/admin/automation", label: "Automation Rules", icon: Zap },
    { to: "/admin/automation-runs", label: "Execution Log", icon: Activity },
  ]},
  { group: "GOVERNANCE", items: [
    { to: "/admin/security", label: "Security Center", icon: ShieldAlert },
    { to: "/admin/activity", label: "Activity Timeline", icon: Activity },
    { to: "/admin/audit", label: "Audit Log", icon: ScrollText },
  ]},
];

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin Console — SpaceX IPO Exchange" }] }),
  component: () => (
    <StaffShell portal="admin" nav={nav} allowedRoles={["admin", "super_admin"]}>
      <Outlet />
    </StaffShell>
  ),
});
