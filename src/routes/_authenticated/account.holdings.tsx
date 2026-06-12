import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TrendingUp, Rocket, ArrowLeft, Download } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from "recharts";
import { useTranslation } from "react-i18next";
import { PageHeader, Panel, Pill, StatCard } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import * as M5 from "@/lib/m5";
import * as Spx from "@/lib/spacex";
import { exportCsv } from "@/lib/exports";
import { useFormatters } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/account/holdings")({
  head: () => ({ meta: [{ title: "Holdings Dashboard — SpaceX IPO Exchange" }] }),
  component: HoldingsPage,
});

function HoldingsPage() {
  const { t } = useTranslation();
  const { formatCurrency, formatNumber, formatDate } = useFormatters();
  const [tQuote, setTQuote] = useState<any>(null);
  const [tHold, setTHold] = useState<any>(null);
  const [tOrders, setTOrders] = useState<any[]>([]);
  const [sQuote, setSQuote] = useState<any>(null);
  const [sHold, setSHold] = useState<any>(null);
  const [sOrders, setSOrders] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [tq, th, to, sq, sh, so] = await Promise.all([
        M5.getQuote(), M5.getMyHolding(), M5.getMyOrders(100),
        Spx.getQuote(), Spx.getMyHolding(), Spx.getMyOrders(100),
      ]);
      setTQuote(tq); setTHold(th); setTOrders(to);
      setSQuote(sq); setSHold(sh); setSOrders(so);
    })();
  }, []);

  const tPrice = Number(tQuote?.price ?? 0);
  const sPrice = Number(sQuote?.price ?? 0);
  const tShares = Number(tHold?.shares ?? 0);
  const sShares = Number(sHold?.shares ?? 0);
  const tInv = Number(tHold?.total_invested ?? 0);
  const sInv = Number(sHold?.total_invested ?? 0);
  const tVal = tShares * tPrice;
  const sVal = sShares * sPrice;
  const tPL = tVal - tInv;
  const sPL = sVal - sInv;
  const totalShares = tShares + sShares;
  const totalInv = tInv + sInv;
  const totalVal = tVal + sVal;
  const totalPL = totalVal - totalInv;
  const totalPct = totalInv ? (totalPL / totalInv) * 100 : 0;

  const best = tPL >= sPL ? { name: "Tesla (TSLA)", pl: tPL } : { name: "SpaceX (SPXI)", pl: sPL };
  const worst = tPL <= sPL ? { name: "Tesla (TSLA)", pl: tPL } : { name: "SpaceX (SPXI)", pl: sPL };

  const timeline = (() => {
    type Row = { t: number; tesla: number; spacex: number; total: number };
    const evts = [
      ...tOrders.map((o) => ({ ts: new Date(o.created_at).getTime(), kind: "tesla" as const, o })),
      ...sOrders.map((o) => ({ ts: new Date(o.created_at).getTime(), kind: "spacex" as const, o })),
    ].sort((a, b) => a.ts - b.ts);
    let tsh = 0, ssh = 0;
    const rows: Row[] = [];
    for (const e of evts) {
      const shares = Number(e.o.shares);
      if (e.kind === "tesla") {
        if (e.o.side === "buy") tsh += shares; else tsh -= shares;
      } else {
        if (e.o.side === "buy") ssh += shares; else ssh -= shares;
      }
      rows.push({ t: e.ts, tesla: tsh * tPrice, spacex: ssh * sPrice, total: tsh * tPrice + ssh * sPrice });
    }
    if (rows.length === 0) rows.push({ t: Date.now(), tesla: tVal, spacex: sVal, total: totalVal });
    return rows.map((r) => ({ ...r, label: formatDate(r.t, { month: "short", day: "numeric" }) }));
  })();

  const allocation = [
    { name: t("holdings.tesla"), value: tVal, fill: "#3b82f6" },
    { name: t("holdings.spacex"), value: sVal, fill: "#10b981" },
  ];

  const exportAll = () => {
    exportCsv("holdings", [
      { key: "symbol", label: "Symbol" }, { key: "shares", label: "Shares" }, { key: "avg", label: "Avg Cost" },
      { key: "price", label: "Price" }, { key: "invested", label: "Invested" }, { key: "value", label: "Value" }, { key: "pl", label: "P/L" },
    ], [
      { symbol: "TSLA", shares: tShares, avg: Number(tHold?.average_cost ?? 0).toFixed(2), price: tPrice.toFixed(2), invested: tInv.toFixed(2), value: tVal.toFixed(2), pl: tPL.toFixed(2) },
      { symbol: "SPXI", shares: sShares, avg: Number(sHold?.average_cost ?? 0).toFixed(2), price: sPrice.toFixed(2), invested: sInv.toFixed(2), value: sVal.toFixed(2), pl: sPL.toFixed(2) },
    ]);
  };

  return (
    <div>
      <Link to="/account/dashboard" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-3 w-3 mr-1" />{t("holdings.backToMissionControl")}</Link>
      <PageHeader title={t("holdings.title")} subtitle={t("holdings.subtitle")}
        action={<Button variant="outline" size="sm" onClick={exportAll}><Download className="h-3.5 w-3.5 mr-1" />{t("common.export")}</Button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <StatCard label={t("holdings.totalShares")} value={formatNumber(totalShares, { maximumFractionDigits: 4 })} />
        <StatCard label={t("holdings.totalInvested")} value={formatCurrency(totalInv)} />
        <StatCard label={t("holdings.marketValue")} value={formatCurrency(totalVal)} />
        <StatCard label={t("holdings.totalPL")} value={formatCurrency(totalPL)} change={totalPct} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <Panel title={t("holdings.bestPerformer")}>
          <div className="flex items-center justify-between">
            <div className="text-base font-semibold">{best.name}</div>
            <div className={`font-mono ${best.pl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatCurrency(best.pl)}</div>
          </div>
        </Panel>
        <Panel title={t("holdings.underperformer")}>
          <div className="flex items-center justify-between">
            <div className="text-base font-semibold">{worst.name}</div>
            <div className={`font-mono ${worst.pl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatCurrency(worst.pl)}</div>
          </div>
        </Panel>
      </div>

      <Panel title={t("holdings.portfolioPerformance")} className="mb-6">
        <div className="h-72">
          <ResponsiveContainer>
            <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.4} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                <linearGradient id="gtot" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} /><stop offset="100%" stopColor="#a855f7" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} minTickGap={40} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v, undefined, { maximumFractionDigits: 0, notation: "compact" })} />
              <Tooltip contentStyle={{ background: "rgba(15,18,28,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="total" name={t("holdings.total")} stroke="#a855f7" strokeWidth={2} fill="url(#gtot)" />
              <Area type="monotone" dataKey="tesla" name={t("holdings.tesla")} stroke="#3b82f6" strokeWidth={1.5} fill="url(#gt)" />
              <Area type="monotone" dataKey="spacex" name={t("holdings.spacex")} stroke="#10b981" strokeWidth={1.5} fill="url(#gs)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Panel title={t("holdings.allocation")} className="lg:col-span-1">
          <div className="h-48">
            <ResponsiveContainer>
              <BarChart data={allocation} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={10} tickFormatter={(v) => formatCurrency(v, undefined, { maximumFractionDigits: 0, notation: "compact" })} />
                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                <Tooltip contentStyle={{ background: "rgba(15,18,28,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <HoldingCard className="lg:col-span-1" name="Tesla (TSLA)" icon={<TrendingUp className="h-4 w-4" />} to="/account/tesla"
          shares={tShares} avg={Number(tHold?.average_cost ?? 0)} price={tPrice} value={tVal} invested={tInv} pl={tPL} />
        <HoldingCard className="lg:col-span-1" name="SpaceX (SPXI)" icon={<Rocket className="h-4 w-4" />} to="/account/spacex"
          shares={sShares} avg={Number(sHold?.average_cost ?? 0)} price={sPrice} value={sVal} invested={sInv} pl={sPL} />
      </div>

      <Panel title={t("holdings.purchaseHistory")}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead><tr className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase border-b border-border">
              <th className="text-left py-2">{t("holdings.cols.date")}</th><th className="text-left">{t("holdings.cols.asset")}</th><th className="text-left">{t("holdings.cols.side")}</th>
              <th className="text-right">{t("holdings.cols.shares")}</th><th className="text-right">{t("holdings.cols.price")}</th><th className="text-right">{t("holdings.cols.amount")}</th><th className="text-left pl-3">{t("holdings.cols.status")}</th>
            </tr></thead>
            <tbody className="divide-y divide-border/60">
              {[...tOrders.map((o) => ({ ...o, asset: "TSLA" })), ...sOrders.map((o) => ({ ...o, asset: "SPXI" }))]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 30)
                .map((o) => (
                  <tr key={`${o.asset}-${o.id}`}>
                    <td className="py-2 text-muted-foreground">{formatDate(o.created_at)}</td>
                    <td className="font-mono">{o.asset}</td>
                    <td><Pill tone={o.side === "buy" ? "info" : "warning"}>{o.side}</Pill></td>
                    <td className="text-right">{formatNumber(Number(o.shares), { maximumFractionDigits: 4 })}</td>
                    <td className="text-right">{formatCurrency(Number(o.price))}</td>
                    <td className="text-right">{formatCurrency(Number(o.amount))}</td>
                    <td className="pl-3"><Pill tone={o.status === "filled" ? "success" : "warning"}>{o.status}</Pill></td>
                  </tr>
                ))}
              {tOrders.length + sOrders.length === 0 && (
                <tr><td colSpan={7} className="text-center py-6 text-muted-foreground text-sm">{t("holdings.noPurchases")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function HoldingCard({ name, icon, to, shares, avg, price, value, invested, pl, className }: {
  name: string; icon: React.ReactNode; to: string; shares: number; avg: number; price: number; value: number; invested: number; pl: number; className?: string;
}) {
  const { t } = useTranslation();
  const { formatCurrency, formatNumber } = useFormatters();
  const pct = invested ? (pl / invested) * 100 : 0;
  return (
    <Link to={to} className={`glass-card rounded-xl p-5 hover:border-accent-blue/40 transition-colors block ${className ?? ""}`}>
      <div className="flex items-center gap-2 mb-3"><span className="text-accent-blue">{icon}</span><span className="font-semibold">{name}</span></div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Cell label={t("holdings.card.shares")} value={formatNumber(shares, { maximumFractionDigits: 4 })} />
        <Cell label={t("holdings.card.avgCost")} value={formatCurrency(avg)} />
        <Cell label={t("holdings.card.price")} value={formatCurrency(price)} />
        <Cell label={t("holdings.card.value")} value={formatCurrency(value)} />
        <Cell label={t("holdings.card.invested")} value={formatCurrency(invested)} />
        <Cell label={t("holdings.card.pl")} value={`${formatCurrency(pl)} (${pct.toFixed(1)}%)`} tone={pl >= 0 ? "up" : "down"} />
      </div>
    </Link>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`font-mono ${tone === "up" ? "text-emerald-400" : tone === "down" ? "text-red-400" : ""}`}>{value}</div>
    </div>
  );
}
