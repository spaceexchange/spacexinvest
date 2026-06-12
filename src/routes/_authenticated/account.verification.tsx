import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Pill, inputCls } from "@/components/dashboard/ui";
import { getMyKyc, submitKyc } from "@/lib/data/portal";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Upload, IdCard, MapPin, User, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account/verification")({
  head: () => ({ meta: [{ title: "Verification — SpaceX IPO Exchange" }] }),
  component: VerificationPage,
});

function VerificationPage() {
  const [kyc, setKyc] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    first_name: "", last_name: "", nationality: "", address: "", date_of_birth: "", document_type: "passport",
  });
  const [docFile, setDocFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  async function refresh() {
    const k = await getMyKyc();
    setKyc(k);
    if (k) setForm({
      first_name: k.first_name ?? "", last_name: k.last_name ?? "", nationality: k.nationality ?? "",
      address: k.address ?? "", date_of_birth: k.date_of_birth ?? "", document_type: k.document_type ?? "passport",
    });
  }
  useEffect(() => { refresh(); }, []);

  async function upload(file: File, kind: "doc" | "selfie") {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in");
    const path = `${user.id}/${kind}-${Date.now()}-${file.name}`;
    const r = await supabase.storage.from("kyc-documents").upload(path, file);
    if (r.error) throw r.error;
    return path;
  }

  async function submit() {
    setBusy(true); setMsg(null);
    try {
      let document_url: string | null = kyc?.document_url ?? null;
      let selfie_url: string | null = kyc?.selfie_url ?? null;
      if (docFile) document_url = await upload(docFile, "doc");
      if (selfieFile) selfie_url = await upload(selfieFile, "selfie");
      await submitKyc({ ...form, document_url, selfie_url });
      setMsg("Submitted for review.");
      setDocFile(null); setSelfieFile(null);
      await refresh();
    } catch (e: any) { setMsg(e.message); }
    setBusy(false);
  }

  const status = kyc?.status ?? "not_started";
  const stepTone: Record<string, "success" | "warning" | "danger" | "default"> =
    { approved: "success", pending: "warning", info_requested: "warning", rejected: "danger", not_started: "default" };

  return (
    <div>
      <PageHeader title="Verification Center" subtitle="Complete KYC to unlock full investment tiers." />

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4">
          <Panel title="Personal Information">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Legal first name" value={form.first_name} onChange={(v) => setForm({ ...form, first_name: v })} />
              <Field label="Legal last name" value={form.last_name} onChange={(v) => setForm({ ...form, last_name: v })} />
              <Field label="Date of birth" type="date" value={form.date_of_birth} onChange={(v) => setForm({ ...form, date_of_birth: v })} />
              <Field label="Nationality" value={form.nationality} onChange={(v) => setForm({ ...form, nationality: v })} />
            </div>
          </Panel>

          <Panel title="Address">
            <Field label="Full address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
          </Panel>

          <Panel title="Identity Upload">
            <div className="flex gap-2 mb-4">
              {(["passport", "license", "id"] as const).map((d) => (
                <button key={d} onClick={() => setForm({ ...form, document_type: d })} className={`h-9 px-3 rounded-md text-xs font-medium transition-colors ${form.document_type === d ? "bg-accent-blue text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                  {d === "passport" ? "Passport" : d === "license" ? "Driver License" : "National ID"}
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <UploadBox label="ID document" file={docFile} onFile={setDocFile} />
              <UploadBox label="Selfie holding document" file={selfieFile} onFile={setSelfieFile} />
            </div>
            {msg && <div className="text-xs text-accent-blue mt-3">{msg}</div>}
            <button onClick={submit} disabled={busy} className="btn-primary mt-5 disabled:opacity-50">{busy ? "Submitting…" : status === "approved" ? "Update submission" : "Submit for review"}</button>
          </Panel>
        </div>

        <Panel title="Status">
          <div className="rounded-lg border p-3 mb-4 text-xs"
            style={{ borderColor: status === "approved" ? "rgb(16 185 129 / 0.3)" : status === "rejected" ? "rgb(239 68 68 / 0.3)" : "rgb(234 179 8 / 0.3)" }}>
            Current status: <Pill tone={stepTone[status]}>{status.replace("_", " ")}</Pill>
            {kyc?.review_notes && <p className="mt-2 text-muted-foreground">{kyc.review_notes}</p>}
          </div>

          <ol className="space-y-3">
            <Step icon={User} title="Personal information" done={!!kyc?.first_name} />
            <Step icon={MapPin} title="Address" done={!!kyc?.address} />
            <Step icon={IdCard} title="Identity document" done={!!kyc?.document_url} review={status === "pending"} />
            <Step icon={ShieldCheck} title="Verified investor" done={status === "approved"} />
          </ol>
        </Panel>
      </div>
    </div>
  );
}

function Step({ icon: Icon, title, done, review }: { icon: any; title: string; done?: boolean; review?: boolean }) {
  return (
    <li className="flex items-start gap-3">
      <div className={`h-8 w-8 rounded-full grid place-items-center shrink-0 ${done ? "bg-emerald-500/20 text-emerald-400" : review ? "bg-yellow-500/20 text-yellow-400" : "bg-secondary text-muted-foreground"}`}>
        {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <Pill tone={done ? "success" : review ? "warning" : "default"}>{done ? "Done" : review ? "Review" : "Pending"}</Pill>
      </div>
    </li>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase block mb-1.5">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} type={type} className={inputCls} />
    </label>
  );
}

function UploadBox({ label, file, onFile }: { label: string; file: File | null; onFile: (f: File) => void }) {
  return (
    <label className="block rounded-lg border border-dashed border-border bg-surface/40 p-5 text-center cursor-pointer hover:border-accent-blue/40 transition-colors">
      <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
      <div className="text-sm text-foreground">{file ? file.name : label}</div>
      <div className="text-[11px] text-muted-foreground mt-1">PDF, JPG, PNG · max 10MB</div>
      <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
    </label>
  );
}
