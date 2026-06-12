import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader, Panel, StatCard } from "@/components/dashboard/ui";
import { getMyWallet, getMyWalletTransactions } from "@/lib/data/portal";
import { Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useFormatters } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/account/wallet")({
  head: () => ({ meta: [{ title: "Wallet — SpaceX IPO Exchange" }] }),
  component: WalletPage,
});

function WalletPage() {
  const { t } = useTranslation();
  const { formatCurrency, formatNumber, formatDateTime } = useFormatters();
  const [wallet, setWallet] = useState<any>(null);
  const [txs, setTxs] = useState<any[]>([]);

  useEffect(() => {
    (async () => { setWallet(await getMyWallet()); setTxs(await getMyWalletTransactions(100)); })();
  }, []);

  const balance = Number(wallet?.balance ?? 0);
  const monthly = txs.filter((tx) => new Date(tx.created_at).getMonth() === new Date().getMonth())
    .reduce((a, b) => a + (b.transaction_type === "dividend" ? Number(b.amount) : 0), 0);

  return (
    <div>
      <PageHeader title={t("wallet.title")} subtitle={t("wallet.subtitle")} />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mb-6">
        <StatCard label={t("wallet.available")} value={formatCurrency(balance)} icon={<WalletIcon className="h-4 w-4" />} />
        <StatCard label={t("wallet.status")} value={wallet?.status ?? "—"} />
        <StatCard label={t("wallet.yieldMonth")} value={formatCurrency(monthly)} />
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        <div className="glass-card rounded-xl p-5 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] font-mono tracking-[0.25em] text-muted-foreground uppercase">{wallet?.currency ?? "USD"}</div>
              <div className="text-2xl font-semibold text-foreground mt-1">{formatNumber(balance, { maximumFractionDigits: 2 })} <span className="text-sm text-muted-foreground">{wallet?.currency ?? "USD"}</span></div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-background/60 grid place-items-center text-xs font-bold text-foreground">$</div>
          </div>
          <div className="flex gap-2">
            <Link to="/account/funding" className="flex-1 h-9 rounded-md bg-background/50 text-xs font-medium text-foreground hover:bg-background grid place-items-center"><ArrowDownToLine className="h-3.5 w-3.5 inline mr-1" />{t("wallet.deposit")}</Link>
            <Link to="/account/funding" className="flex-1 h-9 rounded-md bg-background/50 text-xs font-medium text-foreground hover:bg-background grid place-items-center"><ArrowUpFromLine className="h-3.5 w-3.5 inline mr-1" />{t("wallet.withdraw")}</Link>
          </div>
        </div>
      </div>

      <Panel title={t("wallet.recent")}>
        <ul className="divide-y divide-border">
          {txs.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">{t("wallet.empty")}</li>}
          {txs.slice(0, 10).map((tx) => (
            <li key={tx.id} className="py-3 grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center">
              <div className="min-w-0">
                <div className="text-sm capitalize text-foreground">{t(`transactions.types.${tx.transaction_type}`, { defaultValue: tx.transaction_type })} · <span className="text-muted-foreground">{tx.reference}</span></div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{formatDateTime(tx.created_at)}</div>
              </div>
              <div className={`text-sm font-medium ${["deposit", "dividend"].includes(tx.transaction_type) ? "text-emerald-400" : "text-foreground"}`}>
                {["deposit", "dividend"].includes(tx.transaction_type) ? "+" : "−"}{formatCurrency(Number(tx.amount))}
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
