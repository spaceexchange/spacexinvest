import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Pill, btnGhost } from "@/components/staff/ui";
import { StaffNotesPanel } from "@/components/staff/StaffNotesPanel";
import { moneyc } from "@/lib/data/portal";
import { reviewFunding } from "@/lib/data/admin.functions";

export const Route = createFileRoute("/admin/funding/$id")({ component: FundingDetailPage });

function FundingDetailPage() {
  const { id } = Route.useParams();
  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const review = useServerFn(reviewFunding);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("funding_requests").select("*, profile:profiles!funding_requests_user_id_fkey(display_name,email,id)").eq("id", id).maybeSingle();
    setRow(data); setLoading(false);
  }
  useEffect(() => { load(); }, [id]);

  async function act(decision: "approved" | "rejected") {
    const notes = decision === "rejected" ? prompt("Reason:") ?? undefined : undefined;
    try { await review({ data: { id, decision, notes } }); toast.success(`Request ${decision}`); load(); }
    catch (e: any) { toast.error(e.message); }
  }

  if (loading) return <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!row) return <div className="py-10 text-center text-sm text-muted-foreground">Request not found.</div>;

  const isWithdrawal = row.request_type === "withdrawal";
  const backTo = isWithdrawal ? "/admin/withdrawals" : "/admin/funding";

  return (
    <div>
      <Link to={backTo} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"><ArrowLeft className="h-3 w-3" />Back</Link>
      <PageHeader
        eyebrow={isWithdrawal ? "WITHDRAWAL REQUEST" : "DEPOSIT REQUEST"}
        title={moneyc(Number(row.amount))}
        subtitle={`${row.payment_method} • Submitted ${new Date(row.created_at).toLocaleString()}`}
        action={
          <div className="flex items-center gap-2">
            <Pill tone={row.status === "approved" ? "success" : row.status === "rejected" ? "danger" : "warning"}>{row.status}</Pill>
            {row.status === "pending" && (
              <>
                <button onClick={() => act("approved")} className={btnGhost}><Check className="h-3.5 w-3.5 text-emerald-400" />Approve</button>
                <button onClick={() => act("rejected")} className={btnGhost}><X className="h-3.5 w-3.5 text-red-400" />Reject</button>
              </>
            )}
          </div>
        }
      />
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Panel title="Request">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <F label="User" value={row.profile?.display_name ?? row.profile?.email ?? "—"} />
              <F label="Email" value={row.profile?.email ?? "—"} />
              <F label="Type" value={row.request_type} />
              <F label="Method" value={row.payment_method} />
              <F label="Amount" value={moneyc(Number(row.amount))} />
              <F label="Currency" value={row.currency ?? "USD"} />
              <F label="Reference" value={row.reference ?? "—"} mono />
              <F label="Reviewed At" value={row.reviewed_at ? new Date(row.reviewed_at).toLocaleString() : "—"} />
            </dl>
            {row.admin_notes && <div className="mt-4 p-3 rounded-md bg-surface/40 border border-border text-xs"><span className="text-muted-foreground font-mono uppercase tracking-wider mr-2">Admin Notes:</span>{row.admin_notes}</div>}
          </Panel>
        </div>
        <div>
          <StaffNotesPanel entityType={isWithdrawal ? "withdrawal" : "funding_request"} entityId={id} />
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
