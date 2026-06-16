import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trans } from "react-i18next";
import { Banknote, Building2, Bitcoin, ArrowDownToLine, ArrowUpFromLine, Copy, Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { PageHeader, Panel, Pill, StatCard, inputCls } from "@/components/dashboard/ui";
import {
  getMyAllWallets, getMyFundingRequests, getMyCryptoAddresses,
  createBankDeposit, createBankWithdrawal, createCryptoDeposit, createCryptoWithdrawal,
  uploadProof, type CryptoAsset, type CryptoNetwork, useRealtimeChannel,
} from "@/lib/data/portal";
import { useFormatters } from "@/lib/format";
import { getInvoice, type Invoice } from "@/lib/invoices";
import { InvoiceCard } from "@/components/invoices/InvoiceCard";

export const Route = createFileRoute("/_authenticated/account/funding")({
  head: () => ({ meta: [{ title: "Funding Center — SpaceX IPO Exchange" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ invoice: typeof s.invoice === "string" ? s.invoice : undefined }),
  component: FundingPage,
});

const CRYPTOS: { asset: CryptoAsset; network: CryptoNetwork; label: string }[] = [
  { asset: "BTC", network: "BTC", label: "Bitcoin" },
  { asset: "ETH", network: "ETH", label: "Ethereum" },
  { asset: "USDT", network: "TRON", label: "Tether (TRC-20)" },
  { asset: "USDC", network: "ETH", label: "USD Coin (ERC-20)" },
];

function FundingPage() {
  const { t } = useTranslation();
  const { formatCurrency, formatDate } = useFormatters();
  const { invoice: invoiceId } = Route.useSearch();
  const [wallets, setWallets] = useState<any[]>([]);
  const [reqs, setReqs] = useState<any[]>([]);
  const [addrs, setAddrs] = useState<any[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [rail, setRail] = useState<"bank" | "crypto">("bank");
  const [tab, setTab] = useState<"deposit" | "withdrawal">("deposit");

  async function refresh() {
    const [w, r, a] = await Promise.all([getMyAllWallets(), getMyFundingRequests(), getMyCryptoAddresses()]);
    setWallets(w); setReqs(r); setAddrs(a);
    if (invoiceId) setInvoice(await getInvoice(invoiceId));
  }
  useEffect(() => { refresh(); }, [invoiceId]);
  useRealtimeChannel("funding-investor", [
    { table: "funding_requests" }, { table: "wallets" }, { table: "crypto_deposit_addresses" }, { table: "invoices" },
  ], refresh);

  const usd = wallets.find((w) => w.currency === "USD");
  const pending = reqs.filter((r) => !["approved", "rejected", "completed"].includes(r.workflow_stage ?? r.status)).reduce((a, b) => a + Number(b.amount), 0);
  const deposits = reqs.filter((r) => r.status === "approved" && r.request_type === "deposit").reduce((a, b) => a + Number(b.amount), 0);

  return (
    <div>
      <PageHeader title={t("funding.title")} subtitle={t("funding.subtitle")} />

      {invoice && (
        <div className="mb-6">
          <InvoiceCard invoice={invoice} />
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mb-6">
        <StatCard label={t("funding.usdBalance")} value={formatCurrency(Number(usd?.balance ?? 0), "USD")} icon={<Banknote className="h-4 w-4" />} />
        <StatCard label={t("funding.pendingRequests")} value={formatCurrency(pending, "USD")} />
        <StatCard label={t("funding.lifetimeDeposits")} value={formatCurrency(deposits, "USD")} />
      </div>

      <div className="flex gap-2 mb-4">
        <RailBtn active={rail === "bank"} onClick={() => setRail("bank")} icon={<Building2 className="h-4 w-4" />}>{t("funding.rail.bank")}</RailBtn>
        <RailBtn active={rail === "crypto"} onClick={() => setRail("crypto")} icon={<Bitcoin className="h-4 w-4" />}>{t("funding.rail.crypto")}</RailBtn>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4 mb-4">
        <Panel>
          <div className="flex gap-2 mb-5">
            <TabBtn active={tab === "deposit"} onClick={() => setTab("deposit")} icon={<ArrowDownToLine className="h-4 w-4" />}>{t("funding.tab.deposit")}</TabBtn>
            <TabBtn active={tab === "withdrawal"} onClick={() => setTab("withdrawal")} icon={<ArrowUpFromLine className="h-4 w-4" />}>{t("funding.tab.withdraw")}</TabBtn>
          </div>

          {rail === "bank" && tab === "deposit" && <BankDepositForm onDone={refresh} />}
          {rail === "bank" && tab === "withdrawal" && <BankWithdrawForm onDone={refresh} max={Number(usd?.balance ?? 0)} />}
          {rail === "crypto" && tab === "deposit" && <CryptoDepositForm onDone={refresh} addrs={addrs} />}
          {rail === "crypto" && tab === "withdrawal" && <CryptoWithdrawForm onDone={refresh} wallets={wallets} />}
        </Panel>

        <Panel title={t("funding.activity")}>
          <ul className="divide-y divide-border max-h-[520px] overflow-y-auto">
            {reqs.length === 0 && <li className="py-6 text-center text-xs text-muted-foreground">{t("funding.noRequests")}</li>}
            {reqs.map((r) => (
              <li key={r.id} className="py-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <div className="min-w-0">
                  <div className="text-sm text-foreground capitalize truncate">
                    {t(`transactions.types.${r.request_type}`, { defaultValue: r.request_type })} · {r.payment_method}{r.asset !== "USD" ? ` (${r.asset})` : ""}
                  </div>
                  <div className="text-[11px] text-muted-foreground capitalize">
                    {(r.workflow_stage ?? r.status).replace(/_/g, " ")} · {formatDate(r.created_at)}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${r.request_type === "deposit" ? "text-emerald-400" : "text-foreground"}`}>
                    {r.request_type === "deposit" ? "+" : "−"}{Number(r.amount).toLocaleString()} {r.asset || r.currency}
                  </div>
                  <Pill tone={r.status === "approved" ? "success" : r.status === "rejected" ? "danger" : "warning"}>
                    {(r.workflow_stage ?? r.status).replace(/_/g, " ")}
                  </Pill>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function RailBtn({ active, onClick, icon, children }: any) {
  return (
    <button onClick={onClick} className={`h-10 px-4 rounded-md text-sm font-medium flex items-center gap-2 border transition-colors ${active ? "border-accent-blue/40 bg-accent-blue/10 text-accent-blue" : "border-border bg-surface/40 text-muted-foreground hover:text-foreground"}`}>
      {icon} {children}
    </button>
  );
}

function TabBtn({ active, onClick, icon, children }: any) {
  return (
    <button onClick={onClick} className={`flex-1 h-10 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors ${active ? "bg-accent-blue text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
      {icon} {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

// ============== BANK DEPOSIT ==============
function BankDepositForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");
  const [ref, setRef] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!amount || !bank || !ref || !date) return toast.error(t("funding.bank.fillRequired"));
    setBusy(true);
    try {
      let proof: string | undefined;
      if (file) proof = await uploadProof(file);
      await createBankDeposit({
        amount: Number(amount), sending_bank: bank, reference_number: ref,
        transfer_date: date, notes, proof_url: proof,
      });
      toast.success(t("funding.bank.depositSubmitted"));
      setAmount(""); setBank(""); setRef(""); setDate(""); setNotes(""); setFile(null);
      onDone();
    } catch (e: any) { toast.error(e.message); }
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface/40 p-3 text-xs space-y-1">
        <div className="font-semibold text-foreground">{t("funding.bank.wireTo")}</div>
        <div className="font-mono text-muted-foreground">Bank Name:  Wells Fargo </div>
        <div className="font-mono text-muted-foreground">Account Type:  Business Account</div>
        <div className="font-mono text-muted-foreground">Account Name:  Garden Nurse LLC</div>
        <div className="font-mono text-muted-foreground">Account Number for Personal:  7023582872</div>
        <div className="font-mono text-muted-foreground">Beneficiary Address:  10804 37th Ave SW Seattle 98146</div>
        <div className="font-mono text-muted-foreground">Bank Address:  4314 SW Alaska St, Seattle, WA 98116</div>
        <div className="font-mono text-muted-foreground">Last 4 digits of your Ssn:  5100</div>
        <div className="font-mono text-muted-foreground">EIN NO:  39-3655763</div>
        <div className="font-mono text-muted-foreground">Routing Number(FOR WIRE):  121000248</div>
        <div className="font-mono text-muted-foreground">OR</div>
        <div className="font-mono text-muted-foreground">Routing Number (FOR ACH):  125008547</div>
        <div className="text-[11px] text-amber-400/80">{t("funding.bank.includeReference")}</div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label={t("funding.fields.amountUsd")}><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} w-full`} placeholder="0.00" /></Field>
        <Field label={t("funding.fields.transferDate")}><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputCls} w-full`} /></Field>
        <Field label={t("funding.fields.sendingBank")}><input value={bank} onChange={(e) => setBank(e.target.value)} className={`${inputCls} w-full`} placeholder="e.g. JP Morgan" /></Field>
        <Field label={t("funding.fields.referenceNumber")}><input value={ref} onChange={(e) => setRef(e.target.value)} className={`${inputCls} w-full`} placeholder="Wire reference / SWIFT ID" /></Field>
      </div>
      <Field label={t("funding.fields.notes")}><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${inputCls} w-full py-2`} /></Field>
      <Field label={t("funding.fields.proof")}>
        <label className="flex items-center gap-2 h-10 px-3 rounded-md border border-dashed border-border bg-surface/40 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
          <Upload className="h-4 w-4" />
          <span className="truncate">{file?.name ?? t("funding.fields.uploadReceipt")}</span>
          <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} accept=".pdf,image/*" />
        </label>
      </Field>
      <button onClick={submit} disabled={busy} className="btn-primary w-full disabled:opacity-50">
        {busy ? t("common.submitting") : t("funding.bank.submitDeposit")}
      </button>
    </div>
  );
}

// ============== BANK WITHDRAW ==============
function BankWithdrawForm({ onDone, max }: { onDone: () => void; max: number }) {
  const { t } = useTranslation();
  const { formatCurrency } = useFormatters();
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");
  const [holder, setHolder] = useState("");
  const [acct, setAcct] = useState("");
  const [swift, setSwift] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!amount || !bank || !holder || !acct) return toast.error(t("funding.bank.fillRequired"));
    if (Number(amount) > max) return toast.error(t("funding.bank.exceedsBalance", { max: formatCurrency(max, "USD") }));
    setBusy(true);
    try {
      await createBankWithdrawal({
        amount: Number(amount), destination_bank: bank, account_holder: holder, account_number: acct, swift, notes,
      });
      toast.success(t("funding.bank.withdrawSubmitted"));
      setAmount(""); setBank(""); setHolder(""); setAcct(""); setSwift(""); setNotes("");
      onDone();
    } catch (e: any) { toast.error(e.message); }
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs flex gap-2">
        <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-muted-foreground">
          <Trans
            i18nKey="funding.bank.availableInfo"
            values={{ max: formatCurrency(max, "USD") }}
            components={{ 1: <span className="font-mono text-foreground" /> }}
          />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label={t("funding.fields.amountUsd")}><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} w-full`} /></Field>
        <Field label={t("funding.fields.destinationBank")}><input value={bank} onChange={(e) => setBank(e.target.value)} className={`${inputCls} w-full`} placeholder="Bank name" /></Field>
        <Field label={t("funding.fields.accountHolder")}><input value={holder} onChange={(e) => setHolder(e.target.value)} className={`${inputCls} w-full`} placeholder="Full legal name" /></Field>
        <Field label={t("funding.fields.accountIban")}><input value={acct} onChange={(e) => setAcct(e.target.value)} className={`${inputCls} w-full`} /></Field>
        <Field label={t("funding.fields.swift")}><input value={swift} onChange={(e) => setSwift(e.target.value)} className={`${inputCls} w-full`} /></Field>
      </div>
      <Field label={t("funding.fields.notes")}><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${inputCls} w-full py-2`} /></Field>
      <button onClick={submit} disabled={busy} className="btn-primary w-full disabled:opacity-50">{busy ? t("common.submitting") : t("funding.bank.requestWithdraw")}</button>
    </div>
  );
}

// ============== CRYPTO DEPOSIT ==============
function CryptoDepositForm({ onDone, addrs }: { onDone: () => void; addrs: any[] }) {
  const { t } = useTranslation();
  const [pick, setPick] = useState(0);
  const [amount, setAmount] = useState("");
  const [tx, setTx] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const c = CRYPTOS[pick];
  const address = addrs.find((a) => a.asset === c.asset && a.network === c.network);

  async function submit() {
    if (!amount || !tx) return toast.error(t("funding.crypto.amountTxRequired"));
    setBusy(true);
    try {
      await createCryptoDeposit({ amount: Number(amount), asset: c.asset, network: c.network, tx_hash: tx, notes });
      toast.success(t("funding.crypto.depositSubmitted"));
      setAmount(""); setTx(""); setNotes(""); onDone();
    } catch (e: any) { toast.error(e.message); }
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {CRYPTOS.map((x, i) => (
          <button key={x.asset} onClick={() => setPick(i)} className={`rounded-lg border p-2 text-xs ${pick === i ? "border-accent-blue bg-accent-blue/5 text-accent-blue" : "border-border bg-surface/40"}`}>
            {x.asset}
          </button>
        ))}
      </div>

      {address ? (
        <div className="rounded-lg border border-border bg-surface/40 p-3 text-xs space-y-2">
          <div className="font-semibold text-foreground">{t("funding.crypto.addressLabel", { label: c.label, network: c.network })}</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-[11px] text-accent-blue break-all bg-background/60 rounded px-2 py-1.5">{address.address}</code>
            <button onClick={() => { navigator.clipboard.writeText(address.address); toast.success(t("common.copied")); }} className="h-7 w-7 grid place-items-center rounded border border-border">
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          {address.memo && <div className="text-muted-foreground">{t("funding.crypto.memoLabel")} <code className="text-foreground">{address.memo}</code></div>}
          <div className="text-[11px] text-amber-400/80">{t("funding.crypto.sendOnly", { asset: c.asset, network: c.network })}</div>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground">
          {t("funding.crypto.noAddress", { asset: c.asset })}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label={t("funding.fields.amountAsset", { asset: c.asset })}><input type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} w-full`} /></Field>
        <Field label={t("funding.fields.txHash")}><input value={tx} onChange={(e) => setTx(e.target.value)} className={`${inputCls} w-full font-mono text-xs`} placeholder="0x…" /></Field>
      </div>
      <Field label={t("funding.fields.notes")}><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${inputCls} w-full py-2`} /></Field>
      <button onClick={submit} disabled={busy || !address} className="btn-primary w-full disabled:opacity-50">
        {busy ? t("common.submitting") : t("funding.crypto.notifyDeposit")}
      </button>
    </div>
  );
}

// ============== CRYPTO WITHDRAW ==============
function CryptoWithdrawForm({ onDone, wallets }: { onDone: () => void; wallets: any[] }) {
  const { t } = useTranslation();
  const [pick, setPick] = useState(0);
  const [amount, setAmount] = useState("");
  const [addr, setAddr] = useState("");
  const [memo, setMemo] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const c = CRYPTOS[pick];
  const w = wallets.find((x) => x.currency === c.asset);
  const bal = Number(w?.balance ?? 0);

  async function submit() {
    if (!amount || !addr) return toast.error(t("funding.crypto.amountAddrRequired"));
    if (Number(amount) > bal) return toast.error(t("funding.crypto.exceedsBalance", { bal, asset: c.asset }));
    setBusy(true);
    try {
      await createCryptoWithdrawal({ amount: Number(amount), asset: c.asset, network: c.network, destination_address: addr, memo, notes });
      toast.success(t("funding.crypto.withdrawQueued"));
      setAmount(""); setAddr(""); setMemo(""); setNotes(""); onDone();
    } catch (e: any) { toast.error(e.message); }
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {CRYPTOS.map((x, i) => (
          <button key={x.asset} onClick={() => setPick(i)} className={`rounded-lg border p-2 text-xs ${pick === i ? "border-accent-blue bg-accent-blue/5 text-accent-blue" : "border-border bg-surface/40"}`}>
            {x.asset}
          </button>
        ))}
      </div>
      <div className="text-xs text-muted-foreground">
        <Trans
          i18nKey="funding.crypto.availableOn"
          values={{ bal, asset: c.asset, network: c.network }}
          components={{ 1: <span className="font-mono text-foreground" /> }}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label={t("funding.fields.amountAsset", { asset: c.asset })}><input type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} w-full`} /></Field>
        <Field label={t("funding.fields.memo")}><input value={memo} onChange={(e) => setMemo(e.target.value)} className={`${inputCls} w-full`} /></Field>
      </div>
      <Field label={t("funding.fields.destinationAddress")}><input value={addr} onChange={(e) => setAddr(e.target.value)} className={`${inputCls} w-full font-mono text-xs`} placeholder={`${c.network} address`} /></Field>
      <Field label={t("funding.fields.notes")}><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${inputCls} w-full py-2`} /></Field>
      <button onClick={submit} disabled={busy} className="btn-primary w-full disabled:opacity-50">{busy ? t("common.submitting") : t("funding.bank.requestWithdraw")}</button>
    </div>
  );
}
