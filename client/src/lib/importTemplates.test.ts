import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { getImportTemplate, importTemplates } from "./importTemplates";

describe("import template catalogue", () => {
  it("covers every supported bulk-entry domain with columns and instructions", () => {
    expect(importTemplates.length).toBeGreaterThanOrEqual(13);
    for (const template of importTemplates) {
      expect(template.id).toBeTruthy();
      expect(template.title).toBeTruthy();
      expect(template.columns.length).toBeGreaterThan(2);
      expect(template.notes.length).toBeGreaterThan(0);
      expect(Object.keys(template.example)).toEqual(expect.arrayContaining(template.columns));
    }
  });

  it("keeps accounting, products, and invoices aligned with import contracts", () => {
    expect(getImportTemplate("accounts").columns).toContain("كود الحساب");
    expect(getImportTemplate("products").columns).toContain("SKU");
    expect(getImportTemplate("invoices").columns).toContain("رقم الفاتورة");
  });

  it("can serialize a template data sheet and an instructions sheet", () => {
    const template = getImportTemplate("journals");
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([template.example], { header: template.columns }), "البيانات");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["إرشادات القالب"], ...template.notes.map(note => [note])]), "الإرشادات");
    const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const parsed = XLSX.read(bytes, { type: "array" });
    expect(parsed.SheetNames).toEqual(["البيانات", "الإرشادات"]);
    expect(XLSX.utils.sheet_to_json(parsed.Sheets["البيانات"], { header: 1 })[0]).toEqual(template.columns);
  });
});
