import { afterEach, describe, expect, it, vi } from "vitest";

const writeFile = vi.hoisted(() => vi.fn());
vi.mock("xlsx", () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    aoa_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile,
}));

import { exportToExcel, exportToPdf } from "./reportExport";

describe("report export utilities", () => {
  afterEach(() => {
    vi.clearAllMocks();
    delete (globalThis as { window?: unknown }).window;
  });

  it("generates an Excel workbook with Arabic report rows", () => {
    exportToExcel("تقرير مالي", [{ البيان: "الإيرادات", المبلغ: 1250 }]);
    expect(writeFile).toHaveBeenCalledOnce();
    expect(writeFile.mock.calls[0]?.[1]).toBe("تقرير-مالي.xlsx");
  });

  it("creates a valid blank Excel worksheet when the report has no rows", async () => {
    const { utils } = await import("xlsx");
    exportToExcel("تقرير فارغ", []);
    expect(utils.aoa_to_sheet).toHaveBeenCalledWith([]);
    expect(writeFile).toHaveBeenCalledOnce();
  });

  it("renders an Arabic no-data message in an empty PDF report", () => {
    const document = { write: vi.fn(), close: vi.fn() };
    (globalThis as { window?: unknown }).window = { open: vi.fn(() => ({ document })) };
    expect(exportToPdf("تقرير فارغ", [])).toBe(true);
    expect(document.write).toHaveBeenCalledWith(expect.stringContaining("لا توجد بيانات لهذا التقرير"));
  });

  it("returns false when the browser blocks the PDF popup", () => {
    (globalThis as { window?: unknown }).window = { open: vi.fn(() => null) };
    expect(exportToPdf("كشف حساب", [{ الحساب: "الصندوق", الرصيد: 100 }])).toBe(false);
  });
});
