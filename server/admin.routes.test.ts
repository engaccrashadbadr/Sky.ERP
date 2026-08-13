import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateOrganizationUnit, updateApprovalTemplate, recordAuditEvent } = vi.hoisted(() => ({
  updateOrganizationUnit: vi.fn(),
  updateApprovalTemplate: vi.fn(),
  recordAuditEvent: vi.fn(),
}));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return {
    ...actual,
    updateOrganizationUnit,
    updateApprovalTemplate,
    recordAuditEvent,
  };
});

import { appRouter } from "./routers";

const adminContext = { req: {} as any, res: {} as any, user: { id: 7, role: "admin" } as any };

describe("admin configuration routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateOrganizationUnit.mockResolvedValue({ id: 11, name: "المبيعات", code: "SALES", isActive: true });
    updateApprovalTemplate.mockResolvedValue({ id: 12, name: "اعتماد المشتريات", requestType: "purchase", steps: [] });
  });

  it("invokes organization-unit update and records its audit event", async () => {
    const input = { id: 11, name: "المبيعات", code: "SALES", parentId: null, isActive: true };
    await expect(appRouter.createCaller(adminContext).admin.updateOrganizationUnit(input)).resolves.toMatchObject({ id: 11, name: "المبيعات" });
    expect(updateOrganizationUnit).toHaveBeenCalledWith(input);
    expect(recordAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ actorUserId: 7, action: "update", entityType: "organizationUnit", entityId: 11 }));
  });

  it("invokes approval-template update and records its audit event", async () => {
    const input = { id: 12, name: "اعتماد المشتريات", organizationUnitId: null, isActive: true, steps: [{ stepOrder: 1, approverRole: "accountant", minimumAmount: 0 }] };
    await expect(appRouter.createCaller(adminContext).admin.updateApprovalTemplate(input)).resolves.toMatchObject({ id: 12, name: "اعتماد المشتريات" });
    expect(updateApprovalTemplate).toHaveBeenCalledWith(input);
    expect(recordAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ actorUserId: 7, action: "update", entityType: "approvalTemplate", entityId: 12 }));
  });
});
