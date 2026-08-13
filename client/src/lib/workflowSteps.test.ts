import { describe, expect, it } from "vitest";
import { workflowStepById, workflowStepDefinitions } from "./workflowSteps";

describe("document workflow steps", () => {
  it("defines the draft step as a live form-opening action", () => {
    const draft = workflowStepById("draft");
    expect(draft.label).toBe("مسودة");
    expect(draft.live).toBe(true);
    expect(draft.guidance).toContain("نموذج مسودة");
  });

  it("keeps review and approval live while marking execution and archive honestly", () => {
    expect(workflowStepDefinitions.filter(step => step.live).map(step => step.id)).toEqual(["draft", "review", "approve"]);
    expect(workflowStepById("execute").live).toBe(false);
    expect(workflowStepById("archive").live).toBe(false);
  });
});
