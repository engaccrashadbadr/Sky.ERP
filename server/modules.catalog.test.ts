import { describe, expect, it } from "vitest";
import { getSkyModuleReportCatalog } from "./db";

describe("Sky ERP module report catalog", () => {
  it("covers the attached finance, HRMS, SCM, sales, inventory, POS, and admin groups", () => {
    const groups = new Set(getSkyModuleReportCatalog().map(report => report.group));
    expect([...groups]).toEqual(expect.arrayContaining(["finance", "hrms", "scm", "sales", "inventory", "pos", "admin"]));
  });

  it("labels live, partial, and catalog-only source states without fabricating data", () => {
    const reports = getSkyModuleReportCatalog();
    expect(reports.some(report => report.status === "live" && report.source.includes("journal"))).toBe(true);
    expect(reports.some(report => report.status === "partial" && report.module === "Payroll")).toBe(true);
    expect(reports.some(report => report.status === "catalog" && report.source.includes("fixedAssets"))).toBe(true);
    expect(reports.every(report => report.note.length > 0 && report.source.length > 0)).toBe(true);
  });

  it("filters the catalog by module group", () => {
    const finance = getSkyModuleReportCatalog("finance");
    expect(finance.length).toBeGreaterThan(0);
    expect(finance.every(report => report.group === "finance")).toBe(true);
  });
});
