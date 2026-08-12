import { afterEach, describe, expect, it, vi } from "vitest";

const writeFile = vi.hoisted(() => vi.fn());
vi.mock("xlsx", () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({})),
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

  it("returns false when the browser blocks the PDF popup", () => {
    (globalThis as { window?: unknown }).window = { open: vi.fn(() => null) };
    expect(exportToPdf("كشف حساب", [{ الحساب: "الصندوق", الرصيد: 100 }])).toBe(false);
  });
});
