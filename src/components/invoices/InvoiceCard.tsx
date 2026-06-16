import { FileText, Printer } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Pill } from "@/components/dashboard/ui";
import { moneyc } from "@/lib/data/portal";
import { INVOICE_TONE, formatInvoiceStatus, type Invoice } from "@/lib/invoices";

export function InvoiceCard({ invoice, compact = false }: { invoice: Invoice; compact?: boolean }) {
  const remaining = Math.max(0, Number(invoice.amount_due) - Number(invoice.amount_paid));
  const pct = invoice.amount_due > 0 ? Math.min(100, (Number(invoice.amount_paid) / Number(invoice.amount_due)) * 100) : 0;
  return (
    <div className="rounded-xl border-2 border-accent-blue/30 bg-gradient-to-br from-accent-blue/5 to-transparent p-5 print:border-black print:bg-white">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-accent-blue" />
            <span className="text-[10px] font-mono tracking-[0.3em] text-muted-foreground uppercase">Payment Invoice</span>
          </div>
          <div className="font-mono text-base font-semibold text-foreground">{invoice.invoice_number}</div>
          <div className="text-xs text-muted-foreground mt-0.5 truncate">{invoice.title}</div>
        </div>
        <Pill tone={INVOICE_TONE[invoice.status]}>{formatInvoiceStatus(invoice.status)}</Pill>
      </div>

      {invoice.description && (
        <div className="text-xs text-muted-foreground mb-3 border-l-2 border-border pl-2">{invoice.description}</div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-3">
        <Stat label="Amount Due" value={moneyc(Number(invoice.amount_due))} highlight />
        <Stat label="Paid" value={moneyc(Number(invoice.amount_paid))} />
        <Stat label="Remaining" value={moneyc(remaining)} />
      </div>

      <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-3">
        <div className="h-full bg-accent-blue transition-all" style={{ width: `${pct}%` }} />
      </div>

      {!compact && (
        <div className="flex gap-2 mt-4 print:hidden">
          <Link to="/account/invoices/$id" params={{ id: invoice.id }}
                className="flex-1 h-9 grid place-items-center rounded-md border border-border bg-surface/40 text-xs hover:bg-secondary">
            View invoice
          </Link>
          <button onClick={() => window.print()}
                  className="h-9 px-3 grid place-items-center rounded-md border border-border bg-surface/40 text-xs hover:bg-secondary">
            <Printer className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-md bg-surface/60 border border-border p-2">
      <div className="text-[9px] font-mono tracking-wider text-muted-foreground uppercase">{label}</div>
      <div className={`text-sm font-mono mt-0.5 ${highlight ? "text-accent-blue font-semibold" : "text-foreground"}`}>{value}</div>
    </div>
  );
}
