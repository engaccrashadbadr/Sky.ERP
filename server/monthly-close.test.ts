import { describe, expect, it, vi, beforeEach } from "vitest";

const { listMonthlyClosings, upsertMonthlyClosing, closeMonthlyPeriod, reopenMonthlyPeriod, recordAuditEvent } = vi.hoisted(() => ({
  listMonthlyClosings: vi.fn(),
  upsertMonthlyClosing: vi.fn(),
  closeMonthlyPeriod: vi.fn(),
  reopenMonthlyPeriod: vi.fn(),
  recordAuditEvent: vi.fn(),
}));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, listMonthlyClosings, upsertMonthlyClosing, closeMonthlyPeriod, reopenMonthlyPeriod, recordAuditEvent };
});

import { appRouter } from "./routers";

const context = { req: {} as any, res: {} as any, user: { id: 21, role: "accountant" } as any };

describe("monthly closing routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listMonthlyClosings.mockResolvedValue([{ id: 1, period: "2026-07", status: "open" }]);
    upsertMonthlyClosing.mockResolvedValue({ id: 1, period: "2026-07", status: "open" });
    closeMonthlyPeriod.mockResolvedValue({ id: 1, period: "2026-07", status: "closed" });
    reopenMonthlyPeriod.mockResolvedValue({ id: 1, period: "2026-07", status: "reopened" });
  });

  it("lists and opens a monthly period through protected procedures", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.closing.list()).resolves.toHaveLength(1);
    await expect(caller.closing.open({ period: "2026-07" })).resolves.toMatchObject({ status: "open" });
    expect(upsertMonthlyClosing).toHaveBeenCalledWith("2026-07");
  });

  it("closes a period and records the actor audit event", async () => {
    const result = await appRouter.createCaller(context).closing.close({ period: "2026-07", trialBalanceDifference: 0, validationNote: "تمت المطابقة" });
    expect(result).toMatchObject({ status: "closed" });
    expect(closeMonthlyPeriod).toHaveBeenCalledWith({ period: "2026-07", trialBalanceDifference: 0, validationNote: "تمت المطابقة", userId: 21 });
    expect(recordAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ actorUserId: 21, action: "close_period", entityType: "monthlyClosing", entityId: 1 }));
  });

  it("reopens a period and records the reopen audit event", async () => {
    const result = await appRouter.createCaller(context).closing.reopen({ period: "2026-07", note: "تصحيح قيد" });
    expect(result).toMatchObject({ status: "reopened" });
    expect(reopenMonthlyPeriod).toHaveBeenCalledWith({ period: "2026-07", note: "تصحيح قيد", userId: 21 });
    expect(recordAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ actorUserId: 21, action: "reopen_period", entityType: "monthlyClosing", entityId: 1 }));
  });
});
