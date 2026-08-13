import * as XLSX from "xlsx";

export type ExportRow = Record<string, string | number | null | undefined>;

function safeFileName(value: string) {
  return value.replace(/[^\u0600-\u06FF\w\-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "report";
}

export function exportToExcel(title: string, rows: ExportRow[]) {
  // SheetJS can emit an invalid/empty workbook in some browser environments when
  // json_to_sheet receives an empty array. Build a real blank worksheet instead.
  const worksheet = rows.length ? XLSX.utils.json_to_sheet(rows) : XLSX.utils.aoa_to_sheet([]);
  worksheet["!dir"] = "rtl";
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "التقرير");
  const fileName = `${safeFileName(title)}.xlsx`;
  try {
    XLSX.writeFile(workbook, fileName);
  } catch {
    // Fallback for restricted browser environments: serialize the workbook to an
    // ArrayBuffer and trigger a normal anchor download instead of failing silently.
    const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
    const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}

export function exportToPdf(title: string, rows: ExportRow[]) {
  const columns = rows.length ? Object.keys(rows[0]) : [];
  const tableRows = rows.map(row => `<tr>${columns.map(column => `<td>${escapeHtml(String(row[column] ?? ""))}</td>`).join("")}</tr>`).join("");
  const tableHead = columns.map(column => `<th>${escapeHtml(column)}</th>`).join("");
  const emptyState = rows.length ? "" : '<p class="empty-state">لا توجد بيانات لهذا التقرير ضمن الفترة أو الفلاتر المحددة.</p>';
  const printable = window.open("", "_blank", "noopener,noreferrer,width=1100,height=800");
  if (!printable) return false;
  printable.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font-family:Arial,Tahoma,sans-serif;direction:rtl;padding:32px;color:#172033}h1{font-size:22px;margin:0 0 8px}p{color:#667085;margin:0 0 24px}table{width:100%;border-collapse:collapse;font-size:12px}.empty-state{padding:28px 0;font-size:16px;font-weight:700;color:#475467}.report-table:has(tbody:empty){display:none}th,td{border:1px solid #d8dee9;padding:9px;text-align:right}th{background:#eef3ff;font-weight:700}@media print{button{display:none}}</style></head><body><h1>${escapeHtml(title)}</h1><p>تاريخ التصدير: ${new Date().toLocaleString("ar-SA")}</p>${emptyState}<table class="report-table"><thead><tr>${tableHead}</tr></thead><tbody>${tableRows}</tbody></table><script>window.onload=function(){window.print();}</script></body></html>`);
  printable.document.close();
  return true;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character] ?? character));
}
