import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Pill } from "@/components/dashboard/ui";
import { getMyDocuments, uploadDocument, getSignedDocumentUrl } from "@/lib/data/portal";
import { FileText, Upload, Download, FolderLock, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account/documents")({
  head: () => ({ meta: [{ title: "Document Vault — SpaceX IPO Exchange" }] }),
  component: DocumentsPage,
});

const cats = ["All", "statement", "contract", "tax", "verification", "other"];

function DocumentsPage() {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [docs, setDocs] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  async function refresh() { setDocs(await getMyDocuments()); }
  useEffect(() => { refresh(); }, []);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy(true);
    try { await uploadDocument(file, "other"); await refresh(); } finally { setBusy(false); }
    e.target.value = "";
  }
  async function download(doc: any) {
    const url = await getSignedDocumentUrl(doc.bucket, doc.file_url);
    if (url) window.open(url, "_blank");
  }

  const list = docs.filter((d) => (cat === "All" || d.document_type === cat) && (!q || d.document_name.toLowerCase().includes(q.toLowerCase())));

  return (
    <div>
      <PageHeader title="Document Vault" subtitle="Encrypted, audit-grade storage for every investor document."
        action={
          <label className={`btn-primary !min-h-[36px] !py-1.5 !px-4 !text-xs flex items-center gap-1.5 cursor-pointer ${busy ? "opacity-50" : ""}`}>
            <Upload className="h-3.5 w-3.5" /> {busy ? "Uploading…" : "Upload"}
            <input type="file" className="hidden" onChange={onUpload} disabled={busy} />
          </label>
        }
      />

      <Panel className="mb-4">
        <div className="grid sm:grid-cols-[1fr_auto] gap-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search documents…" className="w-full h-10 rounded-md border border-border bg-surface/60 pl-9 pr-3 text-sm" />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`h-10 px-3 rounded-md text-xs font-medium whitespace-nowrap capitalize transition-colors ${cat === c ? "bg-accent-blue text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{c}</button>
            ))}
          </div>
        </div>
      </Panel>

      <Panel>
        <ul className="divide-y divide-border">
          {list.map((d) => (
            <li key={d.id} className="py-3 grid grid-cols-[auto_minmax(0,1fr)_auto_auto] gap-3 items-center">
              <div className="h-9 w-9 rounded-md bg-secondary grid place-items-center text-accent-blue shrink-0"><FileText className="h-4 w-4" /></div>
              <div className="min-w-0">
                <div className="text-sm text-foreground truncate">{d.document_name}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{new Date(d.uploaded_at).toLocaleDateString()}</div>
              </div>
              <Pill>{d.document_type}</Pill>
              <button onClick={() => download(d)} className="h-8 w-8 grid place-items-center rounded-md border border-border text-muted-foreground hover:text-accent-blue hover:border-accent-blue/40"><Download className="h-3.5 w-3.5" /></button>
            </li>
          ))}
          {list.length === 0 && (
            <li className="py-12 text-center text-sm text-muted-foreground">
              <FolderLock className="h-8 w-8 mx-auto mb-3 opacity-50" />
              No documents yet. Upload your first document above.
            </li>
          )}
        </ul>
      </Panel>
    </div>
  );
}
