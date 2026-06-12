import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Pill } from "@/components/staff/ui";
import { StaffNotesPanel } from "@/components/staff/StaffNotesPanel";

export const Route = createFileRoute("/compliance/cases/$id")({ component: CaseDetailPage });

const STATUSES = ["open", "in_review", "escalated", "resolved", "closed"] as const;

function CaseDetailPage() {
  const { id } = Route.useParams();
  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("compliance_cases").select("*").eq("id", id).maybeSingle();
    setRow(data); setLoading(false);
  }
  useEffect(() => { load(); }, [id]);

  async function setStatus(s: string) {
    const { error } = await supabase.from("compliance_cases").update({ status: s }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(`Status: ${s}`); load(); }
  }
  async function setSeverity(sv: string) {
    const { error } = await supabase.from("compliance_cases").update({ severity: sv }).eq("id", id);
    if (error) toast.error(error.message); else load();
  }

  if (loading) return <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!row) return <div className="py-10 text-center text-sm text-muted-foreground">Case not found.</div>;

  return (
    <div>
      <Link to="/compliance/cases" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"><ArrowLeft className="h-3 w-3" />Back to cases</Link>
      <PageHeader
        eyebrow={`CASE #${String(row.id).slice(0, 8)}`}
        title={row.title ?? "Compliance Case"}
        subtitle={`${row.case_type ?? "general"} • Opened ${new Date(row.created_at).toLocaleDateString()}`}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Pill tone={row.severity === "critical" || row.severity === "high" ? "danger" : row.severity === "medium" ? "warning" : "default"}>{row.severity ?? "low"}</Pill>
            <Pill tone={row.status === "resolved" || row.status === "closed" ? "success" : row.status === "escalated" ? "warning" : "info"}>{row.status}</Pill>
          </div>
        }
      />
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Panel title="Case Details">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <F label="Case ID" value={row.id} mono />
              <F label="Type" value={row.case_type ?? "—"} />
              <F label="Subject User" value={row.subject_user_id ?? "—"} mono />
              <F label="Assigned To" value={row.assigned_to ?? "—"} mono />
              <F label="Source" value={row.source ?? "—"} />
              <F label="Priority" value={row.priority ?? "—"} />
            </dl>
            {row.description && (
              <div className="mt-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">Description</div>
                <p className="text-sm whitespace-pre-wrap text-foreground/90">{row.description}</p>
              </div>
            )}
          </Panel>
          <Panel title="Actions">
            <div className="flex flex-wrap gap-2">
              <div className="text-xs text-muted-foreground self-center mr-2">Status:</div>
              {STATUSES.map((s) => (
                <button key={s} onClick={() => setStatus(s)} className={`text-xs px-2 h-7 rounded border ${row.status === s ? "border-accent-blue/40 bg-accent-blue/10 text-accent-blue" : "border-border hover:border-accent-blue/40"}`}>{s}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <div className="text-xs text-muted-foreground self-center mr-2">Severity:</div>
              {["low", "medium", "high", "critical"].map((s) => (
                <button key={s} onClick={() => setSeverity(s)} className={`text-xs px-2 h-7 rounded border ${row.severity === s ? "border-red-400/40 bg-red-500/10 text-red-300" : "border-border hover:border-red-400/40"}`}>{s}</button>
              ))}
            </div>
          </Panel>
        </div>
        <div>
          <StaffNotesPanel entityType="compliance_case" entityId={id} />
        </div>
      </div>
    </div>
  );
}

function F({ label, value, mono }: { label: string; value: any; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className={`text-sm text-foreground truncate ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
