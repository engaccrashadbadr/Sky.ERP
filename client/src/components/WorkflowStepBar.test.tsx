// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WorkflowStepBar } from "./WorkflowStepBar";

describe("WorkflowStepBar", () => {
  afterEach(() => cleanup());
  it("opens the editable draft form when مسودة is clicked", () => {
    const onDraft = vi.fn();
    const onFocus = vi.fn();
    render(<WorkflowStepBar onDraft={onDraft} onFocus={onFocus} />);

    fireEvent.click(screen.getByRole("button", { name: "مسودة" }));

    expect(onDraft).toHaveBeenCalledTimes(1);
    expect(onFocus).not.toHaveBeenCalled();
  });

  it("routes review, approval, and archive to their stateful handlers", () => {
    const onDraft = vi.fn();
    const onFocus = vi.fn();
    render(<WorkflowStepBar onDraft={onDraft} onFocus={onFocus} />);

    fireEvent.click(screen.getByRole("button", { name: "مراجعة" }));
    fireEvent.click(screen.getByRole("button", { name: "اعتماد" }));
    fireEvent.click(screen.getByRole("button", { name: /أرشفة/ }));

    expect(onFocus.mock.calls.map(([step]) => step)).toEqual(["review", "approve", "archive"]);
  });
});
