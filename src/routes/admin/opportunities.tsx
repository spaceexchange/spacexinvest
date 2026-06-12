import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader, Panel, Pill, DataTable, Td, btnPrimary, btnSecondary, btnGhost, inputCls, statusTone } from "@/components/staff/ui";
import { listOpportunitiesAdmin, OPP_STATUSES, INDUSTRIES } from "@/lib/opportunities";
import { useRealtimeChannel } from "@/lib/data/portal";
import { useServerFn } from "@tanstack/react-start";
import { setOpportunityStatus, toggleOpportunityFeatured } from "@/lib/data/ops.functions";
import { Plus, Star, StarOff, Filter, Search } from "lucide-react";
import { toast } from "sonner";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export const Route = createFileRoute("/admin/opportunities")({ component: OppsList });

function OppsList() {
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState("all");
  const [industry, setIndustry] = useState("all");
  const [q, setQ] = useState("");
  const setStatusFn = useServerFn(setOpportunityStatus);
  const toggleFeaturedFn = useServerFn(toggleOpportunityFeatured);

  const reload = async () => setRows(await listOpportunitiesAdmin());
  useEffect(() => { reload(); }, []);
  useRealtimeChannel("admin-opps", [{ table: "investment_opportunities" }], reload);

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (industry !== "all" && r.industry !== industry) return false;
      if (s && !`${r.title} ${r.id} ${r.short_description ?? ""}`.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [rows, status, industry, q]);

  const change = async (id: string, st: string) => {
    try { await setStatusFn({ data: { id, status: st } }); toast.success(`Status → ${st}`); }
    catch (e: any) { toast.error(e.message); }
  };
  const featured = async (id: string, f: boolean) => {
    try { await toggleFeaturedFn({ data: { id, featured: f } }); toast.success(f ? "Featured" : "Unfeatured"); }
    catch (e: any) { toast.error(e.message); }
  };

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((r) => ["active", "open"].includes(r.status)).length,
    closed: rows.filter((r) => ["closed", "fully_funded", "funded"].includes(r.status)).length,
    capital: rows.reduce((s, r) => s + Number(r.raised_amount ?? 0), 0),
  }), [rows]);

  return (
    <div>
      <PageHeader
        eyebrow="INVESTMENT OPS"
        title="Opportunities"
        subtitle={`${stats.total} total · ${stats.active} active · ${stats.closed} closed · ${fmt(stats.capital)} raised`}
        action={<Link to="/admin/opportunities/new" className={btnPrimary}><Plus className="h-4 w-4" /> New opportunity</Link>}
      />

      <Panel className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            {OPP_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            <option value="open">open (legacy)</option>
            <option value="funded">funded (legacy)</option>
          </select>
          <select className={inputCls} value={industry} onChange={(e) => setIndustry(e.target.value)}>
            <option value="all">All industries</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input className={`${inputCls} flex-1`} placeholder="Search title, ID, description" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
      </Panel>

      <Panel padded={false}>
        <DataTable columns={["Title", "Type", "Status", "Target", "Raised", "Investors", "Created", "Actions"]}>
          {filtered.map((r) => {
            const pct = Number(r.target_amount) > 0 ? (Number(r.raised_amount) / Number(r.target_amount)) * 100 : 0;
            return (
              <tr key={r.id}>
                <Td>
                  <div className="flex items-center gap-2">
                    {r.featured && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />}
                    <div className="min-w-0">
                      <Link to="/admin/opportunities/$id" params={{ id: r.id }} className="font-medium text-foreground hover:text-accent-blue truncate block">{r.title}</Link>
                      <div className="text-[11px] text-muted-foreground font-mono">{r.slug ?? r.id.slice(0, 8)}</div>
                    </div>
                  </div>
                </Td>
                <Td><span className="text-xs">{r.investment_type ?? r.category}</span></Td>
                <Td><Pill tone={statusTone(r.status)}>{r.status.replace(/_/g, " ")}</Pill></Td>
                <Td>{fmt(Number(r.target_amount))}</Td>
                <Td>
                  <div className="text-sm">{fmt(Number(r.raised_amount))}</div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden mt-1 w-32"><div className="h-full bg-accent-blue" style={{ width: `${Math.min(100, pct)}%` }} /></div>
                </Td>
                <Td><span className="text-sm">{r.investor_count ?? 0}</span></Td>
                <Td><span className="text-xs text-muted-foreground font-mono">{new Date(r.created_at).toLocaleDateString()}</span></Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <button className={btnGhost} onClick={() => featured(r.id, !r.featured)} title="Feature">{r.featured ? <StarOff className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}</button>
                    <select className={`${inputCls} h-7 text-xs`} value={r.status} onChange={(e) => change(r.id, e.target.value)}>
                      {OPP_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                    </select>
                    <Link to="/admin/opportunities/$id" params={{ id: r.id }} className={btnSecondary} style={{ height: 28 }}>Edit</Link>
                  </div>
                </Td>
              </tr>
            );
          })}
        </DataTable>
        {filtered.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No opportunities match.</div>}
      </Panel>
    </div>
  );
}
