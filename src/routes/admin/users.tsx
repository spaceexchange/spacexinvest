import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader, Panel, Pill, DataTable, Td, inputCls, btnSecondary, btnGhost } from "@/components/staff/ui";
import { staffGetAllUsers, staffGetUserRoles } from "@/lib/data/portal";
import { setUserRole } from "@/lib/data/admin.functions";

export const Route = createFileRoute("/admin/users")({ component: UsersPage });

const ROLE_OPTS = ["verified", "vip", "employee", "support", "compliance", "finance", "admin"] as const;

function UsersPage() {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const grantFn = useServerFn(setUserRole);

  async function load() { setUsers(await staffGetAllUsers()); }
  useEffect(() => { load(); }, []);

  async function openUser(u: any) {
    setSelected(u);
    setSelectedRoles(await staffGetUserRoles(u.id));
  }

  async function toggleRole(role: string, has: boolean) {
    if (!selected) return;
    await grantFn({ data: { user_id: selected.id, role: role as any, action: has ? "revoke" : "grant" } });
    toast.success(`Role ${has ? "revoked" : "granted"}`);
    setSelectedRoles(await staffGetUserRoles(selected.id));
  }

  const list = users.filter(u => !q ||
    (u.display_name ?? "").toLowerCase().includes(q.toLowerCase()) ||
    (u.email ?? "").toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader eyebrow="USER MANAGEMENT" title="Users Directory" subtitle={`${users.length.toLocaleString()} accounts on the platform.`} />
      <Panel>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email…" className={`${inputCls} w-full pl-9`} />
          </div>
          <button onClick={load} className={btnSecondary}>Refresh</button>
        </div>
        <DataTable columns={["Name", "Email", "Country", "KYC", "Joined", ""]}>
          {list.map((u) => (
            <tr key={u.id}>
              <Td className="font-medium">{u.display_name ?? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() ?? "—"}</Td>
              <Td><span className="text-xs">{u.email}</span></Td>
              <Td>{u.country ?? "—"}</Td>
              <Td><Pill tone={u.kyc_status === "verified" ? "success" : u.kyc_status === "pending" ? "warning" : "default"}>{u.kyc_status ?? "unverified"}</Pill></Td>
              <Td><span className="text-xs text-muted-foreground font-mono">{new Date(u.created_at).toLocaleDateString()}</span></Td>
              <Td>
                <div className="flex justify-end gap-2 flex-wrap">
                  <Link
                    to="/admin/users/$id"
                    params={{ id: u.id }}
                    className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-accent-blue text-white text-xs font-medium hover:bg-accent-blue/90 transition-colors"
                  >
                    Open
                  </Link>
                  <Link
                    to="/admin/users/$id"
                    params={{ id: u.id }}
                    className={btnSecondary + " h-8 px-3 text-xs"}
                  >
                    View
                  </Link>
                  <button type="button" onClick={() => openUser(u)} className={btnSecondary + " h-8 px-3 text-xs"}>
                    Roles
                  </button>
                </div>
              </Td>
            </tr>
          ))}
        </DataTable>
        {list.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No users match.</div>}
      </Panel>

      {selected && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4" onClick={() => setSelected(null)}>
          <div className="glass-card rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-medium mb-1">{selected.display_name ?? selected.email}</div>
            <div className="text-xs text-muted-foreground mb-4">{selected.email}</div>
            <div className="text-[10px] font-mono tracking-[0.25em] text-muted-foreground mb-2">ROLES</div>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_OPTS.map((r) => {
                const has = selectedRoles.includes(r);
                return (
                  <button key={r} onClick={() => toggleRole(r, has)}
                    className={`text-xs px-3 py-2 rounded-md border ${has ? "border-accent-blue/40 bg-accent-blue/10 text-accent-blue" : "border-border bg-surface/40"}`}>
                    {r}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setSelected(null)} className="mt-5 w-full text-xs py-2 rounded-md border border-border">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
