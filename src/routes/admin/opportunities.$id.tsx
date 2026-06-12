import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Pill, btnPrimary, btnSecondary, btnGhost, inputCls, statusTone } from "@/components/staff/ui";
import { useServerFn } from "@tanstack/react-start";
import { upsertOpportunityRich, setOpportunityStatus, attachOpportunityDocument, deleteOpportunityDocument } from "@/lib/data/ops.functions";
import { getOpportunityBySlugOrId, getOpportunityDocuments, getOpportunityInvestors, uploadOppDocument, uploadOppMedia, OPP_STATUSES, RISK_LEVELS, INVESTMENT_TYPES, INDUSTRIES } from "@/lib/opportunities";
import { Trash2, Upload, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/opportunities/$id")({ component: EditOpp });

function EditOpp() {
  const { id } = Route.useParams();
  const [opp, setOpp] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [investors, setInvestors] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const upsert = useServerFn(upsertOpportunityRich);
  const setStatusFn = useServerFn(setOpportunityStatus);
  const attachDoc = useServerFn(attachOpportunityDocument);
  const removeDoc = useServerFn(deleteOpportunityDocument);

  const reload = async () => {
    const o = await getOpportunityBySlugOrId(id);
    setOpp(o);
    if (o) {
      setDocs(await getOpportunityDocuments(o.id));
      setInvestors(await getOpportunityInvestors(o.id));
    }
  };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [id]);

  if (!opp) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  const set = (k: string, v: any) => setOpp({ ...opp, [k]: v });

  const save = async () => {
    setSaving(true);
    try {
      await upsert({ data: {
        id: opp.id, title: opp.title, slug: opp.slug, industry: opp.industry,
        investment_type: opp.investment_type, risk_level: opp.risk_level, currency: opp.currency,
        short_description: opp.short_description, full_description: opp.full_description, description: opp.description,
        minimum_investment: Number(opp.minimum_investment),
        maximum_investment: opp.maximum_investment ? Number(opp.maximum_investment) : null,
        target_amount: Number(opp.target_amount), available_shares: Number(opp.available_shares),
        price_per_share: Number(opp.price_per_share),
        expected_roi: opp.expected_roi ? Number(opp.expected_roi) : null,
        start_date: opp.start_date, end_date: opp.end_date,
        status: opp.status, featured: opp.featured,
        cover_image: opp.cover_image, gallery_images: opp.gallery_images ?? [],
        highlights: opp.highlights ?? [], faq: opp.faq ?? [],
      }});
      toast.success("Saved");
      reload();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const changeStatus = async (s: string) => {
    try { await setStatusFn({ data: { id: opp.id, status: s } }); toast.success(`Status → ${s}`); reload(); }
    catch (e: any) { toast.error(e.message); }
  };

  const onDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const path = await uploadOppDocument(file, opp.id);
      await attachDoc({ data: {
        opportunity_id: opp.id, document_name: file.name,
        document_type: file.name.split(".").pop()?.toLowerCase() ?? "file",
        file_url: path, size_bytes: file.size, visibility: "investor",
      }});
      toast.success("Document attached"); reload();
    } catch (err: any) { toast.error(err.message); }
    e.target.value = "";
  };

  const onCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const path = await uploadOppMedia(file, opp.id);
      set("cover_image", path); toast.success("Cover uploaded — click Save to apply");
    } catch (err: any) { toast.error(err.message); }
    e.target.value = "";
  };

  const totalRaised = Number(opp.raised_amount ?? 0);
  const pct = Number(opp.target_amount) > 0 ? (totalRaised / Number(opp.target_amount)) * 100 : 0;

  return (
    <div>
      <PageHeader
        eyebrow="EDIT OPPORTUNITY"
        title={opp.title}
        subtitle={`${opp.slug ?? opp.id.slice(0, 8)} · ${investors.length} investments · ${pct.toFixed(1)}% funded`}
        action={
          <div className="flex items-center gap-2">
            <Link to="/admin/opportunities" className={btnGhost}><ArrowLeft className="h-3.5 w-3.5" /> Back</Link>
            <select className={inputCls} value={opp.status} onChange={(e) => changeStatus(e.target.value)}>{OPP_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}</select>
            <button className={btnPrimary} onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-5">
        <Panel title="Basic" className="lg:col-span-2">
          <div className="grid sm:grid-cols-2 gap-3">
            <F label="Title"><input className={inputCls} value={opp.title ?? ""} onChange={(e) => set("title", e.target.value)} /></F>
            <F label="Slug"><input className={inputCls} value={opp.slug ?? ""} onChange={(e) => set("slug", e.target.value)} /></F>
            <F label="Industry"><select className={inputCls} value={opp.industry ?? "Other"} onChange={(e) => set("industry", e.target.value)}>{INDUSTRIES.map((i) => <option key={i}>{i}</option>)}</select></F>
            <F label="Risk level"><select className={inputCls} value={opp.risk_level ?? "medium"} onChange={(e) => set("risk_level", e.target.value)}>{RISK_LEVELS.map((r) => <option key={r}>{r}</option>)}</select></F>
            <F label="Investment type"><select className={inputCls} value={opp.investment_type ?? "shares"} onChange={(e) => set("investment_type", e.target.value)}>{INVESTMENT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></F>
            <F label="Currency"><input className={inputCls} value={opp.currency ?? "USD"} onChange={(e) => set("currency", e.target.value)} /></F>
            <F label="Short description" className="sm:col-span-2"><input className={inputCls} value={opp.short_description ?? ""} onChange={(e) => set("short_description", e.target.value)} /></F>
            <F label="Full description" className="sm:col-span-2"><textarea className={`${inputCls} min-h-[160px] py-2`} value={opp.full_description ?? ""} onChange={(e) => set("full_description", e.target.value)} /></F>
          </div>
        </Panel>

        <Panel title="Financials">
          <div className="space-y-3">
            <F label="Target raise"><input type="number" className={inputCls} value={opp.target_amount ?? 0} onChange={(e) => set("target_amount", e.target.value)} /></F>
            <F label="Available shares"><input type="number" className={inputCls} value={opp.available_shares ?? 0} onChange={(e) => set("available_shares", e.target.value)} /></F>
            <F label="Price per share"><input type="number" className={inputCls} value={opp.price_per_share ?? 0} onChange={(e) => set("price_per_share", e.target.value)} /></F>
            <F label="Min investment"><input type="number" className={inputCls} value={opp.minimum_investment ?? 0} onChange={(e) => set("minimum_investment", e.target.value)} /></F>
            <F label="Max investment"><input type="number" className={inputCls} value={opp.maximum_investment ?? ""} onChange={(e) => set("maximum_investment", e.target.value)} /></F>
            <F label="Expected ROI %"><input type="number" className={inputCls} value={opp.expected_roi ?? ""} onChange={(e) => set("expected_roi", e.target.value)} /></F>
            <div>
              <div className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase mb-1">Progress</div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-accent-blue" style={{ width: `${Math.min(100, pct)}%` }} /></div>
              <div className="text-xs text-muted-foreground mt-1">${totalRaised.toLocaleString()} / ${Number(opp.target_amount).toLocaleString()}</div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!opp.featured} onChange={(e) => set("featured", e.target.checked)} /> Featured</label>
          </div>
        </Panel>

        <Panel title="Cover image" className="lg:col-span-2">
          <div className="flex items-center gap-3">
            {opp.cover_image && <div className="text-xs font-mono text-muted-foreground truncate flex-1">{opp.cover_image}</div>}
            <label className={btnSecondary}>
              <Upload className="h-4 w-4" /> {opp.cover_image ? "Replace" : "Upload"}
              <input type="file" accept="image/*" className="hidden" onChange={onCoverUpload} />
            </label>
          </div>
        </Panel>

        <Panel title="Documents" className="lg:col-span-3">
          <div className="mb-3">
            <label className={btnSecondary}>
              <Upload className="h-4 w-4" /> Upload PDF / DOCX / XLSX / PPTX
              <input type="file" accept=".pdf,.docx,.xlsx,.pptx,.doc,.xls,.ppt" className="hidden" onChange={onDocUpload} />
            </label>
          </div>
          <div className="space-y-1">
            {docs.length === 0 && <div className="text-sm text-muted-foreground py-4">No documents yet.</div>}
            {docs.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 py-2 border-b border-border/60 last:border-0">
                <div className="min-w-0">
                  <div className="text-sm truncate">{d.document_name}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">{d.document_type} · {((d.size_bytes ?? 0) / 1024).toFixed(0)} KB · {new Date(d.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Pill tone={d.visibility === "investor" ? "info" : "warning"}>{d.visibility}</Pill>
                  <button className={btnGhost} onClick={async () => { if (!confirm("Delete?")) return; await removeDoc({ data: { id: d.id } }); reload(); }}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={`Investors (${investors.length})`} className="lg:col-span-3">
          <div className="space-y-1 max-h-80 overflow-auto">
            {investors.map((i) => (
              <div key={i.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/60 last:border-0">
                <span className="font-mono text-xs text-muted-foreground">{i.investor_id.slice(0,8)}</span>
                <span>${Number(i.amount).toLocaleString()}</span>
                <Pill tone={statusTone(i.approval_status)}>{i.approval_status}</Pill>
              </div>
            ))}
            {investors.length === 0 && <div className="text-sm text-muted-foreground py-4">No investments yet.</div>}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function F({ label, children, className = "" }: any) {
  return <label className={`block ${className}`}><div className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase mb-1">{label}</div>{children}</label>;
}
