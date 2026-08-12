import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import {
  calculateInvoiceTotals,
  calculatePayrollTotal,
  calculateStockDelta,
  canManageSensitiveSettings,
} from "./db";

describe("ERP workflow calculators", () => {
  it("calculates invoice subtotal, tax, discount, and total", () => {
    const result = calculateInvoiceTotals(
      [
        { quantity: 2, unitPrice: 100, taxRate: 15 },
        { quantity: 1, unitPrice: 50, taxRate: 0 },
      ],
      10,
    );

    expect(result.subtotal).toBe(250);
    expect(result.tax).toBe(30);
    expect(result.total).toBe(270);
  });

  it("uses positive inbound and negative outbound stock deltas", () => {
    expect(calculateStockDelta("in", 5)).toBe(5);
    expect(calculateStockDelta("out", 5)).toBe(-5);
    expect(calculateStockDelta("out", -2)).toBe(-2);
  });

  it("aggregates numeric and string salaries for payroll", () => {
    expect(calculatePayrollTotal(["12000.50", 3500, "500"])).toBe(16000.5);
  });

  it("allows only administrators to manage sensitive settings", () => {
    expect(canManageSensitiveSettings("admin")).toBe(true);
    expect(canManageSensitiveSettings("accountant")).toBe(false);
    expect(canManageSensitiveSettings("user")).toBe(false);
  });

  it("enforces payroll permissions through the real tRPC route", async () => {
    const context = (role: "user" | "accountant") => ({ req: {} as any, res: {} as any, user: { id: 1, role } as any });
    await expect(appRouter.createCaller(context("user")).employees.payroll({ period: "2026-08" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context("accountant")).employees.payroll({ period: "2026-08" })).resolves.toBeDefined();
  });

  it("blocks unauthenticated invoice, stock, attachment, and AI mutations", async () => {
    const guest = { req: {} as any, res: {} as any, user: null };
    const caller = appRouter.createCaller(guest);
    const blocked = { code: "UNAUTHORIZED" };
    await expect(caller.invoices.create({} as any)).rejects.toMatchObject(blocked);
    await expect(caller.stock.move({} as any)).rejects.toMatchObject(blocked);
    await expect(caller.attachments.upload({} as any)).rejects.toMatchObject(blocked);
    await expect(caller.assistant.ask({} as any)).rejects.toMatchObject(blocked);
  });
});
