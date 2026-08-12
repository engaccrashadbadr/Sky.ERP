import { describe, expect, it } from "vitest";
import { calculateCreditExposure, notifyCreditLimitIfBreached } from "./db";

describe("calculateCreditExposure", () => {
  it("includes opening balance and prior unpaid sales invoices", () => {
    expect(calculateCreditExposure(100, [{ total: 250, paid: 50 }, { total: 80, paid: 80 }])).toBe(300);
  });

  it("counts only the unpaid portion of partially paid invoices", () => {
    expect(calculateCreditExposure(0, [{ total: 1000, paid: 650 }])).toBe(350);
  });

  it("does not create exposure for fully paid invoices", () => {
    expect(calculateCreditExposure(200, [{ total: 500, paid: 500 }])).toBe(200);
  });
});

describe("notifyCreditLimitIfBreached", () => {
  it("notifies when total exposure breaches the configured limit", async () => {
    const notifications: Array<{ title: string; content: string }> = [];
    const breached = await notifyCreditLimitIfBreached({
      name: "عميل تجريبي",
      invoiceNumber: "INV-1",
      openingBalance: 100,
      creditLimit: 300,
      movements: [{ total: 250, paid: 0 }],
      notify: payload => notifications.push(payload),
    });
    expect(breached).toBe(true);
    expect(notifications).toHaveLength(1);
    expect(notifications[0]?.title).toContain("ائتمان");
  });

  it("does not notify when prior exposure remains within the limit", async () => {
    const notifications: Array<{ title: string; content: string }> = [];
    const breached = await notifyCreditLimitIfBreached({
      name: "عميل تجريبي",
      invoiceNumber: "INV-2",
      openingBalance: 100,
      creditLimit: 500,
      movements: [{ total: 250, paid: 100 }],
      notify: payload => notifications.push(payload),
    });
    expect(breached).toBe(false);
    expect(notifications).toHaveLength(0);
  });
});
