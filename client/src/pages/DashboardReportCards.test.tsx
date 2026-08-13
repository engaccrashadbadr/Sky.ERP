// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Dashboard } from "./Home";

afterEach(() => cleanup());

describe("Dashboard report-opening cards", () => {
  const renderDashboard = () => {
    const onNavigate = vi.fn();
    const onFromChange = vi.fn();
    const onToChange = vi.fn();

    render(
      <Dashboard
        summary={{ revenue: 125000, expenses: 45000, profit: 80000, receivables: 21000, invoiceCount: 12, lowStockCount: 2 }}
        notifications={[
          { id: 1, title: "تنبيه ائتماني", message: "حساب يحتاج إلى مراجعة" },
          { id: 2, title: "تنبيه مخزون", message: "صنف تحت الحد الأدنى" },
        ]}
        onNavigate={onNavigate}
        from="2026-08-01"
        to="2026-08-31"
        onFromChange={onFromChange}
        onToChange={onToChange}
      />,
    );

    return { onNavigate, onFromChange, onToChange };
  };

  it("routes every report-opening dashboard card to the reports section", () => {
    const { onNavigate } = renderDashboard();

    const metricCards = [
      "فتح تقرير إجمالي الإيرادات",
      "فتح تقرير إجمالي المصروفات",
      "فتح تقرير صافي الربح",
      "فتح تقرير المبالغ المستحقة",
    ];
    metricCards.forEach(label => fireEvent.click(screen.getByRole("button", { name: label })));
    fireEvent.click(screen.getByRole("button", { name: "فتح مركز التقارير" }));
    fireEvent.click(screen.getByRole("button", { name: /عرض التقارير/ }));
    fireEvent.click(screen.getByRole("button", { name: /تقرير مالي/ }));

    expect(onNavigate).toHaveBeenCalledTimes(7);
    expect(onNavigate).toHaveBeenNthCalledWith(1, "reports");
    expect(onNavigate).toHaveBeenNthCalledWith(2, "reports");
    expect(onNavigate).toHaveBeenNthCalledWith(3, "reports");
    expect(onNavigate).toHaveBeenNthCalledWith(4, "reports");
    expect(onNavigate).toHaveBeenNthCalledWith(5, "reports");
    expect(onNavigate).toHaveBeenNthCalledWith(6, "reports");
    expect(onNavigate).toHaveBeenNthCalledWith(7, "reports");
  });

  it("keeps the dashboard cards accessible and preserves the selected date range", () => {
    const { onFromChange, onToChange } = renderDashboard();

    expect(screen.getByRole("button", { name: "فتح تقرير إجمالي الإيرادات" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "فتح تقرير إجمالي المصروفات" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "فتح تقرير صافي الربح" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "فتح تقرير المبالغ المستحقة" })).toBeTruthy();
    expect(screen.getByText("تنبيه ائتماني")).toBeTruthy();
    expect(screen.getByText("تنبيه مخزون")).toBeTruthy();

    const dates = screen.getAllByDisplayValue(/2026-08-/);
    expect(dates).toHaveLength(2);
    fireEvent.change(dates[0], { target: { value: "2026-08-05" } });
    fireEvent.change(dates[1], { target: { value: "2026-08-25" } });

    expect(onFromChange).toHaveBeenCalledWith("2026-08-05");
    expect(onToChange).toHaveBeenCalledWith("2026-08-25");
  });
});
