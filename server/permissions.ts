export type PermissionRuleSubject = "role" | "department" | "template";

export type PermissionKey =
  | "dashboard.view"
  | "reports.catalog"
  | "reports.financial"
  | "reports.aging"
  | "reports.cashFlow"
  | "reports.modules"
  | "reports.audit"
  | "accounts.view"
  | "accounts.create"
  | "accounts.manage"
  | "parties.view"
  | "parties.create"
  | "parties.payments"
  | "products.view"
  | "products.create"
  | "inventory.move"
  | "invoices.view"
  | "invoices.create"
  | "employees.view"
  | "employees.create"
  | "payroll.run"
  | "attendance.view"
  | "attendance.record"
  | "currencies.view"
  | "currencies.manage"
  | "closing.view"
  | "closing.manage"
  | "imports.masterData"
  | "workflows.view"
  | "workflows.create"
  | "workflows.approve"
  | "costing.view"
  | "costing.manage"
  | "attachments.upload"
  | "audit.view"
  | "assistant.use"
  | "admin.users"
  | "admin.permissions";

export type PermissionDefinition = { key: PermissionKey; label: string; group: string; kind: "report" | "action" };

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = ([
  ["dashboard.view", "لوحة التحكم", "الأساسيات", "report"],
  ["reports.catalog", "كتالوج التقارير", "التقارير", "report"],
  ["reports.financial", "التقارير المالية", "التقارير", "report"],
  ["reports.aging", "أعمار الذمم وكشوف الأطراف", "التقارير", "report"],
  ["reports.cashFlow", "التدفقات النقدية", "التقارير", "report"],
  ["reports.modules", "تقارير الموديولات", "التقارير", "report"],
  ["reports.audit", "تقارير التدقيق", "التقارير", "report"],
  ["accounts.view", "عرض دليل الحسابات", "الحسابات", "action"],
  ["accounts.create", "إنشاء حساب", "الحسابات", "action"],
  ["accounts.manage", "تعديل وتعطيل الحسابات", "الحسابات", "action"],
  ["parties.view", "عرض العملاء والموردين", "الأطراف", "action"],
  ["parties.create", "إنشاء عميل أو مورد", "الأطراف", "action"],
  ["parties.payments", "تسجيل تحصيل أو سداد", "الأطراف", "action"],
  ["products.view", "عرض الأصناف", "المخزون", "action"],
  ["products.create", "إنشاء صنف", "المخزون", "action"],
  ["inventory.move", "تسجيل حركة مخزون", "المخزون", "action"],
  ["invoices.view", "عرض الفواتير", "المبيعات والمشتريات", "action"],
  ["invoices.create", "إنشاء فاتورة", "المبيعات والمشتريات", "action"],
  ["employees.view", "عرض الموظفين", "الموارد البشرية", "action"],
  ["employees.create", "إنشاء موظف", "الموارد البشرية", "action"],
  ["payroll.run", "تشغيل الرواتب", "الموارد البشرية", "action"],
  ["attendance.view", "عرض الحضور", "الموارد البشرية", "action"],
  ["attendance.record", "تسجيل حضور", "الموارد البشرية", "action"],
  ["currencies.view", "عرض العملات", "الإعدادات", "action"],
  ["currencies.manage", "تعديل أسعار العملات", "الإعدادات", "action"],
  ["closing.view", "عرض إقفالات الفترات", "الإقفال المالي", "report"],
  ["closing.manage", "فتح وإقفال الفترات", "الإقفال المالي", "action"],
  ["imports.masterData", "استيراد البيانات الرئيسية", "الاستيراد", "action"],
  ["workflows.view", "عرض طلبات الموافقات", "الموافقات", "action"],
  ["workflows.create", "إنشاء طلب موافقة", "الموافقات", "action"],
  ["workflows.approve", "اعتماد أو رفض الطلبات", "الموافقات", "action"],
  ["costing.view", "عرض التكاليف والتصنيع", "التكاليف", "report"],
  ["costing.manage", "إدارة التكاليف والتصنيع", "التكاليف", "action"],
  ["attachments.upload", "رفع المرفقات", "المستندات", "action"],
  ["audit.view", "عرض سجل التدقيق", "الإدارة", "report"],
  ["assistant.use", "استخدام المساعد المحاسبي", "المساعدة", "action"],
  ["admin.users", "إدارة المستخدمين والأقسام", "الإدارة", "action"],
  ["admin.permissions", "إدارة مصفوفة الصلاحيات", "الإدارة", "action"],
] as Array<[PermissionKey, string, string, "report" | "action"]>).map(([key, label, group, kind]) => ({ key, label, group, kind }));

export const PERMISSION_DEFAULTS: Record<PermissionRuleSubject, PermissionKey[]> = {
  role: [],
  department: [],
  template: [],
};

export function getPermissionDefinition(key: string) {
  return PERMISSION_DEFINITIONS.find(item => item.key === key);
}
