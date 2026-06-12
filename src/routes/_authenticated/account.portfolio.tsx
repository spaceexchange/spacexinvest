import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PieChart as RPie, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { PageHeader, Panel, StatCard } from "@/components/dashboard/ui";
import { getMyInvestments, getMyWallet, getMyWalletTransactions, money } from "@/lib/data/portal";
import { exportCsv, exportXlsx, exportPdf } from "@/lib/exports";
import { FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio — SpaceX IPO Exchange" }] }),
  component: PortfolioPage,
});

const palette = ["#3b82f6", "#a855f7", "#22c55e", "#ef4444", "#f59e0b", "#06b6d4"];

function PortfolioPage() {
  const [invs, setInvs] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);

  useEffect(() => { (async () => { setInvs(await getMyInvestments()); setWallet(await getMyWallet()); })(); }, []);

  const active = invs.filter((i) => i.status === "active");
  const totalValue = active.reduce((a, b) => a + Number(b.amount), 0);
  const cash = Number(wallet?.balance ?? 0);

  // Aggregate by opportunity
  const map = new Map<string, { name: string; value: number }>();
  active.forEach((i) => {
    const name = i.opportunity?.title ?? "Unknown";
    const cur = map.get(name) ?? { name, value: 0 };
    cur.value += Number(i.amount);
    map.set(name, cur);
  });
  const alloc = Array.from(map.values()).map((a, i) => ({ ...a, color: palette[i % palette.length] }));
  if (cash > 0) alloc.push({ name: "Cash", value: cash, color: "#22c55e" });

  const sectorData = alloc.map((a) => ({ name: a.name, v: a.value }));
  const grand = totalValue + cash;

  const exportPortfolioPdf = async () => {
    try {
      const cols = [{ key: "name", label: "Asset" }, { key: "value", label: "Value (USD)", width: 1 }, { key: "weight", label: "Weight %" }];
      const rows = alloc.map((a) => ({ name: a.name, value: a.value.toFixed(2), weight: grand ? ((a.value / grand) * 100).toFixed(2) : "0" }));
      await exportPdf(`portfolio-${new Date().toISOString().slice(0,10)}.pdf`, "Portfolio Statement", cols, rows);
      toast.success("Portfolio PDF generated");
    } catch (e: any) { toast.error(e.message ?? "Export failed"); }
  };
  const exportStatement = async () => {
    try {
      const txs = await getMyWalletTransactions(500);
      const cols = [
        { key: "created_at", label: "Date" }, { key: "transaction_type", label: "Type" },
        { key: "amount", label: "Amount" }, { key: "balance_after", label: "Balance" },
        { key: "reference", label: "Reference" }, { key: "status", label: "Status" },
      ];
      exportXlsx(`investment-statement-${new Date().toISOString().slice(0,10)}.xlsx`, cols, txs, "Statement");
      toast.success("Statement exported");
    } catch (e: any) { toast.error(e.message ?? "Export failed"); }
  };
  const exportTaxSummary = () => {
    try {
      const year = new Date().getFullYear();
      const rows = active.map((i) => ({
        opportunity: i.opportunity?.title ?? "—",
        invested: Number(i.amount).toFixed(2),
        shares: i.shares ?? 0,
        acquired: i.created_at ? new Date(i.created_at).toISOString().slice(0, 10) : "",
        status: i.status,
      }));
      rows.push({ opportunity: "TOTAL", invested: totalValue.toFixed(2), shares: "" as any, acquired: "", status: "" } as any);
      const cols = [
        { key: "opportunity", label: "Asset" }, { key: "invested", label: "Cost Basis (USD)" },
        { key: "shares", label: "Shares" }, { key: "acquired", label: "Acquired" }, { key: "status", label: "Status" },
      ];
      exportCsv(`tax-summary-${year}.csv`, cols, rows);
      toast.success("Tax summary exported");
    } catch (e: any) { toast.error(e.message ?? "Export failed"); }
  };

  return (
    <div>
      <PageHeader title="Portfolio Center" subtitle="Deep analytics across all your holdings."
        action={
          <div className="flex gap-2 flex-wrap">
            <button onClick={exportPortfolioPdf} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-xs font-medium hover:border-accent-blue/40 hover:text-accent-blue transition-colors"><FileText className="h-3.5 w-3.5" />Portfolio PDF</button>
            <button onClick={exportTaxSummary} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-xs font-medium hover:border-accent-blue/40 hover:text-accent-blue transition-colors"><FileDown className="h-3.5 w-3.5" />Tax Summary</button>
            <button onClick={exportStatement} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-xs font-medium hover:border-accent-blue/40 hover:text-accent-blue transition-colors"><FileSpreadsheet className="h-3.5 w-3.5" />Statement XLSX</button>
          </div>
        }
      />


      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <StatCard label="Total Value" value={money(grand)} />
        <StatCard label="Invested" value={money(totalValue)} />
        <StatCard label="Positions" value={String(active.length)} />
        <StatCard label="Cash" value={money(cash)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Panel title="Allocation by Asset">
          <div className="h-64">
            {alloc.length === 0 ? <Empty /> : (
              <ResponsiveContainer>
                <RPie>
                  <Pie data={alloc} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {alloc.map((a) => <Cell key={a.name} fill={a.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "rgba(15,18,28,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </RPie>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel title="Holdings Breakdown">
          <div className="h-64">
            {sectorData.length === 0 ? <Empty /> : (
              <ResponsiveContainer>
                <BarChart data={sectorData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: "rgba(15,18,28,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="v" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>
      </div>

      <Panel title="Holdings Summary">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase border-b border-border">
                <th className="py-2 pr-4 font-normal">Asset</th>
                <th className="py-2 pr-4 font-normal">Value</th>
                <th className="py-2 pr-4 font-normal">Weight</th>
                <th className="py-2 font-normal text-right">Color</th>
              </tr>
            </thead>
            <tbody>
              {alloc.map((a) => {
                const weight = grand ? (a.value / grand) * 100 : 0;
                return (
                  <tr key={a.name} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4 text-foreground font-medium">{a.name}</td>
                    <td className="py-3 pr-4 text-foreground">{money(a.value)}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{weight.toFixed(1)}%</td>
                    <td className="py-3 text-right"><span className="inline-block h-3 w-6 rounded" style={{ background: a.color }} /></td>
                  </tr>
                );
              })}
              {alloc.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-sm text-muted-foreground">No holdings yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Empty() {
  return <div className="h-full grid place-items-center text-xs text-muted-foreground">No allocations yet.</div>;
}
