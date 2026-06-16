import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Zap, Gauge, Battery, Calendar } from "lucide-react";
import { PageHeader, Panel, Pill, inputCls } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getVehicle, createOrder, VEHICLE_IMAGES, type Vehicle, type Configuration } from "@/lib/vehicles";

export const Route = createFileRoute("/_authenticated/account/tesla-vehicles/$slug")({
  head: () => ({ meta: [{ title: "Configure Vehicle — SpaceX IPO Exchange" }] }),
  component: VehicleDetail,
});

function VehicleDetail() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const [v, setV] = useState<Vehicle | null>(null);
  const [cfg, setCfg] = useState<Configuration | null>(null);
  const [checkout, setCheckout] = useState<null | "reservation" | "purchase">(null);
  const [address, setAddress] = useState("");
  const [payMethod, setPayMethod] = useState<"bank" | "crypto" | "wallet">("bank");
  const [busy, setBusy] = useState(false);


  useEffect(() => {
    getVehicle(slug).then((res) => {
      setV(res);
      if (res) setCfg({
        color: res.colors[0]?.name ?? "",
        wheels: res.wheels[0]?.name ?? "",
        interior: res.interiors[0]?.name ?? "",
        battery: res.battery_options[0]?.name ?? "",
        performance: res.performance_options[0]?.name ?? "",
      });
    });
  }, [slug]);

  const pricing = useMemo(() => {
    if (!v || !cfg) return { base: 0, options: 0, total: 0, deposit: 0 };
    const pick = (arr: any[], name: string) => arr.find((x) => x.name === name)?.price ?? 0;
    const options = pick(v.colors, cfg.color) + pick(v.wheels, cfg.wheels) + pick(v.interiors, cfg.interior) + pick(v.battery_options, cfg.battery) + pick(v.performance_options, cfg.performance);
    const total = Number(v.base_price) + options;
    return { base: Number(v.base_price), options, total, deposit: Math.round(total * 0.05) };
  }, [v, cfg]);

  if (!v || !cfg) return <p className="text-sm text-muted-foreground p-6">Loading vehicle…</p>;

  const submitOrder = async () => {
    if (!checkout) return;
    setBusy(true);
    try {
      const order = await createOrder({
        vehicle_id: v.id, order_type: checkout, configuration: cfg as any,
        base_price: pricing.base, options_total: pricing.options, total_price: pricing.total,
        deposit_amount: checkout === "reservation" ? pricing.deposit : pricing.total,
        payment_method: payMethod,
        delivery_address: address || undefined,
      });
      if (payMethod === "wallet") {
        toast.success(checkout === "reservation" ? "Reservation placed!" : "Purchase confirmed!");
        setCheckout(null);
        navigate({ to: "/account/tesla-vehicles" });
      } else {
        toast.success(`Order created. Complete payment in the Funding Center.`);
        setCheckout(null);
        // Look up the auto-generated invoice for this order
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: inv } = await supabase.from("invoices" as any)
          .select("id").eq("source_id", (order as any).id).eq("source_type", "tesla_vehicle_order").maybeSingle();
        navigate({ to: "/account/funding", search: { invoice: (inv as any)?.id } as any });
      }
    } catch (e: any) { toast.error(e.message ?? "Checkout failed"); }
    finally { setBusy(false); }
  };


  const heroImg = VEHICLE_IMAGES[v.slug] ?? "";

  return (
    <div>
      <Link to="/account/tesla-vehicles" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-3 w-3 mr-1" />Back to catalog</Link>

      <PageHeader title={v.model} subtitle={v.tagline} />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="space-y-3">
          <div className="aspect-video rounded-xl overflow-hidden bg-surface/40">
            <img src={heroImg} alt={v.model} className="w-full h-full object-cover" width={1280} height={768} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[heroImg, heroImg, heroImg].map((src, i) => (
              <div key={i} className="aspect-video rounded-lg overflow-hidden border border-border bg-surface/40">
                <img src={src} alt={`${v.model} ${i}`} className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Panel title="Specifications">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Spec icon={<Battery className="h-4 w-4" />} label="Range" value={`${v.range_miles} mi`} />
              <Spec icon={<Zap className="h-4 w-4" />} label="0-60 mph" value={`${v.acceleration_sec}s`} />
              <Spec icon={<Gauge className="h-4 w-4" />} label="Top Speed" value={`${v.top_speed_mph} mph`} />
              <Spec icon={<Battery className="h-4 w-4" />} label="Battery" value={`${v.battery_kwh} kWh`} />
              <Spec icon={<Calendar className="h-4 w-4" />} label="Delivery" value={v.delivery_estimate} />
              <Spec label="Inventory" value={v.inventory > 0 ? `${v.inventory} available` : "Backorder"} />
            </div>
          </Panel>

          <Panel title="Features">
            <ul className="grid grid-cols-1 gap-1.5 text-sm">
              {(v.features ?? []).map((f) => (
                <li key={f} className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />{f}</li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <Panel title="Configure" className="mb-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <OptionGroup label="Color" options={v.colors} value={cfg.color} onChange={(name) => setCfg({ ...cfg, color: name })} swatches />
          <OptionGroup label="Wheels" options={v.wheels} value={cfg.wheels} onChange={(name) => setCfg({ ...cfg, wheels: name })} />
          <OptionGroup label="Interior" options={v.interiors} value={cfg.interior} onChange={(name) => setCfg({ ...cfg, interior: name })} />
          <OptionGroup label="Battery / Drivetrain" options={v.battery_options} value={cfg.battery} onChange={(name) => setCfg({ ...cfg, battery: name })} />
          <OptionGroup label="Autopilot" options={v.performance_options} value={cfg.performance} onChange={(name) => setCfg({ ...cfg, performance: name })} />
        </div>
      </Panel>

      <Panel title="Order Summary">
        <div className="space-y-2 text-sm max-w-md mb-4">
          <Row label="Base Price" value={`$${pricing.base.toLocaleString()}`} />
          <Row label="Options" value={`$${pricing.options.toLocaleString()}`} />
          <div className="h-px bg-border my-2" />
          <Row label="Total" value={`$${pricing.total.toLocaleString()}`} bold />
          <Row label="Reservation Deposit (5%)" value={`$${pricing.deposit.toLocaleString()}`} muted />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setCheckout("reservation")}>Reserve for ${pricing.deposit.toLocaleString()}</Button>
          <Button variant="outline" onClick={() => setCheckout("purchase")}>Buy Now for ${pricing.total.toLocaleString()}</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Payment is debited from your USD wallet. Ensure sufficient balance before confirming.</p>
      </Panel>

      <Dialog open={checkout !== null} onOpenChange={(o) => !o && setCheckout(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{checkout === "purchase" ? "Confirm Purchase" : "Confirm Reservation"}</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="text-muted-foreground">{v.model}</div>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>Color: <span className="text-foreground">{cfg.color}</span></li>
              <li>Wheels: <span className="text-foreground">{cfg.wheels}</span></li>
              <li>Interior: <span className="text-foreground">{cfg.interior}</span></li>
              <li>Battery: <span className="text-foreground">{cfg.battery}</span></li>
              <li>Autopilot: <span className="text-foreground">{cfg.performance}</span></li>
            </ul>
            <div>
              <label className="text-xs text-muted-foreground">Delivery Address (optional)</label>
              <input className={inputCls} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City, State" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {(["bank", "crypto", "wallet"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setPayMethod(m)}
                    className={`px-2 py-2 rounded-md border text-xs capitalize transition ${payMethod === m ? "border-accent-blue bg-accent-blue/10 text-accent-blue" : "border-border hover:border-accent-blue/40"}`}>
                    {m === "wallet" ? "Wallet" : m === "crypto" ? "Crypto" : "Bank Transfer"}
                  </button>
                ))}
              </div>
              {payMethod !== "wallet" && (
                <p className="text-[11px] text-muted-foreground mt-1.5">You'll be redirected to the Funding Center to complete payment.</p>
              )}
            </div>
            <Row label="Amount to charge" value={`$${(checkout === "purchase" ? pricing.total : pricing.deposit).toLocaleString()}`} bold />

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckout(null)} disabled={busy}>Cancel</Button>
            <Button onClick={submitOrder} disabled={busy}>{busy ? "Processing…" : "Confirm"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Spec({ icon, label, value }: { icon?: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon && <span className="text-accent-blue">{icon}</span>}
      <div><div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div><div className="font-medium">{value}</div></div>
    </div>
  );
}

function Row({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? "text-muted-foreground" : ""}`}>
      <span>{label}</span>
      <span className={`font-mono ${bold ? "font-semibold text-base" : ""}`}>{value}</span>
    </div>
  );
}

function OptionGroup({ label, options, value, onChange, swatches }: { label: string; options: any[]; value: string; onChange: (name: string) => void; swatches?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">{label}</div>
      <div className="space-y-1.5">
        {options.map((o) => (
          <button key={o.name} onClick={() => onChange(o.name)}
            className={`w-full text-left p-2.5 rounded-lg border text-sm flex items-center justify-between transition ${value === o.name ? "border-accent-blue bg-accent-blue/10" : "border-border hover:border-accent-blue/40"}`}>
            <span className="flex items-center gap-2">
              {swatches && o.hex && <span className="h-4 w-4 rounded-full border border-border" style={{ background: o.hex }} />}
              {o.name}
            </span>
            <span className="text-xs text-muted-foreground font-mono">{o.price > 0 ? `+$${o.price.toLocaleString()}` : "Included"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
