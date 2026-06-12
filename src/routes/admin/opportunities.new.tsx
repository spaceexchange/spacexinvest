import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel, btnPrimary, btnSecondary, inputCls } from "@/components/staff/ui";
import { useServerFn } from "@tanstack/react-start";
import { upsertOpportunityRich } from "@/lib/data/ops.functions";
import { slugify, RISK_LEVELS, INVESTMENT_TYPES, INDUSTRIES, OPP_STATUSES } from "@/lib/opportunities";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/opportunities/new")({ component: NewOpp });

function NewOpp() {
  const navigate = useNavigate();
  const upsert = useServerFn(upsertOpportunityRich);
  const [step, setStep] = useState(1);
  const [f, setF] = useState<any>({
    title: "", slug: "", industry: "Aerospace", investment_type: "shares", risk_level: "medium",
    currency: "USD", short_description: "", full_description: "",
    minimum_investment: 1000, maximum_investment: null, target_amount: 1000000,
    available_shares: 100000, price_per_share: 10, expected_roi: 12,
    start_date: "", end_date: "", status: "draft", featured: false,
    highlights: [], faq: [], gallery_images: [],
  });
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const n = (k: string) => Number(f[k]) || 0;

  const submit = async (statusOverride?: string) => {
    try {
      const payload = {
        ...f,
        slug: f.slug || slugify(f.title),
        minimum_investment: n("minimum_investment"),
        maximum_investment: f.maximum_investment === "" || f.maximum_investment == null ? null : Number(f.maximum_investment),
        target_amount: n("target_amount"),
        available_shares: n("available_shares"),
        price_per_share: n("price_per_share"),
        expected_roi: f.expected_roi === "" || f.expected_roi == null ? null : Number(f.expected_roi),
        start_date: f.start_date || null, end_date: f.end_date || null,
        status: statusOverride ?? f.status,
      };
      const res: any = await upsert({ data: payload });
      toast.success("Opportunity saved");
      navigate({ to: "/admin/opportunities/$id", params: { id: res.id } });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <PageHeader eyebrow="INVESTMENT OPS" title="Create opportunity" subtitle={`Step ${step} of 6`} />
      <Panel>
        <div className="flex gap-2 mb-5 flex-wrap">
          {["Basic", "Investment", "Financials", "Documents", "Images", "Publish"].map((label, i) => (
            <button key={label} onClick={() => setStep(i + 1)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono tracking-wider ${step === i + 1 ? "bg-accent-blue text-white" : "bg-secondary text-muted-foreground"}`}>
              {i + 1}. {label}
            </button>
          ))}
        </div>

        {step === 1 && (
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Title"><input className={inputCls} value={f.title} onChange={(e) => set("title", e.target.value)} /></Field>
            <Field label="Slug (auto if blank)"><input className={inputCls} value={f.slug} onChange={(e) => set("slug", e.target.value)} placeholder={slugify(f.title)} /></Field>
            <Field label="Industry"><select className={inputCls} value={f.industry} onChange={(e) => set("industry", e.target.value)}>{INDUSTRIES.map((i) => <option key={i}>{i}</option>)}</select></Field>
            <Field label="Risk level"><select className={inputCls} value={f.risk_level} onChange={(e) => set("risk_level", e.target.value)}>{RISK_LEVELS.map((r) => <option key={r}>{r}</option>)}</select></Field>
            <Field label="Short description" className="sm:col-span-2"><input className={inputCls} value={f.short_description} onChange={(e) => set("short_description", e.target.value)} /></Field>
            <Field label="Full description" className="sm:col-span-2"><textarea className={`${inputCls} min-h-[120px] py-2`} value={f.full_description} onChange={(e) => set("full_description", e.target.value)} /></Field>
          </div>
        )}
        {step === 2 && (
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Investment type"><select className={inputCls} value={f.investment_type} onChange={(e) => set("investment_type", e.target.value)}>{INVESTMENT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Currency"><input className={inputCls} value={f.currency} onChange={(e) => set("currency", e.target.value)} /></Field>
            <Field label="Minimum investment"><input type="number" className={inputCls} value={f.minimum_investment} onChange={(e) => set("minimum_investment", e.target.value)} /></Field>
            <Field label="Maximum investment (optional)"><input type="number" className={inputCls} value={f.maximum_investment ?? ""} onChange={(e) => set("maximum_investment", e.target.value)} /></Field>
            <Field label="Start date"><input type="date" className={inputCls} value={f.start_date?.slice(0,10) ?? ""} onChange={(e) => set("start_date", e.target.value ? new Date(e.target.value).toISOString() : "")} /></Field>
            <Field label="End date"><input type="date" className={inputCls} value={f.end_date?.slice(0,10) ?? ""} onChange={(e) => set("end_date", e.target.value ? new Date(e.target.value).toISOString() : "")} /></Field>
          </div>
        )}
        {step === 3 && (
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Target raise"><input type="number" className={inputCls} value={f.target_amount} onChange={(e) => set("target_amount", e.target.value)} /></Field>
            <Field label="Available shares"><input type="number" className={inputCls} value={f.available_shares} onChange={(e) => set("available_shares", e.target.value)} /></Field>
            <Field label="Price per share"><input type="number" className={inputCls} value={f.price_per_share} onChange={(e) => set("price_per_share", e.target.value)} /></Field>
            <Field label="Expected ROI (%)"><input type="number" className={inputCls} value={f.expected_roi ?? ""} onChange={(e) => set("expected_roi", e.target.value)} /></Field>
          </div>
        )}
        {step === 4 && (
          <div className="text-sm text-muted-foreground">
            Document attachments (PDF/DOCX/XLSX/PPTX) are added on the opportunity edit page after creation.
          </div>
        )}
        {step === 5 && (
          <div className="text-sm text-muted-foreground">
            Cover image and gallery uploads are available on the opportunity edit page after creation.
          </div>
        )}
        {step === 6 && (
          <div className="space-y-3">
            <Field label="Status"><select className={inputCls} value={f.status} onChange={(e) => set("status", e.target.value)}>{OPP_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}</select></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} /> Featured</label>
            <div className="text-xs text-muted-foreground">Save as draft to continue editing, or publish to make it live.</div>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <button className={btnSecondary} onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>Back</button>
          <div className="flex gap-2">
            {step < 6 && <button className={btnPrimary} onClick={() => setStep(Math.min(6, step + 1))}>Next</button>}
            {step === 6 && <>
              <button className={btnSecondary} onClick={() => submit("draft")}>Save draft</button>
              <button className={btnPrimary} onClick={() => submit("active")}>Publish</button>
            </>}
          </div>
        </div>
      </Panel>
    </div>
  );
}

function Field({ label, children, className = "" }: any) {
  return <label className={`block ${className}`}><div className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase mb-1">{label}</div>{children}</label>;
}
