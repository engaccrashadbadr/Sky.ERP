import { describe, expect, it } from "vitest";
import { calculateDetailedReportSections } from "./db";

describe("calculateDetailedReportSections", () => {
  const trialBalance = [
    { accountCode: "101", accountName: "الصندوق", category: "asset", debit: 1200, credit: 200, balance: 1000 },
    { accountCode: "401", accountName: "المبيعات", category: "revenue", debit: 0, credit: 2500, balance: -2500 },
    { accountCode: "501", accountName: "مصروف كهرباء", category: "expense", debit: 600, credit: 0, balance: 600 },
    { accountCode: "201", accountName: "دائنون", category: "liability", debit: 0, credit: 400, balance: -400 },
    { accountCode: "301", accountName: "رأس المال", category: "equity", debit: 0, credit: 300, balance: -300 },
  ];

  it("calculates detailed statement sections and tax totals", () => {
    const result = calculateDetailedReportSections(trialBalance, [
      { date: new Date("2026-01-01"), description: "تحصيل نقدي", accountCode: "101", accountName: "الصندوق", debit: 1200, credit: 200 },
      { date: new Date("2026-01-02"), description: "مصروف نقدي", accountCode: "101", accountName: "الصندوق", debit: 0, credit: 200 },
    ], [{ invoiceDate: new Date("2026-01-03"), type: "sale", total: "2500", tax: "375" }, { invoiceDate: new Date("2026-01-04"), type: "purchase", total: "1000", tax: "150" }]);

    expect(result.incomeStatement.revenue).toBe(2500);
    expect(result.incomeStatement.expenses).toBe(600);
    expect(result.incomeStatement.netIncome).toBe(1900);
    expect(result.incomeStatement.revenueLines).toHaveLength(1);
    expect(result.balanceSheet.totals.assets).toBe(1000);
    expect(result.balanceSheet.totals.liabilities).toBe(400);
    expect(result.cashFlow.inflow).toBe(1000);
    expect(result.cashFlow.outflow).toBe(200);
    expect(result.cashFlow.net).toBe(800);
    expect(result.taxSummary).toEqual({ totalTax: 525, salesTax: 375, purchaseTax: 150, netTax: 225, taxableSales: 2500, taxablePurchases: 1000, invoiceCount: 2, byType: [{ type: "sale", invoiceCount: 1, tax: 375, taxableAmount: 2500 }, { type: "purchase", invoiceCount: 1, tax: 150, taxableAmount: 1000 }] });
  });
});
