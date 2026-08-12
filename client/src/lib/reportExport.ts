import * as XLSX from "xlsx";

export type ExportRow = Record<string, string | number | null | undefined>;

function safeFileName(value: string) {
  return value.replace(/[^\u0600-\u06FF\w\-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "report";
}

export function exportToExcel(title: string, rows: ExportRow[]) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!dir"] = "rtl";
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "التقرير");
  XLSX.writeFile(workbook, `${safeFileName(title)}.xlsx`);
}

export function exportToPdf(title: string, rows: ExportRow[]) {
  const columns = rows.length ? Object.keys(rows[0]) : [];
  const tableRows = rows.map(row => `<tr>${columns.map(column => `<td>${escapeHtml(String(row[column] ?? ""))}</td>`).join("")}</tr>`).join("");
  const tableHead = columns.map(column => `<th>${escapeHtml(column)}</th>`).join("");
  const printable = window.open("", "_blank", "noopener,noreferrer,width=1100,height=800");
  if (!printable) return false;
  printable.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font-family:Arial,Tahoma,sans-serif;direction:rtl;padding:32px;color:#172033}h1{font-size:22px;margin:0 0 8px}p{color:#667085;margin:0 0 24px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #d8dee9;padding:9px;text-align:right}th{background:#eef3ff;font-weight:700}@media print{button{display:none}}</style></head><body><h1>${escapeHtml(title)}</h1><p>تاريخ التصدير: ${new Date().toLocaleString("ar-SA")}</p><table><thead><tr>${tableHead}</tr></thead><tbody>${tableRows}</tbody></table><script>window.onload=function(){window.print();}</script></body></html>`);
  printable.document.close();
  return true;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character] ?? character));
}
