import { createFileRoute, Outlet } from "@tanstack/react-router";
import { StaffShell, type NavGroup } from "@/components/staff/StaffShell";
import { LayoutDashboard, ArrowDownToLine, ArrowUpFromLine, Wallet, Receipt, Building2, Bitcoin, FileBarChart2, GitCompare } from "lucide-react";

const nav: NavGroup[] = [
  { group: "OVERVIEW", items: [
    { to: "/finance/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/finance/treasury", label: "Treasury", icon: Building2 },
  ]},
  { group: "FLOWS", items: [
    { to: "/finance/deposits", label: "Deposits", icon: ArrowDownToLine },
    { to: "/finance/withdrawals", label: "Withdrawals", icon: ArrowUpFromLine },
  ]},
  { group: "OPERATIONS", items: [
    { to: "/finance/wallets", label: "Wallets", icon: Wallet },
    { to: "/finance/transactions", label: "Transactions", icon: Receipt },
    { to: "/finance/crypto-addresses", label: "Crypto Addresses", icon: Bitcoin },
    { to: "/finance/reconciliation", label: "Reconciliation", icon: GitCompare },
    { to: "/finance/reports", label: "Reports & Exports", icon: FileBarChart2 },
  ]},
];

export const Route = createFileRoute("/finance")({
  ssr: false,
  head: () => ({ meta: [{ title: "Finance Desk — SpaceX IPO Exchange" }] }),
  component: () => (
    <StaffShell portal="finance" nav={nav} allowedRoles={["finance", "admin", "super_admin"]}>
      <Outlet />
    </StaffShell>
  ),
});
