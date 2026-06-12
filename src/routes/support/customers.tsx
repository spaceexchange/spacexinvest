import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { PageHeader, Panel, Pill, DataTable, Td, inputCls } from "@/components/staff/ui";
import { staffGetAllUsers } from "@/lib/data/portal";

export const Route = createFileRoute("/support/customers")({ component: CustomersPage });

function CustomersPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { (async () => setRows(await staffGetAllUsers(500)))(); }, []);
  const list = rows.filter(u => !q ||
    (u.display_name ?? "").toLowerCase().includes(q.toLowerCase()) ||
    (u.email ?? "").toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHeader eyebrow="SUPPORT DESK" title="Customer Lookup" subtitle="Find any customer by name or email." />
      <Panel>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customers…" className={`${inputCls} w-full pl-9`} />
          </div>
        </div>
        <DataTable columns={["Name", "Email", "Country", "KYC", "Joined"]}>
          {list.map((u) => (
            <tr key={u.id}>
              <Td className="font-medium">{u.display_name ?? "—"}</Td>
              <Td><span className="text-xs">{u.email}</span></Td>
              <Td>{u.country ?? "—"}</Td>
              <Td><Pill tone={u.kyc_status === "verified" ? "success" : "warning"}>{u.kyc_status ?? "unverified"}</Pill></Td>
              <Td><span className="text-xs text-muted-foreground font-mono">{new Date(u.created_at).toLocaleDateString()}</span></Td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
