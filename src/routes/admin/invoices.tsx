import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Ban } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, Pill, DataTable, Td, btnGhost } from "@/components/staff/ui";
import { moneyc } from "@/lib/data/portal";
import { adminListInvoices, adminUpdateInvoice, adminMarkPaid, INVOICE_TONE, formatInvoiceStatus, type Invoice, type InvoiceStatus } from "@/lib/invoices";

export const Route = createFileRoute("/admin/invoices")({ component: AdminInvoicesPage });

const TABS = ["all", "purchase", "deposit"] as const;

function AdminInvoicesPage() {
  const [tab, setTab] = useState<typeof TABS[number]>("all");
  const [rows, setRows] = useState<Invoice[]>([]);

  async function load() {
    setRows(await adminListInvoices(tab === "all" ? {} : { kind: tab }));
  }
  useEffect(() => { load(); }, [tab]);

  async function markPaid(id: string) {
    try { await adminMarkPaid(id); toast.success("Invoice marked paid"); load(); }
    catch (e: any) { toast.error(e.message); }
  }
  async function setStatus(id: string, status: InvoiceStatus) {
    try { await adminUpdateInvoice(id, { status } as any); toast.success(`Marked ${status}`); load(); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <div>
      <PageHeader eyebrow="FINANCE OPS" title="Invoice Management" subtitle="Every purchase and deposit invoice, with full payment lifecycle controls." />

      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
                  className={`px-3 h-9 rounded-md border text-sm capitalize ${tab === t ? "border-accent-blue/40 bg-accent-blue/10 text-accent-blue" : "border-border bg-surface/40"}`}>
            {t}
          </button>
        ))}
      </div>

      <Panel>
        <DataTable columns={["Invoice", "User", "Title", "Amount", "Status", "Created", ""]}>
          {rows.map(inv => (
            <tr key={inv.id}>
              <Td><span className="font-mono text-xs text-accent-blue">{inv.invoice_number}</span></Td>
              <Td><span className="font-mono text-[11px] text-muted-foreground">{inv.user_id.slice(0, 8)}…</span></Td>
              <Td className="max-w-[260px] truncate">{inv.title}</Td>
              <Td><span className="font-mono">{moneyc(Number(inv.amount_due))}</span></Td>
              <Td><Pill tone={INVOICE_TONE[inv.status]}>{formatInvoiceStatus(inv.status)}</Pill></Td>
              <Td><span className="text-[11px] text-muted-foreground font-mono">{new Date(inv.created_at).toLocaleString()}</span></Td>
              <Td>
                <div className="flex justify-end gap-1">
                  {inv.status !== "paid" && inv.status !== "completed" && (
                    <button onClick={() => markPaid(inv.id)} className={btnGhost}>
                      <Check className="h-3.5 w-3.5 text-emerald-400" /> Mark paid
                    </button>
                  )}
                  {!["cancelled", "refunded", "rejected"].includes(inv.status) && (
                    <button onClick={() => setStatus(inv.id, "cancelled")} className={btnGhost}>
                      <Ban className="h-3.5 w-3.5 text-red-400" /> Cancel
                    </button>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </DataTable>
        {rows.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No invoices.</div>}
      </Panel>
    </div>
  );
}
