export type WorkflowStepId = "draft" | "review" | "approve" | "execute" | "archive";

export type WorkflowStepDefinition = {
  id: WorkflowStepId;
  label: string;
  live: boolean;
  guidance: string;
};

export const workflowStepDefinitions: WorkflowStepDefinition[] = [
  { id: "draft", label: "مسودة", live: true, guidance: "فتح نموذج مسودة الطلب" },
  { id: "review", label: "مراجعة", live: true, guidance: "مراجعة الطلبات المعلقة بعد حفظ المسودة" },
  { id: "approve", label: "اعتماد", live: true, guidance: "اعتماد الطلب حسب صلاحية المستخدم" },
  { id: "execute", label: "تنفيذ", live: false, guidance: "يتاح بعد اكتمال الموافقات المطلوبة" },
  { id: "archive", label: "أرشفة", live: false, guidance: "يتاح بعد إغلاق الطلب من دورة العمل" },
];

export function workflowStepById(id: WorkflowStepId) {
  return workflowStepDefinitions.find(step => step.id === id) ?? workflowStepDefinitions[0];
}
