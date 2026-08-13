import * as XLSX from "xlsx";

export type TemplateId =
  | "accounts"
  | "parties"
  | "products"
  | "journals"
  | "invoices"
  | "stockMovements"
  | "employees"
  | "attendance"
  | "costCenters"
  | "boms"
  | "workOrders"
  | "purchaseRequests"
  | "leaveRequests";

type TemplateDefinition = {
  id: TemplateId;
  title: string;
  description: string;
  columns: string[];
  example: Record<string, string | number>;
  notes: string[];
};

export const importTemplates: TemplateDefinition[] = [
  { id: "accounts", title: "الحسابات والأرصدة الافتتاحية", description: "تكويد الحسابات الرئيسية والفرعية مع الأرصدة الافتتاحية.", columns: ["كود الحساب", "اسم الحساب", "نوع الحساب", "الحساب الأب", "الرصيد الافتتاحي", "العملة", "نشط"], example: { "كود الحساب": "1101", "اسم الحساب": "حساب بنكي", "نوع الحساب": "asset", "الحساب الأب": "1100", "الرصيد الافتتاحي": 0, "العملة": "EGP", "نشط": "نعم" }, notes: ["نوع الحساب: asset أو liability أو equity أو revenue أو expense.", "اترك الحساب الأب فارغاً للحساب الرئيسي."] },
  { id: "parties", title: "العملاء والموردون", description: "إضافة العملاء والموردين والأرصدة وحدود الائتمان.", columns: ["نوع السجل", "الاسم", "الهاتف", "البريد الإلكتروني", "الرقم الضريبي", "الرصيد الافتتاحي", "حد الائتمان", "العملة"], example: { "نوع السجل": "عميل", "الاسم": "", "الهاتف": "", "البريد الإلكتروني": "", "الرقم الضريبي": "", "الرصيد الافتتاحي": 0, "حد الائتمان": 0, "العملة": "EGP" }, notes: ["نوع السجل يقبل عميل أو مورد.", "لا تستبدل الصفوف الموجودة؛ التكرار يظهر في المعاينة."] },
  { id: "products", title: "الأصناف والمنتجات", description: "تكويد الأصناف مع تصنيف الكود والأسعار والكميات.", columns: ["SKU", "اسم الصنف", "الوحدة", "سعر الشراء", "سعر البيع", "الكمية الافتتاحية", "حد إعادة الطلب", "الحساب"], example: { SKU: "100001", "اسم الصنف": "", "الوحدة": "قطعة", "سعر الشراء": 0, "سعر البيع": 0, "الكمية الافتتاحية": 0, "حد إعادة الطلب": 0, "الحساب": "" }, notes: ["يبدأ SKU بـ 1 للمادة الخام، 2 لنصف المصنع، 3 للمنتج تام التصنيع."] },
  { id: "journals", title: "سندات القيود", description: "حركات القيد اليومية في شكل صف لكل سطر قيد.", columns: ["رقم القيد", "التاريخ", "البيان", "كود الحساب", "اسم الطرف", "مدين", "دائن", "العملة"], example: { "رقم القيد": "JE-0001", "التاريخ": "2026-01-01", "البيان": "", "كود الحساب": "", "اسم الطرف": "", "مدين": 0, "دائن": 0, "العملة": "EGP" }, notes: ["يجب أن يتساوى إجمالي المدين والدائن لكل رقم قيد.", "استخدم كود الحساب أو اسم الطرف للبحث والمطابقة."] },
  { id: "invoices", title: "فواتير المبيعات والمشتريات", description: "استيراد رؤوس الفواتير وبنودها مع الضرائب والسداد.", columns: ["رقم الفاتورة", "النوع", "التاريخ", "اسم العميل أو المورد", "SKU", "الكمية", "سعر الوحدة", "الضريبة", "الخصم", "المدفوع"], example: { "رقم الفاتورة": "INV-0001", "النوع": "sale", "التاريخ": "2026-01-01", "اسم العميل أو المورد": "", SKU: "", "الكمية": 1, "سعر الوحدة": 0, "الضريبة": 0, "الخصم": 0, "المدفوع": 0 }, notes: ["النوع sale أو purchase.", "يمكن تكرار رقم الفاتورة لعدة بنود ضمن نفس الفاتورة."] },
  { id: "stockMovements", title: "حركات المخزون", description: "إضافة حركات الوارد والمنصرف والتسويات.", columns: ["التاريخ", "SKU", "نوع الحركة", "الكمية", "المرجع", "ملاحظات"], example: { "التاريخ": "2026-01-01", SKU: "100001", "نوع الحركة": "in", "الكمية": 1, "المرجع": "", "ملاحظات": "" }, notes: ["نوع الحركة in أو out أو adjustment."] },
  { id: "employees", title: "الموظفون والرواتب", description: "بيانات الموظفين الأساسية والراتب والقسم.", columns: ["الاسم", "الرقم الوظيفي", "القسم", "المسمى الوظيفي", "الراتب الأساسي", "تاريخ التعيين", "الحالة"], example: { "الاسم": "", "الرقم الوظيفي": "", "القسم": "", "المسمى الوظيفي": "", "الراتب الأساسي": 0, "تاريخ التعيين": "2026-01-01", "الحالة": "active" }, notes: ["الحالة active أو inactive."] },
  { id: "attendance", title: "الحضور والانصراف", description: "تسجيل حضور وغياب الموظفين دفعة واحدة.", columns: ["الرقم الوظيفي", "التاريخ", "الحالة", "وقت الحضور", "وقت الانصراف", "ملاحظات"], example: { "الرقم الوظيفي": "", "التاريخ": "2026-01-01", "الحالة": "present", "وقت الحضور": "09:00", "وقت الانصراف": "17:00", "ملاحظات": "" }, notes: ["الحالة present أو absent أو late أو leave."] },
  { id: "costCenters", title: "مراكز التكلفة", description: "تكويد مراكز التكلفة ونسب التوزيع.", columns: ["كود المركز", "اسم المركز", "المركز الأب", "نوع المركز", "نشط"], example: { "كود المركز": "CC-001", "اسم المركز": "الإنتاج", "المركز الأب": "", "نوع المركز": "production", "نشط": "نعم" }, notes: ["يمكن استخدام المركز الأب لبناء شجرة مراكز التكلفة."] },
  { id: "boms", title: "قوائم المواد BOM", description: "مكونات المنتج ومقادير التصنيع ومراحل التشغيل.", columns: ["SKU المنتج", "SKU المكون", "الكمية", "رقم المرحلة", "ملاحظات"], example: { "SKU المنتج": "300001", "SKU المكون": "100001", "الكمية": 1, "رقم المرحلة": 1, "ملاحظات": "" }, notes: ["SKU المنتج يبدأ بـ 3 للمنتج تام التصنيع."] },
  { id: "workOrders", title: "أوامر التشغيل", description: "أوامر التصنيع ومراكز التكلفة والمراحل.", columns: ["رقم الأمر", "SKU المنتج", "الكمية المخططة", "مركز التكلفة", "تاريخ البدء", "تاريخ الانتهاء", "الحالة"], example: { "رقم الأمر": "WO-0001", "SKU المنتج": "300001", "الكمية المخططة": 1, "مركز التكلفة": "CC-001", "تاريخ البدء": "2026-01-01", "تاريخ الانتهاء": "2026-01-02", "الحالة": "draft" }, notes: ["الحالة draft أو released أو completed أو cancelled."] },
  { id: "purchaseRequests", title: "طلبات الشراء", description: "طلبات الشراء ومسار الاعتماد متعدد المستويات.", columns: ["رقم الطلب", "التاريخ", "القسم", "الصنف", "الكمية", "السبب", "الأولوية"], example: { "رقم الطلب": "PR-0001", "التاريخ": "2026-01-01", "القسم": "", "الصنف": "", "الكمية": 1, "السبب": "", "الأولوية": "normal" }, notes: ["الأولوية low أو normal أو high أو urgent."] },
  { id: "leaveRequests", title: "طلبات الإجازات", description: "طلبات الإجازات للموظفين للمراجعة والاعتماد.", columns: ["الرقم الوظيفي", "نوع الإجازة", "من تاريخ", "إلى تاريخ", "عدد الأيام", "السبب"], example: { "الرقم الوظيفي": "", "نوع الإجازة": "annual", "من تاريخ": "2026-01-01", "إلى تاريخ": "2026-01-02", "عدد الأيام": 2, "السبب": "" }, notes: ["نوع الإجازة annual أو sick أو unpaid أو other."] },
];

export function getImportTemplate(id: TemplateId) {
  return importTemplates.find(template => template.id === id) ?? importTemplates[0];
}

export function downloadImportTemplate(id: TemplateId) {
  const template = getImportTemplate(id);
  const worksheet = XLSX.utils.json_to_sheet([template.example], { header: template.columns });
  worksheet["!dir"] = "rtl";
  worksheet["!cols"] = template.columns.map(column => ({ wch: Math.max(16, Math.min(30, column.length + 8)) }));
  const notes = XLSX.utils.aoa_to_sheet([["إرشادات القالب"], ...template.notes.map(note => [note])]);
  notes["!dir"] = "rtl";
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "البيانات");
  XLSX.utils.book_append_sheet(workbook, notes, "الإرشادات");
  const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  const filename = `قالب-${template.title.replace(/\s+/g, "-")}.xlsx`;
  if (typeof document === "undefined" || typeof URL === "undefined") { XLSX.writeFile(workbook, filename); return true; }
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  window.setTimeout(() => { anchor.remove(); URL.revokeObjectURL(url); }, 250);
  return true;
}
