import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Car } from "lucide-react";
import { PageHeader, Panel, Pill, StatCard, DataTable, Td, btnSecondary, inputCls } from "@/components/staff/ui";
import { adminListVehicles, adminUpdateVehicle, adminListOrders, adminUpdateOrder, type Vehicle } from "@/lib/vehicles";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/tesla-vehicles")({
  component: AdminVehicles,
});

const STATUS_OPTIONS = ["pending", "confirmed", "processing", "delivery_preparation", "delivery_scheduled", "delivered", "cancelled", "refunded"];

function AdminVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  const reload = async () => {
    const [v, o] = await Promise.all([adminListVehicles(), adminListOrders()]);
    setVehicles(v); setOrders(o);
  };
  useEffect(() => { reload(); }, []);

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((a, b) => a + Number(b.amount_paid), 0);
  const pendingDelivery = orders.filter((o) => !["delivered", "cancelled", "refunded"].includes(o.status)).length;

  const updateInv = async (id: string, inv: number) => {
    try { await adminUpdateVehicle(id, { inventory: inv }); reload(); toast.success("Inventory updated"); }
    catch (e: any) { toast.error(e.message); }
  };
  const updatePrice = async (id: string, price: number) => {
    try { await adminUpdateVehicle(id, { base_price: price }); reload(); toast.success("Price updated"); }
    catch (e: any) { toast.error(e.message); }
  };
  const setStatus = async (id: string, status: string) => {
    try { await adminUpdateOrder(id, { status }); reload(); toast.success("Status updated"); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <PageHeader eyebrow="MARKETPLACE" title="Tesla Vehicle Operations" subtitle="Manage inventory, pricing, reservations and deliveries." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <StatCard label="Vehicles" value={vehicles.length} icon={<Car className="h-4 w-4" />} />
        <StatCard label="Total Orders" value={totalOrders} />
        <StatCard label="Pending Delivery" value={pendingDelivery} />
        <StatCard label="Revenue" value={`$${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
      </div>

      <Panel title="Inventory & Pricing" className="mb-6" padded={false}>
        <DataTable columns={["Model", "Slug", "Base Price", "Inventory", "Active"]}>
          {vehicles.map((v) => (
            <tr key={v.id}>
              <Td className="font-medium">{v.model}</Td>
              <Td className="text-xs font-mono text-muted-foreground">{v.slug}</Td>
              <Td>
                <input type="number" defaultValue={v.base_price} className={inputCls + " w-28"}
                  onBlur={(e) => { const p = Number(e.target.value); if (p > 0 && p !== Number(v.base_price)) updatePrice(v.id, p); }} />
              </Td>
              <Td>
                <input type="number" defaultValue={v.inventory} className={inputCls + " w-20"}
                  onBlur={(e) => { const n = Number(e.target.value); if (n !== v.inventory) updateInv(v.id, n); }} />
              </Td>
              <Td><Pill tone={v.active ? "success" : "warning"}>{v.active ? "Active" : "Off"}</Pill></Td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      <Panel title={`Orders & Reservations (${orders.length})`} padded={false}>
        <DataTable columns={["Date", "User", "Vehicle", "Type", "Total", "Paid", "Status", "Action"]}>
          {orders.map((o) => (
            <tr key={o.id}>
              <Td className="text-muted-foreground text-xs">{new Date(o.created_at).toLocaleDateString()}</Td>
              <Td><span className="font-mono text-xs">{o.user_id.slice(0, 8)}…</span></Td>
              <Td>{o.tesla_vehicles?.model ?? "—"}</Td>
              <Td><Pill tone={o.order_type === "purchase" ? "info" : "warning"}>{o.order_type}</Pill></Td>
              <Td>${Number(o.total_price).toLocaleString()}</Td>
              <Td>${Number(o.amount_paid).toLocaleString()}</Td>
              <Td><Pill tone={o.status === "delivered" ? "success" : o.status === "cancelled" ? "danger" : "info"}>{o.status}</Pill></Td>
              <Td>
                <select defaultValue={o.status} className={inputCls + " text-xs py-1"} onChange={(e) => setStatus(o.id, e.target.value)}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Td>
            </tr>
          ))}
          {orders.length === 0 && <tr><Td className="text-muted-foreground">No orders yet.</Td></tr>}
        </DataTable>
      </Panel>
    </div>
  );
}
