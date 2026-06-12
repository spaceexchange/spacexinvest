// Client-side CSV / XLSX / PDF builders for finance reports.
import * as XLSX from "xlsx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type Column = { key: string; label: string; width?: number };

const trigger = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export function exportCsv(filename: string, columns: Column[], rows: any[]) {
  const esc = (v: any) => {
    if (v == null) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const head = columns.map((c) => esc(c.label)).join(",");
  const body = rows.map((r) => columns.map((c) => esc(r[c.key])).join(",")).join("\n");
  trigger(new Blob([head + "\n" + body], { type: "text/csv;charset=utf-8" }), filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

export function exportXlsx(filename: string, columns: Column[], rows: any[], sheetName = "Report") {
  const data = rows.map((r) => Object.fromEntries(columns.map((c) => [c.label, r[c.key] ?? ""])));
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = columns.map((c) => ({ wch: c.width ?? Math.max(12, c.label.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  trigger(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

export async function exportPdf(filename: string, title: string, columns: Column[], rows: any[]) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([842, 595]); // A4 landscape
  const margin = 32;
  const headerH = 60;
  const rowH = 16;
  const usableW = page.getWidth() - margin * 2;
  const colW = columns.map((c) => (c.width ?? 1));
  const total = colW.reduce((s, w) => s + w, 0);
  const widths = colW.map((w) => (w / total) * usableW);
  const drawHeader = (p: any) => {
    p.drawText(title, { x: margin, y: page.getHeight() - margin, size: 14, font: bold, color: rgb(0.05, 0.07, 0.1) });
    p.drawText(`Generated ${new Date().toLocaleString()}`, { x: margin, y: page.getHeight() - margin - 16, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
    let x = margin;
    const y = page.getHeight() - headerH;
    columns.forEach((c, i) => {
      p.drawText(c.label, { x: x + 2, y, size: 8, font: bold, color: rgb(0.1, 0.2, 0.4) });
      x += widths[i];
    });
    p.drawLine({ start: { x: margin, y: y - 4 }, end: { x: margin + usableW, y: y - 4 }, thickness: 0.5, color: rgb(0.7, 0.75, 0.85) });
  };
  drawHeader(page);
  let y = page.getHeight() - headerH - rowH - 4;
  for (const r of rows) {
    if (y < margin + rowH) {
      page = doc.addPage([842, 595]);
      drawHeader(page);
      y = page.getHeight() - headerH - rowH - 4;
    }
    let x = margin;
    columns.forEach((c, i) => {
      const text = String(r[c.key] ?? "").slice(0, Math.floor(widths[i] / 4));
      page.drawText(text, { x: x + 2, y, size: 8, font, color: rgb(0.1, 0.1, 0.15) });
      x += widths[i];
    });
    y -= rowH;
  }
  const bytes = await doc.save();
  // Convert Uint8Array to ArrayBuffer for Blob (avoids SharedArrayBuffer type issue)
  const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  trigger(new Blob([ab], { type: "application/pdf" }), filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
