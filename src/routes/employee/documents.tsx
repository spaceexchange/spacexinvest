import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Search, Upload, FolderArchive, Download } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader, Panel, Pill, DataTable, Td, inputCls, btnPrimary, btnGhost } from "@/components/staff/ui";
import { staffGetAllDocuments, staffGetAllUsers, getSignedDocumentUrl } from "@/lib/data/portal";
import { uploadInvestorDocument } from "@/lib/data/admin.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/employee/documents")({ component: DocsPage });

const TYPES = ["statement", "contract", "tax", "verification", "other"] as const;

function DocsPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [target, setTarget] = useState("");
  const [type, setType] = useState<typeof TYPES[number]>("statement");
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadFn = useServerFn(uploadInvestorDocument);

  async function load() { setRows(await staffGetAllDocuments(300)); }
  useEffect(() => { load(); (async () => setUsers(await staffGetAllUsers(500)))(); }, []);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !target) { toast.error("Pick a user first"); return; }
    const bucket = type === "contract" ? "contracts" : type === "tax" ? "tax-documents" : type === "statement" ? "statements" : "investor-documents";
    const path = `${target}/${Date.now()}-${file.name}`;
    const up = await supabase.storage.from(bucket).upload(path, file);
    if (up.error) { toast.error(up.error.message); return; }
    try {
      await uploadFn({ data: { user_id: target, document_name: file.name, document_type: type, file_url: path, bucket, size_bytes: file.size } });
      toast.success("Document uploaded");
      load();
    } catch (err: any) { toast.error(err.message); }
    e.target.value = "";
  }

  async function download(d: any) {
    const url = await getSignedDocumentUrl(d.bucket, d.file_url);
    if (url) window.open(url, "_blank");
  }

  const list = rows.filter(d => !q || d.document_name?.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHeader eyebrow="STAFF WORKSPACE" title="Document Center" subtitle="Upload statements, contracts, and tax forms for any investor."
        action={
          <div className="flex items-center gap-2">
            <select value={target} onChange={(e) => setTarget(e.target.value)} className={inputCls}>
              <option value="">Select investor…</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.display_name ?? u.email}</option>)}
            </select>
            <select value={type} onChange={(e) => setType(e.target.value as any)} className={inputCls}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <input ref={fileRef} type="file" onChange={onUpload} className="hidden" />
            <button onClick={() => fileRef.current?.click()} className={btnPrimary}><Upload className="h-4 w-4" />Upload</button>
          </div>
        }
      />
      <Panel>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search documents…" className={`${inputCls} w-full pl-9`} />
          </div>
        </div>
        <DataTable columns={["Document", "Type", "Owner", "Uploaded", ""]}>
          {list.map((d) => (
            <tr key={d.id}>
              <Td>
                <div className="flex items-center gap-2"><FolderArchive className="h-4 w-4 text-accent-blue shrink-0" /><span className="font-medium truncate">{d.document_name}</span></div>
              </Td>
              <Td><Pill>{d.document_type}</Pill></Td>
              <Td><span className="text-xs">{d.profile?.email ?? "—"}</span></Td>
              <Td><span className="text-xs text-muted-foreground font-mono">{new Date(d.uploaded_at).toLocaleString()}</span></Td>
              <Td><div className="flex justify-end"><button onClick={() => download(d)} className={btnGhost}><Download className="h-3.5 w-3.5" />Open</button></div></Td>
            </tr>
          ))}
        </DataTable>
        {list.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No documents.</div>}
      </Panel>
    </div>
  );
}
