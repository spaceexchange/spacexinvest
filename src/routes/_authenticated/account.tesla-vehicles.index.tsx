import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Package, ChevronRight } from "lucide-react";
import { PageHeader, Panel, Pill } from "@/components/dashboard/ui";
import { listVehicles, getMyOrders, VEHICLE_IMAGES, type Vehicle } from "@/lib/vehicles";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/account/tesla-vehicles/")({
  head: () => ({ meta: [{ title: "Tesla Vehicles — SpaceX IPO Exchange" }] }),
  component: CatalogPage,
});

function CatalogPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    listVehicles().then(setVehicles);
    getMyOrders().then(setOrders);
  }, []);

  const openOrder = async (orderId: string) => {
    const { data } = await supabase.from("invoices" as any)
      .select("id").eq("source_id", orderId).eq("source_type", "tesla_vehicle_order").maybeSingle();
    const invId = (data as any)?.id;
    if (invId) navigate({ to: "/account/invoices/$id", params: { id: invId } });
    else navigate({ to: "/account/invoices" });
  };

  return (
    <div>
      <PageHeader title="Tesla Marketplace" subtitle="Reserve or purchase Tesla vehicles directly from your investor wallet." />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {vehicles.map((v) => (
          <Link key={v.id} to="/account/tesla-vehicles/$slug" params={{ slug: v.slug }} className="group glass-card rounded-xl overflow-hidden hover:border-accent-blue/50 transition">
            <div className="aspect-video bg-surface/50 overflow-hidden">
              <img src={VEHICLE_IMAGES[v.slug] ?? ""} alt={v.model} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" width={1280} height={768} />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-semibold text-lg">{v.model}</h3>
                <span className="text-sm font-mono">${Number(v.base_price).toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{v.tagline}</p>
              <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground font-mono">
                <span>{v.range_miles}mi</span>
                <span>·</span>
                <span>{v.acceleration_sec}s 0–60</span>
                <span>·</span>
                <span>{v.top_speed_mph}mph</span>
              </div>
              <div className="mt-3 flex justify-between items-center">
                <Pill tone={v.inventory > 0 ? "success" : "warning"}>{v.inventory > 0 ? `${v.inventory} in stock` : "Backorder"}</Pill>
                <span className="text-xs text-accent-blue inline-flex items-center gap-1 group-hover:translate-x-0.5 transition">Configure <ArrowRight className="h-3 w-3" /></span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Panel title="Your Orders & Reservations" action={<Package className="h-4 w-4 text-muted-foreground" />}>
        {orders.length === 0 ? <p className="text-sm text-muted-foreground">No orders yet. Configure a vehicle above to get started.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead><tr className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase border-b border-border"><th className="text-left py-2">Date</th><th className="text-left">Vehicle</th><th className="text-left">Type</th><th className="text-right">Total</th><th className="text-right">Paid</th><th className="text-left pl-3">Status</th><th></th></tr></thead>
              <tbody className="divide-y divide-border/60">
                {orders.map((o) => (
                  <tr key={o.id} onClick={() => openOrder(o.id)} className="cursor-pointer hover:bg-secondary/30">
                    <td className="py-2 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="font-medium">{o.tesla_vehicles?.model ?? "—"}</td>
                    <td><Pill tone={o.order_type === "purchase" ? "info" : "warning"}>{o.order_type}</Pill></td>
                    <td className="text-right font-mono">${Number(o.total_price).toLocaleString()}</td>
                    <td className="text-right font-mono">${Number(o.amount_paid).toLocaleString()}</td>
                    <td className="pl-3"><Pill tone={o.status === "delivered" ? "success" : o.status === "cancelled" ? "danger" : "info"}>{String(o.status).replace(/_/g, " ")}</Pill></td>
                    <td className="text-right text-muted-foreground"><ChevronRight className="h-3.5 w-3.5 inline" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[11px] text-muted-foreground mt-2">Click any row to view the invoice / receipt and order tracking.</p>
          </div>
        )}
      </Panel>
    </div>
  );
}
