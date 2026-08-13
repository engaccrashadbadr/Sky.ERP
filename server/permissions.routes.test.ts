import { beforeEach, describe, expect, it, vi } from "vitest";

const { canUserAccessPermission, getFinancialReports, createInvoice } = vi.hoisted(() => ({
  canUserAccessPermission: vi.fn(),
  getFinancialReports: vi.fn(),
  createInvoice: vi.fn(),
}));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, canUserAccessPermission, getFinancialReports, createInvoice };
});

import { appRouter } from "./routers";

const user = { id: 44, role: "user", department: "المبيعات", permissionTemplate: "قراءة فقط", name: "مستخدم اختبار" } as any;
const context = { req: {} as any, res: {} as any, user };

describe("granular permissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canUserAccessPermission.mockResolvedValue(true);
    getFinancialReports.mockResolvedValue({ incomeStatement: [], balanceSheet: [], cashFlow: [] });
    createInvoice.mockResolvedValue({ id: 7 });
  });

  it("allows a report when the report permission is granted", async () => {
    const result = await appRouter.createCaller(context).reports.financial({});
    expect(result).toEqual(expect.objectContaining({ incomeStatement: [] }));
    expect(canUserAccessPermission).toHaveBeenCalledWith(user, "reports.financial");
  });

  it("rejects a report when the report permission is denied", async () => {
    canUserAccessPermission.mockResolvedValue(false);
    await expect(appRouter.createCaller(context).reports.financial({})).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(getFinancialReports).not.toHaveBeenCalled();
  });

  it("checks the action permission before invoice creation", async () => {
    canUserAccessPermission.mockResolvedValue(false);
    await expect(appRouter.createCaller(context).invoices.create({
      invoiceNumber: "INV-TEST-1",
      type: "sale",
      partyId: 1,
      invoiceDate: new Date("2026-08-13"),
      currencyCode: "EGP",
      exchangeRate: 1,
      discount: 0,
      tax: 0,
      paid: 0,
      lines: [{ productId: 1, description: "اختبار", quantity: 1, unitPrice: 10, taxRate: 0 }],
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(createInvoice).not.toHaveBeenCalled();
    expect(canUserAccessPermission).toHaveBeenCalledWith(user, "invoices.create");
  });
});
