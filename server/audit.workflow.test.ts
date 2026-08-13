import { describe, expect, it } from "vitest";
import { canApproveStep, serializeAuditValue } from "./db";

describe("audit and approval workflow helpers", () => {
  it("serializes audit payloads safely and preserves null semantics", () => {
    expect(serializeAuditValue(null)).toBeNull();
    expect(serializeAuditValue({ amount: 12.5, nested: { ok: true } })).toBe('{"amount":12.5,"nested":{"ok":true}}');
  });

  it("allows an administrator to approve any organization step", () => {
    expect(canApproveStep({ id: 1, role: "admin", department: "finance" }, { approverDepartment: "hr" })).toBe(true);
  });

  it("allows only the configured user, role, or department", () => {
    expect(canApproveStep({ id: 4, role: "accountant", department: "finance" }, { approverUserId: 4 })).toBe(true);
    expect(canApproveStep({ id: 4, role: "accountant", department: "finance" }, { approverRole: "accountant" })).toBe(true);
    expect(canApproveStep({ id: 4, role: "accountant", department: "finance" }, { approverDepartment: "finance" })).toBe(true);
    expect(canApproveStep({ id: 4, role: "accountant", department: "finance" }, { approverDepartment: "hr" })).toBe(false);
  });
});
