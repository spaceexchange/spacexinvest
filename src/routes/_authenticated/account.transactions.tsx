import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader, Panel, Pill, inputCls } from "@/components/dashboard/ui";
import { getMyWalletTransactions } from "@/lib/data/portal";
import { Search, Download } from "lucide-react";
import { useFormatters } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/account/transactions")({
  head: () => ({ meta: [{ title: "Transactions — SpaceX IPO Exchange" }] }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const { t } = useTranslation();
  const { formatCurrency, formatDate } = useFormatters();
  const [txs, setTxs] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState("All");
  const types = ["All", "deposit", "withdrawal", "investment", "dividend", "adjustment", "fee"] as const;

  useEffect(() => { getMyWalletTransactions(200).then(setTxs); }, []);

  const list = txs.filter((tx) => (type === "All" || tx.transaction_type === type) && (!q || (`${tx.reference} ${tx.transaction_type}`).toLowerCase().includes(q.toLowerCase())));

  function exportCsv() {
    const rows = [["id", "date", "type", "reference", "status", "amount", "balance_after"]];
    list.forEach((tx) => rows.push([tx.id, tx.created_at, tx.transaction_type, tx.reference ?? "", tx.status, String(tx.amount), String(tx.balance_after)]));
    const csv = rows.map((r) => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "transactions.csv"; a.click();
  }

  return (
    <div>
      <PageHeader title={t("transactions.title")} subtitle={t("transactions.subtitle")}
        action={<button onClick={exportCsv} className="h-9 px-3 rounded-md border border-border text-xs font-medium text-foreground hover:border-accent-blue/40 hover:text-accent-blue transition-colors flex items-center gap-2"><Download className="h-3.5 w-3.5" /> {t("transactions.exportCsv")}</button>}
      />

      <Panel className="mb-4">
        <div className="grid sm:grid-cols-[1fr_auto] gap-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("transactions.searchPlaceholder")} className={`${inputCls} pl-9`} />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {types.map((typ) => (
              <button key={typ} onClick={() => setType(typ)} className={`h-10 px-3 rounded-md text-xs font-medium whitespace-nowrap capitalize transition-colors ${type === typ ? "bg-accent-blue text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{t(`transactions.types.${typ}`, { defaultValue: typ })}</button>
            ))}
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase border-b border-border">
                <th className="py-2 pr-4 font-normal">{t("transactions.cols.ref")}</th>
                <th className="py-2 pr-4 font-normal">{t("transactions.cols.date")}</th>
                <th className="py-2 pr-4 font-normal">{t("transactions.cols.type")}</th>
                <th className="py-2 pr-4 font-normal">{t("transactions.cols.status")}</th>
                <th className="py-2 font-normal text-right">{t("transactions.cols.amount")}</th>
                <th className="py-2 font-normal text-right">{t("transactions.cols.balance")}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((tx) => {
                const credit = ["deposit", "dividend"].includes(tx.transaction_type);
                return (
                  <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 pr-4 font-mono text-[11px] text-muted-foreground">{tx.reference ?? tx.id.slice(0, 8)}</td>
                    <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">{formatDate(tx.created_at)}</td>
                    <td className="py-3 pr-4 text-foreground capitalize">{t(`transactions.types.${tx.transaction_type}`, { defaultValue: tx.transaction_type })}</td>
                    <td className="py-3 pr-4"><Pill tone={tx.status === "completed" ? "success" : "warning"}>{t(`common.${tx.status}`, { defaultValue: tx.status })}</Pill></td>
                    <td className={`py-3 text-right font-medium ${credit ? "text-emerald-400" : "text-foreground"}`}>{credit ? "+" : "−"}{formatCurrency(Number(tx.amount))}</td>
                    <td className="py-3 text-right text-muted-foreground">{formatCurrency(Number(tx.balance_after))}</td>
                  </tr>
                );
              })}
              {list.length === 0 && (<tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">{t("transactions.empty")}</td></tr>)}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
