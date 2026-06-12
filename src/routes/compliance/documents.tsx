import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { PageHeader, Panel, Pill, DataTable, Td, btnGhost } from "@/components/staff/ui";
import { staffGetAllDocuments, getSignedDocumentUrl } from "@/lib/data/portal";

export const Route = createFileRoute("/compliance/documents")({ component: DocsPage });

function DocsPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { (async () => setRows(await staffGetAllDocuments(300)))(); }, []);
  async function open(d: any) {
    const url = await getSignedDocumentUrl(d.bucket, d.file_url);
    if (url) window.open(url, "_blank");
  }
  return (
    <div>
      <PageHeader eyebrow="COMPLIANCE DESK" title="Document Vault" subtitle="All uploaded customer documents." />
      <Panel>
        <DataTable columns={["Document", "Type", "Owner", "Uploaded", ""]}>
          {rows.map((d) => (
            <tr key={d.id}>
              <Td className="font-medium truncate">{d.document_name}</Td>
              <Td><Pill>{d.document_type}</Pill></Td>
              <Td><span className="text-xs">{d.profile?.email ?? "—"}</span></Td>
              <Td><span className="text-xs text-muted-foreground font-mono">{new Date(d.uploaded_at).toLocaleString()}</span></Td>
              <Td><div className="flex justify-end"><button onClick={() => open(d)} className={btnGhost}><Download className="h-3.5 w-3.5" />Open</button></div></Td>
            </tr>
          ))}
        </DataTable>
        {rows.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No documents.</div>}
      </Panel>
    </div>
  );
}
