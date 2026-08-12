import { describe, expect, it } from "vitest";
import { validateBalancedEntry } from "./db";

describe("accounting journal validation", () => {
  it("accepts equal debit and credit totals", () => {
    expect(validateBalancedEntry([
      { debit: "1250.00", credit: "0" },
      { debit: "0", credit: "1250.00" },
    ])).toMatchObject({ debit: 1250, credit: 1250, balanced: true });
  });

  it("rejects entries where debit and credit differ", () => {
    expect(() => validateBalancedEntry([
      { debit: 100, credit: 0 },
      { debit: 0, credit: 90 },
    ])).toThrow("يجب أن يتساوى إجمالي المدين مع إجمالي الدائن");
  });
});
