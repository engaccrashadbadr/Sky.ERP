from pathlib import Path

home = Path('/home/ubuntu/enterprise-erp/client/src/pages/Home.tsx')
text = home.read_text()
text = text.replace('import { exportToExcel, exportToPdf } from "@/lib/reportExport";\n', 'import { exportToExcel, exportToPdf } from "@/lib/reportExport";\nimport { workflowStepDefinitions } from "@/lib/workflowSteps";\n', 1)
old = '''  const workflowSteps = [
    { id: "draft", label: "مسودة", action: () => setDraftOpen(true), live: true },
    { id: "review", label: "مراجعة", action: () => toast.info("المراجعة متاحة من قائمة الطلبات المعلقة بعد حفظ المسودة"), live: true },
    { id: "approve", label: "اعتماد", action: () => toast.info("الاعتماد يتم من قائمة الموافقات حسب صلاحية المستخدم"), live: true },
    { id: "execute", label: "تنفيذ", action: () => toast.info("التنفيذ يفتح بعد اكتمال الموافقات المطلوبة"), live: false },
    { id: "archive", label: "أرشفة", action: () => toast.info("الأرشفة متاحة بعد إغلاق الطلب من دورة العمل"), live: false },
  ];'''
new = '''  const workflowSteps = workflowStepDefinitions.map(step => ({
    ...step,
    action: step.id === "draft"
      ? () => setDraftOpen(true)
      : () => toast.info(step.guidance),
  }));'''
if old not in text:
    raise SystemExit('workflow block not found')
home.write_text(text.replace(old, new, 1))

