import React from "react";
import { Button } from "@/components/ui/button";
import { workflowStepDefinitions, type WorkflowStepId } from "@/lib/workflowSteps";

export function WorkflowStepBar({ onDraft, onFocus }: { onDraft: () => void; onFocus: (step: Exclude<WorkflowStepId, "draft">) => void }) {
  return <div className="grid gap-2 sm:grid-cols-5" aria-label="دورة مستندية تفاعلية">
    {workflowStepDefinitions.map(step => <Button
      key={step.id}
      type="button"
      variant={step.id === "draft" ? "default" : "outline"}
      className="justify-center"
      onClick={() => step.id === "draft" ? onDraft() : onFocus(step.id)}
    >{step.label}{!step.live && " — لاحقاً"}</Button>)}
  </div>;
}
