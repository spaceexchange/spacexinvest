import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader, Panel, Pill } from "@/components/dashboard/ui";
import { getMyInvoices, INVOICE_TONE, formatInvoiceStatus, type Invoice } from "@/lib/invoices";
import { useFormatters } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/account/invoices")({
  head: () => ({ meta: [{ title: "Invoices — SpaceX IPO Exchange" }] }),
  component: InvoicesLayout,
});

function InvoicesLayout() {
  const path = useRouterState({ select: s => s.location.pathname });
  if (path !== "/account/invoices") return <Outlet />;
  return <InvoicesList />;
}

function InvoicesList() {
  const { t } = useTranslation();
  const { formatCurrency, formatDate } = useFormatters();
  const [rows, setRows] = useState<Invoice[]>([]);
  const [tab, setTab] = useState<"all" | "purchase" | "deposit">("all");
  const [pay, setPay] = useState<"all" | "unpaid" | "paid">("all");

  useEffect(() => { getMyInvoices().then(setRows); }, []);
  const isPaid = (r: Invoice) => r.status === "paid" || r.status === "completed";
  const filtered = rows
    .filter(r => tab === "all" || r.kind === tab)
    .filter(r => pay === "all" || (pay === "paid" ? isPaid(r) : !isPaid(r)));

  return (
    <div>
      <PageHeader title={t("invoices.title")} subtitle={t("invoices.subtitle")} />

      <div className="flex flex-wrap gap-2 mb-3">
        {(["all", "purchase", "deposit"] as const).map(tk => (
          <button key={tk} onClick={() => setTab(tk)}
                  className={`px-3 h-9 rounded-md border text-sm capitalize ${tab === tk ? "border-accent-blue/40 bg-accent-blue/10 text-accent-blue" : "border-border bg-surface/40"}`}>
            {t(`invoices.tabs.${tk}`)} <span className="text-xs text-muted-foreground ml-1">({tk === "all" ? rows.length : rows.filter(r => r.kind === tk).length})</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {(["all", "unpaid", "paid"] as const).map(p => (
          <button key={p} onClick={() => setPay(p)}
                  className={`px-3 h-8 rounded-md border text-xs capitalize ${pay === p ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-400" : "border-border bg-surface/40 text-muted-foreground"}`}>
            {t(`invoices.tabs.${p}`)}
          </button>
        ))}
      </div>

      <Panel>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
            {t("invoices.empty")}
          </div>
        )}
        <ul className="divide-y divide-border">
          {filtered.map(inv => (
            <li key={inv.id}>
              <Link to="/account/invoices/$id" params={{ id: inv.id }}
                    className="grid grid-cols-[1fr_auto] gap-3 py-3 hover:bg-secondary/30 px-2 -mx-2 rounded-md">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs text-accent-blue">{inv.invoice_number}</span>
                    <Pill tone={INVOICE_TONE[inv.status]}>{formatInvoiceStatus(inv.status)}</Pill>
                  </div>
                  <div className="text-sm text-foreground truncate">{inv.title}</div>
                  <div className="text-[11px] text-muted-foreground">{formatDate(inv.created_at)} · {inv.payment_method ?? "—"}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-foreground">{formatCurrency(Number(inv.amount_due))}</div>
                  <div className="text-[11px] text-muted-foreground">{Number(inv.amount_paid) > 0 ? t("invoices.paidWith", { amount: formatCurrency(Number(inv.amount_paid)) }) : t("invoices.unpaid")}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
