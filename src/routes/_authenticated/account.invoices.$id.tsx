import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Printer, ArrowLeft, CreditCard } from "lucide-react";
import { PageHeader, Panel } from "@/components/dashboard/ui";
import { InvoiceCard } from "@/components/invoices/InvoiceCard";
import { getInvoice, type Invoice } from "@/lib/invoices";
import { moneyc } from "@/lib/data/portal";

export const Route = createFileRoute("/_authenticated/account/invoices/$id")({
  head: () => ({ meta: [{ title: "Invoice — SpaceX IPO Exchange" }] }),
  component: InvoiceDetail,
});

function InvoiceDetail() {
  const { id } = Route.useParams();
  const [inv, setInv] = useState<Invoice | null>(null);
  useEffect(() => { getInvoice(id).then(setInv); }, [id]);

  if (!inv) return <div className="py-12 text-center text-sm text-muted-foreground">Loading invoice…</div>;

  const meta = inv.metadata ?? {};
  const remaining = Math.max(0, Number(inv.amount_due) - Number(inv.amount_paid));
  const needsPayment = ["awaiting_payment", "partially_paid", "pending_verification"].includes(inv.status);

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-4 print:hidden">
        <Link to="/account/invoices" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to invoices
        </Link>
        <button onClick={() => window.print()} className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/40 text-xs">
          <Printer className="h-3.5 w-3.5" /> Print
        </button>
      </div>

      <PageHeader title={`Invoice ${inv.invoice_number}`} subtitle={inv.title} />

      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        <div className="space-y-4">
          <InvoiceCard invoice={inv} compact />

          <Panel title="Line item">
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div className="text-muted-foreground">Product</div>
              <div className="text-foreground text-right">{inv.title}</div>
              <div className="text-muted-foreground">Description</div>
              <div className="text-foreground text-right">{inv.description ?? "—"}</div>
              {meta.shares && (<><div className="text-muted-foreground">Shares</div><div className="text-foreground text-right font-mono">{meta.shares}</div></>)}
              {meta.price && (<><div className="text-muted-foreground">Price per share</div><div className="text-foreground text-right font-mono">{moneyc(Number(meta.price))}</div></>)}
              {meta.configuration && (<><div className="text-muted-foreground">Configuration</div><div className="text-foreground text-right text-xs">{Object.values(meta.configuration as Record<string, string>).join(" · ")}</div></>)}
              <div className="text-muted-foreground pt-2 border-t border-border">Subtotal</div>
              <div className="text-foreground text-right font-mono pt-2 border-t border-border">{moneyc(Number(inv.amount_due))}</div>
              <div className="text-muted-foreground">Paid</div>
              <div className="text-foreground text-right font-mono">{moneyc(Number(inv.amount_paid))}</div>
              <div className="text-accent-blue font-semibold">Balance</div>
              <div className="text-accent-blue font-semibold text-right font-mono">{moneyc(remaining)}</div>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          {needsPayment && inv.kind === "purchase" && (
            <Panel title="Pay this invoice">
              <p className="text-xs text-muted-foreground mb-3">
                Complete payment via Funding Center to fulfill this order.
              </p>
              <Link to="/account/funding" search={{ invoice: inv.id } as any}
                    className="btn-primary w-full inline-flex items-center justify-center gap-2">
                <CreditCard className="h-4 w-4" /> Pay {moneyc(remaining)}
              </Link>
            </Panel>
          )}

          <Panel title="Status timeline">
            <ul className="text-xs space-y-2">
              <li className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{new Date(inv.created_at).toLocaleString()}</span></li>
              {inv.paid_at && <li className="flex justify-between"><span className="text-muted-foreground">Paid</span><span>{new Date(inv.paid_at).toLocaleString()}</span></li>}
              <li className="flex justify-between"><span className="text-muted-foreground">Last updated</span><span>{new Date(inv.updated_at).toLocaleString()}</span></li>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
