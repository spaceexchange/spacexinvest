import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { PageHeader, Panel, Pill, StatCard, DataTable, Td, btnPrimary, btnSecondary, btnGhost, inputCls } from "@/components/staff/ui";
import { adminListCommissions, adminApproveCommission, adminRejectCommission, adminPayCommission, getCommissionRules, adminUpsertRule, adminToggleRule, getLeaderboard } from "@/lib/m10";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/affiliate")({
  component: AdminAffiliate,
});

function AdminAffiliate() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [rules, setRules] = useState<any[]>([]);
  const [lb, setLb] = useState<any[]>([]);
  const [newRule, setNewRule] = useState<any>({ name: "", event_type: "first_investment", level: 1, percentage: 0, fixed_amount: 0, minimum_amount: 0, active: true });

  const reload = async () => {
    const [c, r, l] = await Promise.all([adminListCommissions(filter || undefined), getCommissionRules(), getLeaderboard(20)]);
    setCommissions(c); setRules(r); setLb(l);
  };
  useEffect(() => { reload(); }, [filter]);

  const sumBy = (s: string) => commissions.filter((c) => c.status === s).reduce((a, b) => a + Number(b.amount), 0);

  const act = async (fn: () => Promise<void>, msg: string) => {
    try { await fn(); toast.success(msg); reload(); } catch (e: any) { toast.error(e.message); }
  };

  const saveRule = async () => {
    if (!newRule.name.trim()) return;
    try { await adminUpsertRule(newRule); toast.success("Rule saved"); setNewRule({ name: "", event_type: "first_investment", level: 1, percentage: 0, fixed_amount: 0, minimum_amount: 0, active: true }); reload(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <PageHeader eyebrow="REVENUE" title="Affiliate & Commissions" subtitle="3-level commission engine, rules, leaderboard, payouts." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <StatCard label="Pending" value={`$${sumBy("pending").toFixed(2)}`} icon={<Coins className="h-4 w-4" />} tone="warning" />
        <StatCard label="Approved" value={`$${sumBy("approved").toFixed(2)}`} tone="success" />
        <StatCard label="Paid" value={`$${sumBy("paid").toFixed(2)}`} />
        <StatCard label="Rules Active" value={rules.filter((r) => r.active).length} />
      </div>

      <Panel title="Commission Rules" className="mb-6" padded={false}>
        <DataTable columns={["Name", "Event", "Lvl", "Percent", "Fixed", "Min", "Active", ""]}>
          {rules.map((r) => (
            <tr key={r.id}>
              <Td>{r.name}</Td>
              <Td><Pill>{r.event_type}</Pill></Td>
              <Td>L{r.level}</Td>
              <Td>{Number(r.percentage)}%</Td>
              <Td>${Number(r.fixed_amount).toFixed(2)}</Td>
              <Td>${Number(r.minimum_amount).toFixed(2)}</Td>
              <Td><Pill tone={r.active ? "success" : "default"}>{r.active ? "yes" : "no"}</Pill></Td>
              <Td><button className={btnGhost} onClick={() => act(() => adminToggleRule(r.id, !r.active), "Updated")}>{r.active ? "Disable" : "Enable"}</button></Td>
            </tr>
          ))}
        </DataTable>
        <div className="p-5 border-t border-border grid grid-cols-2 lg:grid-cols-7 gap-2 items-end">
          <div className="col-span-2"><label className="text-xs text-muted-foreground">Name</label><input className={inputCls + " w-full"} value={newRule.name} onChange={(e) => setNewRule({ ...newRule, name: e.target.value })} /></div>
          <div><label className="text-xs text-muted-foreground">Event</label>
            <select className={inputCls + " w-full"} value={newRule.event_type} onChange={(e) => setNewRule({ ...newRule, event_type: e.target.value })}>
              {["signup", "kyc", "first_investment", "recurring", "tesla_purchase"].map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div><label className="text-xs text-muted-foreground">Lvl</label><input type="number" min="1" max="3" className={inputCls + " w-full"} value={newRule.level} onChange={(e) => setNewRule({ ...newRule, level: Number(e.target.value) })} /></div>
          <div><label className="text-xs text-muted-foreground">%</label><input type="number" step="0.1" className={inputCls + " w-full"} value={newRule.percentage} onChange={(e) => setNewRule({ ...newRule, percentage: Number(e.target.value) })} /></div>
          <div><label className="text-xs text-muted-foreground">Fixed $</label><input type="number" step="0.01" className={inputCls + " w-full"} value={newRule.fixed_amount} onChange={(e) => setNewRule({ ...newRule, fixed_amount: Number(e.target.value) })} /></div>
          <div><button className={btnPrimary + " w-full"} onClick={saveRule}>Add rule</button></div>
        </div>
      </Panel>

      <Panel title={`Commission Ledger (${commissions.length})`} className="mb-6" padded={false}
        action={<select className={inputCls} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {["pending", "approved", "paid", "rejected"].map((s) => <option key={s}>{s}</option>)}
        </select>}>
        <DataTable columns={["Date", "Beneficiary", "Source", "Event", "Lvl", "Amount", "Status", ""]}>
          {commissions.slice(0, 200).map((c) => (
            <tr key={c.id}>
              <Td className="text-muted-foreground text-xs">{new Date(c.created_at).toLocaleString()}</Td>
              <Td><span className="font-mono text-xs">{c.beneficiary_id.slice(0, 8)}…</span></Td>
              <Td><span className="font-mono text-xs">{(c.source_user_id ?? "").slice(0, 8)}…</span></Td>
              <Td>{c.event_type}</Td>
              <Td>L{c.level}</Td>
              <Td>${Number(c.amount).toFixed(2)}</Td>
              <Td><Pill tone={c.status === "paid" ? "success" : c.status === "rejected" ? "danger" : c.status === "approved" ? "info" : "warning"}>{c.status}</Pill></Td>
              <Td>
                {c.status === "pending" && <><button className={btnGhost} onClick={() => act(() => adminApproveCommission(c.id), "Approved")}>Approve</button><button className={btnGhost} onClick={() => act(() => adminRejectCommission(c.id), "Rejected")}>Reject</button></>}
                {c.status === "approved" && <button className={btnSecondary} onClick={() => act(() => adminPayCommission(c.id), "Paid")}>Pay</button>}
              </Td>
            </tr>
          ))}
          {commissions.length === 0 && <tr><Td className="text-muted-foreground">No commissions.</Td></tr>}
        </DataTable>
      </Panel>

      <Panel title="Top Affiliates" padded={false}>
        <DataTable columns={["Rank", "User", "Email", "Total Earned"]}>
          {lb.map((row: any) => (
            <tr key={row.rank}>
              <Td>#{row.rank}</Td>
              <Td>{row.user?.display_name ?? "—"}</Td>
              <Td className="text-muted-foreground">{row.user?.email ?? ""}</Td>
              <Td>${row.total.toFixed(2)}</Td>
            </tr>
          ))}
          {lb.length === 0 && <tr><Td className="text-muted-foreground">No data yet.</Td></tr>}
        </DataTable>
      </Panel>
    </div>
  );
}
