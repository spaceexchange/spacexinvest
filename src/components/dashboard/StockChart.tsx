import { useMemo, useState } from "react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type Range = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL";
const RANGES: Range[] = ["1D", "1W", "1M", "3M", "6M", "1Y", "ALL"];
const POINTS: Record<Range, number> = { "1D": 24, "1W": 7, "1M": 30, "3M": 60, "6M": 90, "1Y": 120, ALL: 180 };
const DAYS: Record<Range, number> = { "1D": 1, "1W": 7, "1M": 30, "3M": 90, "6M": 180, "1Y": 365, ALL: 1095 };

// Deterministic pseudo-random series so it's stable per symbol/range.
function seriesFor(symbol: string, currentPrice: number, range: Range) {
  const n = POINTS[range];
  let seed = symbol.split("").reduce((s, c) => s + c.charCodeAt(0), 0) + RANGES.indexOf(range) * 17;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const vol = currentPrice * 0.04;
  const drift = currentPrice * 0.0006;
  let p = currentPrice * (0.78 + rand() * 0.1);
  const out: { t: string; v: number }[] = [];
  const now = Date.now();
  const stepMs = (DAYS[range] * 86400000) / n;
  for (let i = 0; i < n; i++) {
    p += drift + (rand() - 0.48) * vol;
    if (p < currentPrice * 0.4) p = currentPrice * 0.4;
    const d = new Date(now - (n - i) * stepMs);
    const label = range === "1D" ? d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })
      : range === "1W" || range === "1M" ? d.toLocaleDateString("en", { month: "short", day: "numeric" })
      : d.toLocaleDateString("en", { month: "short", year: "2-digit" });
    out.push({ t: label, v: Number(p.toFixed(2)) });
  }
  out[out.length - 1].v = currentPrice;
  return out;
}

export function StockChart({ symbol, price, height = 260 }: { symbol: string; price: number; height?: number }) {
  const [range, setRange] = useState<Range>("1M");
  const data = useMemo(() => seriesFor(symbol, price || 100, range), [symbol, price, range]);
  const first = data[0]?.v ?? price;
  const last = data[data.length - 1]?.v ?? price;
  const change = last - first;
  const pct = first ? (change / first) * 100 : 0;
  const up = change >= 0;
  const stroke = up ? "#10b981" : "#ef4444";
  const high = Math.max(...data.map((d) => d.v));
  const low = Math.min(...data.map((d) => d.v));

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-baseline gap-3">
          <div className="text-3xl font-semibold font-mono">${price.toFixed(2)}</div>
          <div className={`text-sm font-medium ${up ? "text-emerald-400" : "text-red-400"}`}>
            {up ? "+" : ""}{change.toFixed(2)} ({pct.toFixed(2)}%) · {range}
          </div>
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-2 py-1 text-[11px] font-mono rounded transition ${range === r ? "bg-accent-blue/20 text-accent-blue border border-accent-blue/40" : "text-muted-foreground hover:text-foreground border border-transparent"}`}>{r}</button>
          ))}
        </div>
      </div>

      <div style={{ height }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id={`chart-${symbol}-${range}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.4} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="t" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} minTickGap={30} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} domain={["auto", "auto"]} tickFormatter={(v) => `$${Number(v).toFixed(0)}`} />
            <Tooltip contentStyle={{ background: "rgba(15,18,28,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
              formatter={(v: any) => [`$${Number(v).toFixed(2)}`, symbol]} />
            <Area type="monotone" dataKey="v" stroke={stroke} strokeWidth={2} fill={`url(#chart-${symbol}-${range})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-3 text-[11px]">
        <Stat label="High" value={`$${high.toFixed(2)}`} />
        <Stat label="Low" value={`$${low.toFixed(2)}`} />
        <Stat label="Open" value={`$${first.toFixed(2)}`} />
        <Stat label="Close" value={`$${last.toFixed(2)}`} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface/40 px-2 py-1.5">
      <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-mono font-medium">{value}</div>
    </div>
  );
}
