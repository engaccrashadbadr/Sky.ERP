import { and, desc, eq, lt, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { ENV } from "./_core/env";
import { InsertUser, users, accounts, parties, products, invoices, invoiceLines, employees, payrollRuns, notifications, attachments, stockMoves, journalEntries, journalLines, currencies, attendanceRecords, cashDrawerSessions, partyPayments, organizationUnits, approvalTemplates, approvalTemplateSteps, workflowRequests, workflowApprovals, auditLogs, costCenters, costElements, productCosts, costAllocations, costTypes, costingMethods, boms, bomLines, workOrders, workOrderOperations, costDistributions, monthlyClosings } from "../drizzle/schema";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function updateUserRole(userId: number, role: "user" | "accountant" | "admin") { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); return db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId)); }
export async function listUsers() { const db = await getDb(); return db ? db.select({ id: users.id, name: users.name, email: users.email, role: users.role, department: users.department, permissionTemplate: users.permissionTemplate, lastSignedIn: users.lastSignedIn }).from(users).orderBy(desc(users.lastSignedIn)) : []; }
export async function updateUserAccess(input: { userId: number; department?: string; permissionTemplate?: string }) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); return db.update(users).set({ department: input.department, permissionTemplate: input.permissionTemplate ?? "تشغيل عام", updatedAt: new Date() }).where(eq(users.id, input.userId)); }

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return rows[0];
}

export async function getDashboardSummary(input: { from?: Date; to?: Date } = {}) {
  const db = await getDb();
  if (!db) return { revenue: 0, expenses: 0, profit: 0, receivables: 0, invoiceCount: 0, lowStockCount: 0, from: input.from ?? null, to: input.to ?? null };
  const rows = await db.select({ type: invoices.type, invoiceDate: invoices.invoiceDate, total: invoices.total, paid: invoices.paid, status: invoices.status }).from(invoices);
  const from = input.from?.getTime() ?? -Infinity; const to = input.to?.getTime() ?? Infinity;
  const filtered = rows.filter(row => row.invoiceDate.getTime() >= from && row.invoiceDate.getTime() <= to);
  const revenue = filtered.filter(row => row.type === "sale").reduce((sum, row) => sum + Number(row.total), 0);
  const expenses = filtered.filter(row => row.type === "purchase").reduce((sum, row) => sum + Number(row.total), 0);
  const receivables = filtered.filter(row => row.type === "sale" && ["issued", "partially_paid", "overdue"].includes(row.status)).reduce((sum, row) => sum + Math.max(0, Number(row.total) - Number(row.paid)), 0);
  const lowStock = await db.select({ value: sql<number>`count(*)` }).from(products).where(and(eq(products.isActive, true), lt(products.quantity, products.minQuantity)));
  return { revenue, expenses, profit: revenue - expenses, receivables, invoiceCount: filtered.length, lowStockCount: Number(lowStock[0]?.value ?? 0), from: input.from ?? null, to: input.to ?? null };
}

export async function getDebtAging(input: { asOf?: Date; partyType?: "customer" | "supplier" } = {}) {
  const db = await getDb(); if (!db) return [];
  const asOf = input.asOf ?? new Date();
  const partyRows = await db.select({ id: parties.id, name: parties.name, type: parties.type, openingBalance: parties.openingBalance }).from(parties).where(input.partyType ? eq(parties.type, input.partyType) : undefined);
  const invoiceRows = await db.select({ partyId: invoices.partyId, invoiceDate: invoices.invoiceDate, total: invoices.total, paid: invoices.paid, type: invoices.type }).from(invoices).where(lte(invoices.invoiceDate, asOf));
  return partyRows.map(party => { const balance = Number(party.openingBalance) + invoiceRows.filter(row => row.partyId === party.id && ((party.type === "customer" && row.type === "sale") || (party.type === "supplier" && row.type === "purchase"))).reduce((sum, row) => sum + Math.max(0, Number(row.total) - Number(row.paid)), 0); const buckets = { current: 0, days1to30: 0, days31to60: 0, days61to90: 0, over90: 0 }; invoiceRows.filter(row => row.partyId === party.id).forEach(row => { const due = Math.max(0, Number(row.total) - Number(row.paid)); const age = Math.floor((asOf.getTime() - row.invoiceDate.getTime()) / 86400000); if (age <= 0) buckets.current += due; else if (age <= 30) buckets.days1to30 += due; else if (age <= 60) buckets.days31to60 += due; else if (age <= 90) buckets.days61to90 += due; else buckets.over90 += due; }); return { ...party, balance, ...buckets }; }).filter(row => row.balance > 0);
}

export async function getCashFlowAnalysis(input: { from?: Date; to?: Date } = {}) { const reports = await getFinancialReports(input); const movements = ("movements" in reports.cashFlow ? reports.cashFlow.movements : []) as Array<{ accountName: string; net: number }>; return { ...reports.cashFlow, operating: movements.filter((row) => !/أصل|معدات|استثمار|قرض|تمويل/i.test(row.accountName)).reduce((sum, row) => sum + row.net, 0), investing: movements.filter((row) => /أصل|معدات|استثمار/i.test(row.accountName)).reduce((sum, row) => sum + row.net, 0), financing: movements.filter((row) => /قرض|تمويل|رأس مال/i.test(row.accountName)).reduce((sum, row) => sum + row.net, 0) }; }

export type OracleReportGroup = "generalLedger" | "payables" | "receivables" | "fixedAssets" | "cashManagement";
export type OracleReportDefinition = { id: string; group: OracleReportGroup; title: string; source: string; status: "live" | "catalog" };
export const ORACLE_REPORT_CATALOG: OracleReportDefinition[] = [
  { id: "trial-balance", group: "generalLedger", title: "ميزان المراجعة", source: "journalEntries/journalLines/accounts", status: "live" },
  { id: "gl-activity", group: "generalLedger", title: "حركة الحسابات ودفتر الأستاذ العام", source: "journalEntries/journalLines/accounts", status: "live" },
  { id: "audit-trail", group: "generalLedger", title: "تقرير التدقيق", source: "journalEntries/journalLines", status: "live" },
  { id: "ap-aging", group: "payables", title: "أعمار الذمم الدائنة", source: "parties/invoices", status: "live" },
  { id: "payment-register", group: "payables", title: "سجل المدفوعات", source: "partyPayments", status: "live" },
  { id: "invoice-po-matching", group: "payables", title: "مطابقة الفواتير وأوامر الشراء", source: "invoices/invoiceLines", status: "catalog" },
  { id: "ar-aging", group: "receivables", title: "أعمار الذمم المدينة", source: "parties/invoices", status: "live" },
  { id: "collections", group: "receivables", title: "تقرير التحصيلات", source: "partyPayments/invoices", status: "live" },
  { id: "customer-invoice-register", group: "receivables", title: "سجل فواتير العملاء", source: "invoices/invoiceLines", status: "live" },
  { id: "depreciation", group: "fixedAssets", title: "تقرير إهلاك الأصول", source: "fixedAssets", status: "catalog" },
  { id: "asset-additions-retirements", group: "fixedAssets", title: "إضافات واستبعادات الأصول", source: "fixedAssets", status: "catalog" },
  { id: "bank-reconciliation", group: "cashManagement", title: "تقارير التسوية البنكية", source: "bankTransactions", status: "catalog" },
  { id: "cash-movement", group: "cashManagement", title: "حركة النقدية والتدفقات النقدية", source: "journalEntries/journalLines", status: "live" },
];

export function getOracleReportCatalog(group?: OracleReportGroup) { return group ? ORACLE_REPORT_CATALOG.filter(report => report.group === group) : ORACLE_REPORT_CATALOG; }

export type SkyModuleGroup = "finance" | "hrms" | "scm" | "sales" | "inventory" | "pos" | "admin";
export type SkyModuleStatus = "live" | "partial" | "catalog";
export type SkyModuleReportDefinition = { id: string; module: string; group: SkyModuleGroup; title: string; status: SkyModuleStatus; source: string; note: string };
export const SKY_MODULE_REPORT_CATALOG: SkyModuleReportDefinition[] = [
  { id: "gl-trial-balance", module: "GL", group: "finance", title: "ميزان المراجعة", status: "live", source: "accounts/journalEntries/journalLines", note: "حسابات حية من القيود المرحّلة" },
  { id: "gl-statements", module: "GL", group: "finance", title: "قائمة الدخل والميزانية العمومية", status: "live", source: "accounts/journalLines", note: "تقارير مالية تفصيلية حسب الفترة" },
  { id: "gl-periods", module: "GL", group: "finance", title: "إدارة الفترات والسنوات المالية", status: "catalog", source: "financialPeriods", note: "يحتاج جدول فترات مالية مستقل" },
  { id: "gl-allocations", module: "GL", group: "finance", title: "التخصيصات ومراكز التكلفة", status: "catalog", source: "costCenters/allocations", note: "يحتاج مراكز تكلفة وقواعد توزيع" },
  { id: "ap-suppliers", module: "AP", group: "finance", title: "دليل الموردين وكشوفهم", status: "partial", source: "parties/invoices/partyPayments", note: "البيانات الأساسية وكشف الحساب متاحان" },
  { id: "ap-payments", module: "AP", group: "finance", title: "سجل المدفوعات والالتزامات", status: "partial", source: "partyPayments/invoices", note: "التسويات متاحة وتفاصيل البنوك تحتاج CM" },
  { id: "ap-matching", module: "AP", group: "finance", title: "مطابقة الفاتورة مع أمر الشراء والاستلام", status: "catalog", source: "purchaseOrders/receipts", note: "يحتاج موديول Purchasing" },
  { id: "ar-customers", module: "AR", group: "finance", title: "دليل العملاء وكشوفهم", status: "partial", source: "parties/invoices/partyPayments", note: "الفواتير والتحصيلات وكشف الحساب متاحة" },
  { id: "ar-collections", module: "AR", group: "finance", title: "التحصيلات وأعمار الذمم", status: "live", source: "parties/invoices/partyPayments", note: "فلاتر العملاء والموردين متاحة" },
  { id: "fa-register", module: "FA", group: "finance", title: "سجل الأصول والإهلاك", status: "catalog", source: "fixedAssets/depreciation", note: "يحتاج دورة أصول ثابتة مستقلة" },
  { id: "cm-reconciliation", module: "CM", group: "finance", title: "الحسابات البنكية والتسوية البنكية", status: "catalog", source: "banks/bankTransactions/reconciliations", note: "يحتاج مصادر حركات بنكية" },
  { id: "cm-cash-forecast", module: "CM", group: "finance", title: "التنبؤ بالتدفقات والسيولة", status: "partial", source: "journalEntries/invoices", note: "تحليل التدفق الحالي متاح والتنبؤ المتقدم يحتاج إعدادات" },
  { id: "hr-core", module: "Core HR", group: "hrms", title: "بيانات الموظفين والحضور", status: "partial", source: "employees/attendanceRecords", note: "البيانات الأساسية والحضور متاحان" },
  { id: "hr-organization", module: "Core HR", group: "hrms", title: "الهيكل التنظيمي والعقود والمهارات", status: "catalog", source: "departments/contracts/skills", note: "يحتاج جداول الموارد البشرية الموسعة" },
  { id: "payroll-run", module: "Payroll", group: "hrms", title: "تشغيل الرواتب وتكاليف الموظفين", status: "partial", source: "employees/payrollRuns", note: "التشغيل الشهري الأساسي متاح" },
  { id: "payroll-deductions", module: "Payroll", group: "hrms", title: "الضرائب والتأمينات والقروض", status: "catalog", source: "salaryElements/deductions/loans", note: "يحتاج عناصر راتب قابلة للتهيئة" },
  { id: "self-service", module: "Self-Service", group: "hrms", title: "بوابة الموظف والإجازات وقسائم الراتب", status: "catalog", source: "employeePortal/leaveRequests", note: "يحتاج بوابة موظف مستقلة" },
  { id: "recruitment", module: "Recruitment", group: "hrms", title: "التوظيف والمقابلات والعروض", status: "catalog", source: "vacancies/applications/interviews", note: "يحتاج موديول توظيف" },
  { id: "purchasing", module: "Purchasing", group: "scm", title: "طلبات وأوامر الشراء والاستلام", status: "catalog", source: "requisitions/purchaseOrders/receipts", note: "يحتاج دورة مشتريات مستقلة" },
  { id: "purchasing-suppliers", module: "Purchasing", group: "scm", title: "تقييم الموردين والأسعار والعقود", status: "catalog", source: "supplierScores/catalogs/contracts", note: "يحتاج بيانات موردين موسعة" },
  { id: "inventory-items", module: "Inventory", group: "inventory", title: "الأصناف والأرصدة والحدود الدنيا", status: "live", source: "products/stockMoves", note: "حركات المخزون والتنبيهات متاحة" },
  { id: "inventory-warehouses", module: "Inventory", group: "inventory", title: "المستودعات والمواقع والتحويلات والجرد", status: "catalog", source: "warehouses/locations/counts", note: "يحتاج هيكل مخازن متعدد" },
  { id: "inventory-valuation", module: "Inventory", group: "inventory", title: "تقييم المخزون والتقادم", status: "catalog", source: "inventoryValuation/aging", note: "يحتاج سياسة تقييم قابلة للتهيئة" },
  { id: "om-orders", module: "Order Management", group: "sales", title: "أوامر البيع والعروض والأسعار", status: "catalog", source: "salesOrders/quotations/priceLists", note: "يحتاج دورة أوامر بيع" },
  { id: "om-shipping", module: "Order Management", group: "sales", title: "الشحن والتسليم والمرتجعات", status: "catalog", source: "shipments/deliveries/returns", note: "يحتاج تكامل الشحن والمخزون" },
  { id: "om-invoices", module: "Order Management", group: "sales", title: "فواتير المبيعات وتحليلها", status: "partial", source: "invoices/invoiceLines/parties", note: "الفوترة والتحليل الأساسي متاحان" },
  { id: "pos-sales", module: "POS", group: "pos", title: "مبيعات نقاط البيع وإغلاق الورديات", status: "live", source: "invoices/cashDrawerSessions", note: "السلة والدفع ودرج النقدية متاحة" },
  { id: "admin-access", module: "Administration", group: "admin", title: "المستخدمون وقوالب الصلاحيات", status: "live", source: "users/permissionTemplate", note: "صلاحيات الأقسام مطبقة على الإجراءات المحمية" },
  { id: "admin-workflow", module: "Administration", group: "admin", title: "الدورة المستندية والمرفقات", status: "partial", source: "attachments/invoices/journalEntries", note: "المرفقات والدورة الأساسية متاحة" },
];

export function getSkyModuleReportCatalog(group?: SkyModuleGroup) { return group ? SKY_MODULE_REPORT_CATALOG.filter(report => report.group === group) : SKY_MODULE_REPORT_CATALOG; }

export async function listCurrencies() { const db = await getDb(); return db ? db.select().from(currencies).where(eq(currencies.isActive, true)).orderBy(desc(currencies.isBase), currencies.code) : []; }
export async function updateCurrency(input: { code: string; exchangeRate: string }) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); return db.update(currencies).set({ exchangeRate: input.exchangeRate }).where(eq(currencies.code, input.code)); }
export async function importMasterRows(input: { accounts?: Array<{ code: string; name: string; category: "asset" | "liability" | "equity" | "revenue" | "expense"; openingBalance?: number }>; parties?: Array<{ type: "customer" | "supplier"; name: string; phone?: string; email?: string; taxNumber?: string; openingBalance?: number; creditLimit?: number; currencyCode?: string }> }) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); let accountsImported = 0; let partiesImported = 0; const errors: Array<{ row: number; field: string; message: string }> = []; await db.transaction(async tx => { for (const { index, row } of (input.accounts ?? []).map((row, index) => ({ row, index }))) { if (!row.code.trim() || !row.name.trim()) { errors.push({ row: index + 2, field: "code/name", message: "كود الحساب واسم الحساب مطلوبان" }); continue; } if (!Number.isFinite(Number(row.openingBalance ?? 0))) { errors.push({ row: index + 2, field: "openingBalance", message: "الرصيد الافتتاحي غير صالح" }); continue; } try { const duplicate = await tx.select({ id: accounts.id }).from(accounts).where(eq(accounts.code, row.code.trim())).limit(1); if (duplicate.length) { errors.push({ row: index + 2, field: "code", message: `كود الحساب ${row.code} موجود مسبقاً` }); continue; } await tx.insert(accounts).values({ code: row.code.trim(), name: row.name.trim(), category: row.category, openingBalance: Number(row.openingBalance ?? 0).toFixed(2) }); accountsImported++; } catch { errors.push({ row: index + 2, field: "code", message: `تعذر استيراد الحساب ${row.code}` }); } } for (const { index, row } of (input.parties ?? []).map((row, index) => ({ row, index }))) { if (!row.name.trim()) { errors.push({ row: index + 2, field: "name", message: "اسم العميل أو المورد مطلوب" }); continue; } const duplicateParty = await tx.select({ id: parties.id }).from(parties).where(and(eq(parties.type, row.type), eq(parties.name, row.name.trim()))).limit(1); if (duplicateParty.length) { errors.push({ row: index + 2, field: "name", message: `السجل ${row.name} موجود مسبقاً لهذا النوع` }); continue; } await tx.insert(parties).values({ type: row.type, name: row.name.trim(), phone: row.phone, email: row.email, taxNumber: row.taxNumber, openingBalance: Number(row.openingBalance ?? 0).toFixed(2), creditLimit: Number(row.creditLimit ?? 0).toFixed(2), currencyCode: row.currencyCode ?? "EGP" }); partiesImported++; } }); return { accountsImported, partiesImported, errors }; }

export async function listAccounts() { const db = await getDb(); return db ? db.select().from(accounts).orderBy(accounts.code) : []; }
export async function listParties(type?: "customer" | "supplier") { const db = await getDb(); return db ? db.select().from(parties).where(type ? eq(parties.type, type) : undefined).orderBy(desc(parties.createdAt)) : []; }
export async function listProducts() { const db = await getDb(); return db ? db.select().from(products).where(eq(products.isActive, true)).orderBy(desc(products.createdAt)) : []; }
export async function listInvoices(type?: "sale" | "purchase") { const db = await getDb(); return db ? db.select().from(invoices).where(type ? eq(invoices.type, type) : undefined).orderBy(desc(invoices.invoiceDate)) : []; }
export async function listEmployees() { const db = await getDb(); return db ? db.select().from(employees).where(eq(employees.isActive, true)).orderBy(desc(employees.id)) : []; }
export async function listNotifications() { const db = await getDb(); return db ? db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(20) : []; }
export async function listJournalEntries() { const db = await getDb(); return db ? db.select().from(journalEntries).orderBy(desc(journalEntries.entryDate)).limit(50) : []; }

export async function createAccount(input: typeof accounts.$inferInsert) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); return db.insert(accounts).values(input); }
export async function updateAccount(input: { id: number; code: string; name: string; category: "asset" | "liability" | "equity" | "revenue" | "expense"; parentId?: number | null }) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); if (input.parentId === input.id) throw new Error("لا يمكن جعل الحساب أباً لنفسه"); const duplicate = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.code, input.code.trim())).limit(1); if (duplicate[0] && duplicate[0].id !== input.id) throw new Error("كود الحساب مستخدم بالفعل"); const critical = new Set(["1000", "2000", "3000", "4000", "5000"]); if (critical.has(input.code.trim()) && input.parentId !== null && input.parentId !== undefined) throw new Error("الحسابات الرئيسية لا يمكن نقلها تحت حساب فرعي"); let cursor = input.parentId ?? null; const visited = new Set<number>(); while (cursor !== null) { if (cursor === input.id || visited.has(cursor)) throw new Error("إعادة الترتيب ستنشئ دورة في شجرة الحسابات"); visited.add(cursor); const parent = await db.select({ parentId: accounts.parentId }).from(accounts).where(eq(accounts.id, cursor)).limit(1); cursor = parent[0]?.parentId ?? null; } return db.update(accounts).set({ code: input.code.trim(), name: input.name.trim(), category: input.category, parentId: input.parentId ?? null }).where(eq(accounts.id, input.id)); }
export async function deactivateAccount(id: number) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); const account = await db.select({ code: accounts.code }).from(accounts).where(eq(accounts.id, id)).limit(1); if (["1000", "2000", "3000", "4000", "5000"].includes(account[0]?.code ?? "")) throw new Error("لا يمكن إيقاف حساب رئيسي محمي للنظام"); const children = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.parentId, id)).limit(1); if (children.length) throw new Error("لا يمكن إيقاف حساب له حسابات فرعية"); const lines = await db.select({ id: journalLines.id }).from(journalLines).where(eq(journalLines.accountId, id)).limit(1); if (lines.length) throw new Error("لا يمكن إيقاف حساب مستخدم في قيود محاسبية"); return db.update(accounts).set({ isActive: false }).where(eq(accounts.id, id)); }
export async function createParty(input: typeof parties.$inferInsert) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); return db.insert(parties).values(input); }
export async function createPartyPayment(input: typeof partyPayments.$inferInsert) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); if (Number(input.amount) <= 0) throw new Error("قيمة التسوية يجب أن تكون أكبر من صفر"); return db.insert(partyPayments).values(input); }
export async function listPartyPayments(partyId?: number) { const db = await getDb(); return db ? (partyId ? db.select().from(partyPayments).where(eq(partyPayments.partyId, partyId)).orderBy(desc(partyPayments.paymentDate)) : db.select().from(partyPayments).orderBy(desc(partyPayments.paymentDate)).limit(200)) : []; }
export async function getPartyStatement(partyId: number) {
  const db = await getDb();
  if (!db) return [];
  const party = await db.select({ openingBalance: parties.openingBalance }).from(parties).where(eq(parties.id, partyId)).limit(1);
  const partyInvoices = await db.select({ invoiceNumber: invoices.invoiceNumber, invoiceDate: invoices.invoiceDate, total: invoices.total, type: invoices.type }).from(invoices).where(eq(invoices.partyId, partyId));
  const settlements = await db.select().from(partyPayments).where(eq(partyPayments.partyId, partyId));
  const rows = [
    { date: new Date(0), kind: "opening", reference: "الرصيد الافتتاحي", debit: Number(party[0]?.openingBalance ?? 0), credit: 0, note: "رصيد افتتاحي" },
    ...partyInvoices.map(invoice => ({ date: invoice.invoiceDate, kind: "invoice", reference: invoice.invoiceNumber, debit: invoice.type === "sale" ? Number(invoice.total) : 0, credit: invoice.type === "purchase" ? Number(invoice.total) : 0, note: `فاتورة ${invoice.type === "sale" ? "مبيعات" : "مشتريات"}` })),
    ...settlements.map(payment => ({ date: payment.paymentDate, kind: "payment", reference: `تسوية #${payment.id}`, debit: 0, credit: Number(payment.amount), note: payment.note ?? `تسوية ${payment.method}` })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());
  let running = 0;
  return rows.map(row => { running += row.debit - row.credit; return { ...row, running }; });
}
export async function listCostCenters() { const db = await getDb(); return db ? db.select().from(costCenters).where(eq(costCenters.isActive, true)).orderBy(costCenters.code) : []; }
export async function createCostCenter(input: typeof costCenters.$inferInsert) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); return db.insert(costCenters).values(input); }
export async function listCostElements() { const db = await getDb(); return db ? db.select().from(costElements).where(eq(costElements.isActive, true)).orderBy(costElements.code) : []; }
export async function createCostElement(input: typeof costElements.$inferInsert) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); return db.insert(costElements).values(input); }
export async function listProductCosts(productId?: number) { const db = await getDb(); if (!db) return []; return db.select().from(productCosts).where(productId ? eq(productCosts.productId, productId) : undefined).orderBy(desc(productCosts.effectiveFrom)); }
export async function createProductCost(input: typeof productCosts.$inferInsert) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); return db.insert(productCosts).values(input); }
export async function listCostAllocations(period?: string) { const db = await getDb(); if (!db) return []; return db.select().from(costAllocations).where(period ? eq(costAllocations.period, period) : undefined).orderBy(desc(costAllocations.createdAt)); }
export async function createCostAllocation(input: typeof costAllocations.$inferInsert) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); return db.insert(costAllocations).values(input); }
export async function getCostingSummary(input: { from?: Date; to?: Date } = {}) {
  const db = await getDb(); if (!db) return { standardCost: 0, actualCost: 0, variance: 0, allocationCount: 0, productCount: 0, byElement: [] };
  const rows = await db.select().from(productCosts);
  const from = input.from?.getTime() ?? -Infinity; const to = input.to?.getTime() ?? Infinity;
  const filtered = rows.filter(row => row.effectiveFrom.getTime() >= from && row.effectiveFrom.getTime() <= to);
  const standardCost = filtered.reduce((sum, row) => sum + Number(row.standardCost), 0);
  const actualCost = filtered.reduce((sum, row) => sum + Number(row.actualCost), 0);
  const byElement = Object.values(filtered.reduce<Record<string, { costElementId: number; standardCost: number; actualCost: number }>>((acc, row) => { const key = String(row.costElementId); acc[key] ??= { costElementId: row.costElementId, standardCost: 0, actualCost: 0 }; acc[key].standardCost += Number(row.standardCost); acc[key].actualCost += Number(row.actualCost); return acc; }, {}));
  return { standardCost, actualCost, variance: actualCost - standardCost, allocationCount: (await db.select().from(costAllocations)).length, productCount: new Set(filtered.map(row => row.productId)).size, byElement };
}

export function classifyProductSku(sku: string): "raw_material" | "semi_finished" | "finished_product" {
  const prefix = sku.trim().charAt(0);
  if (prefix === "1" || prefix === "١") return "raw_material";
  if (prefix === "2" || prefix === "٢") return "semi_finished";
  if (prefix === "3" || prefix === "٣") return "finished_product";
  throw new Error("كود الصنف يجب أن يبدأ بـ 1 مادة خام أو 2 منتج نصف مصنع أو 3 منتج تام");
}
export async function listCostTypes() { const db = await getDb(); return db ? db.select().from(costTypes).where(eq(costTypes.isActive, true)).orderBy(costTypes.code) : []; }
export async function createCostType(input: typeof costTypes.$inferInsert) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); return db.insert(costTypes).values(input); }
export async function listCostingMethods() { const db = await getDb(); return db ? db.select().from(costingMethods).where(eq(costingMethods.isActive, true)).orderBy(costingMethods.code) : []; }
export async function createCostingMethod(input: typeof costingMethods.$inferInsert) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); return db.insert(costingMethods).values(input); }
export async function listBoms(productId?: number) { const db = await getDb(); if (!db) return []; return db.select().from(boms).where(productId ? eq(boms.productId, productId) : undefined).orderBy(desc(boms.createdAt)); }
export async function createBom(input: typeof boms.$inferInsert, lines: Array<typeof bomLines.$inferInsert>) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); const result = await db.insert(boms).values(input); const bomId = Number(result[0].insertId); if (lines.length) await db.insert(bomLines).values(lines.map(line => ({ ...line, bomId }))); return { bomId }; }
export async function listBomLines(bomId: number) { const db = await getDb(); return db ? db.select().from(bomLines).where(eq(bomLines.bomId, bomId)).orderBy(bomLines.sequence) : []; }
export async function listWorkOrders(status?: typeof workOrders.$inferSelect["status"]) { const db = await getDb(); return db ? db.select().from(workOrders).where(status ? eq(workOrders.status, status) : undefined).orderBy(desc(workOrders.createdAt)) : []; }
export async function createWorkOrder(input: typeof workOrders.$inferInsert) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); return db.insert(workOrders).values(input); }
export async function createWorkOrderOperation(input: typeof workOrderOperations.$inferInsert) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); return db.insert(workOrderOperations).values(input); }
export async function listWorkOrderOperations(workOrderId: number) { const db = await getDb(); return db ? db.select().from(workOrderOperations).where(eq(workOrderOperations.workOrderId, workOrderId)).orderBy(workOrderOperations.sequence) : []; }
export async function listCostDistributions(input: { period?: string; productId?: number; costCenterId?: number } = {}) { const db = await getDb(); if (!db) return []; const rows = await db.select().from(costDistributions); return rows.filter(row => (!input.period || row.period === input.period) && (!input.productId || row.productId === input.productId) && (!input.costCenterId || row.costCenterId === input.costCenterId)); }
export async function createCostDistribution(input: typeof costDistributions.$inferInsert) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); return db.insert(costDistributions).values(input); }
export async function getProductCostProfitability(input: { productId?: number; costCenterId?: number; period?: string } = {}) {
  const db = await getDb(); if (!db) return { rows: [], totals: { revenue: 0, cost: 0, profit: 0, margin: 0 } };
  const productRows = await db.select().from(products).where(eq(products.isActive, true));
  const costRows = await db.select().from(costDistributions);
  const invoiceRows = await db.select({ productId: invoiceLines.productId, quantity: invoiceLines.quantity, lineTotal: invoiceLines.lineTotal, invoiceDate: invoices.invoiceDate, type: invoices.type }).from(invoiceLines).innerJoin(invoices, eq(invoiceLines.invoiceId, invoices.id));
  const rows = productRows.filter(product => !input.productId || product.id === input.productId).map(product => { const revenue = invoiceRows.filter(row => row.productId === product.id && row.type === "sale" && (!input.period || row.invoiceDate.toISOString().slice(0, 7) === input.period)).reduce((sum, row) => sum + Number(row.lineTotal), 0); const cost = costRows.filter(row => row.productId === product.id && (!input.period || row.period === input.period) && (!input.costCenterId || row.costCenterId === input.costCenterId)).reduce((sum, row) => sum + Number(row.amount), 0); const profit = revenue - cost; return { productId: product.id, sku: product.sku, name: product.name, productClass: product.productClass, revenue, cost, profit, margin: revenue ? (profit / revenue) * 100 : 0 }; });
  const totals = rows.reduce((acc, row) => ({ revenue: acc.revenue + row.revenue, cost: acc.cost + row.cost, profit: acc.profit + row.profit, margin: 0 }), { revenue: 0, cost: 0, profit: 0, margin: 0 }); totals.margin = totals.revenue ? (totals.profit / totals.revenue) * 100 : 0; return { rows, totals };
}

export async function createProduct(input: typeof products.$inferInsert) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); return db.insert(products).values(input); }
export async function createEmployee(input: typeof employees.$inferInsert) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); return db.insert(employees).values(input); }
export function calculateCreditExposure(openingBalance: number, movements: Array<{ total?: string | number | null; paid?: string | number | null }>) { return Number(openingBalance || 0) + movements.reduce((sum, movement) => sum + Math.max(0, Number(movement.total || 0) - Number(movement.paid || 0)), 0); }

export function calculateInvoiceTotals(lines: Array<{ quantity: number; unitPrice: number; taxRate?: number }>, discount = 0) {
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const tax = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice * Number(line.taxRate ?? 0) / 100, 0);
  return { subtotal, tax, total: Math.max(0, subtotal - discount + tax) };
}

export function calculateStockDelta(type: "in" | "out", quantity: number) {
  return type === "out" ? -Math.abs(quantity) : Math.abs(quantity);
}

export function calculatePayrollTotal(salaries: Array<string | number>) {
  return salaries.reduce((sum, salary) => Number(sum) + Number(salary || 0), 0);
}

export function canManageSensitiveSettings(role: "user" | "accountant" | "admin") {
  return role === "admin";
}

export function validateBalancedEntry(lines: Array<{ debit?: string | number | null; credit?: string | number | null }>) {
  const debit = lines.reduce((sum, line) => sum + Number(line.debit ?? 0), 0);
  const credit = lines.reduce((sum, line) => sum + Number(line.credit ?? 0), 0);
  if (Math.abs(debit - credit) > 0.005) throw new Error("يجب أن يتساوى إجمالي المدين مع إجمالي الدائن");
  return { debit, credit, balanced: true };
}

export async function notifyCreditLimitIfBreached(input: { name: string; invoiceNumber: string; openingBalance: number; creditLimit: number; movements: Array<{ total?: string | number | null; paid?: string | number | null }>; notify?: (payload: { title: string; content: string }) => unknown }) { const exposure = calculateCreditExposure(input.openingBalance, input.movements); if (input.creditLimit > 0 && exposure > input.creditLimit) { await input.notify?.({ title: "تجاوز حد ائتمان العميل", content: `تجاوز ${input.name} حد الائتمان بإجمالي تعرض ${exposure.toFixed(2)} بعد الفاتورة ${input.invoiceNumber}.` }); return true; } return false; }

export async function createInvoice(invoice: typeof invoices.$inferInsert, lines: Array<Omit<typeof invoiceLines.$inferInsert, "invoiceId">>) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); const id = await db.transaction(async tx => { const result = await tx.insert(invoices).values(invoice); const createdId = Number(result[0].insertId); if (lines.length) await tx.insert(invoiceLines).values(lines.map(line => ({ ...line, invoiceId: createdId }))); return createdId; }); if (Number(invoice.paid ?? 0) < Number(invoice.total ?? 0)) void notifyOwner({ title: "فاتورة مستحقة", content: `تم إصدار الفاتورة ${invoice.invoiceNumber} بإجمالي ${invoice.total} وتحتاج إلى متابعة التحصيل.` }); if (invoice.type === "sale" && invoice.partyId) { const [party] = await db.select({ name: parties.name, creditLimit: parties.creditLimit, openingBalance: parties.openingBalance }).from(parties).where(eq(parties.id, Number(invoice.partyId))).limit(1); if (party && Number(party.creditLimit) > 0) { const exposureRows = await db.select({ total: invoices.total, paid: invoices.paid }).from(invoices).where(and(eq(invoices.partyId, Number(invoice.partyId)), eq(invoices.type, "sale"))); void notifyCreditLimitIfBreached({ name: party.name, invoiceNumber: String(invoice.invoiceNumber), openingBalance: Number(party.openingBalance), creditLimit: Number(party.creditLimit), movements: exposureRows, notify: notifyOwner }); } } return id; }
export async function createStockMove(input: typeof stockMoves.$inferInsert) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); const result = await db.transaction(async tx => { await tx.insert(stockMoves).values(input); const delta = calculateStockDelta(input.type === "out" ? "out" : "in", Number(input.quantity)); await tx.update(products).set({ quantity: sql`quantity + ${delta}` }).where(eq(products.id, input.productId)); return true; }); const [product] = await db.select({ name: products.name, quantity: products.quantity, minQuantity: products.minQuantity }).from(products).where(eq(products.id, input.productId)).limit(1); if (product && Number(product.quantity) < Number(product.minQuantity)) void notifyOwner({ title: "تنبيه انخفاض المخزون", content: `الصنف ${product.name} أصبح عند كمية ${product.quantity} وهي أقل من الحد الأدنى ${product.minQuantity}.` }); return result; }
export async function listAttendance() { const db = await getDb(); return db ? db.select().from(attendanceRecords).orderBy(desc(attendanceRecords.attendanceDate)).limit(100) : []; }
export async function createAttendance(input: typeof attendanceRecords.$inferInsert) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); return db.insert(attendanceRecords).values(input); }
export async function listCashDrawerSessions() { const db = await getDb(); return db ? db.select().from(cashDrawerSessions).orderBy(desc(cashDrawerSessions.openedAt)).limit(50) : []; }
export async function openCashDrawer(input: { openingAmount: string; notes?: string }) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); const open = await db.select({ id: cashDrawerSessions.id }).from(cashDrawerSessions).where(eq(cashDrawerSessions.status, "open")).limit(1); if (open.length) throw new Error("يوجد درج نقدي مفتوح بالفعل"); return db.insert(cashDrawerSessions).values({ openingAmount: input.openingAmount, notes: input.notes, status: "open" }); }
export async function closeCashDrawer(input: { id: number; closingAmount: string; notes?: string }) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); return db.update(cashDrawerSessions).set({ closingAmount: input.closingAmount, notes: input.notes, closedAt: new Date(), status: "closed" }).where(and(eq(cashDrawerSessions.id, input.id), eq(cashDrawerSessions.status, "open"))); }

export async function createPayrollRun(input: { period: string }) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); const active = await db.select({ id: employees.id, salary: employees.baseSalary }).from(employees).where(eq(employees.isActive, true)); const total = calculatePayrollTotal(active.map(employee => employee.salary)); return db.insert(payrollRuns).values({ period: input.period, employeeCount: active.length, totalAmount: Number(total).toFixed(2), status: "processed" }); }
export async function saveAttachment(input: { entityType: string; entityId: number; fileName: string; mimeType?: string; data: string }) { const buffer = Buffer.from(input.data, "base64"); const uploaded = await storagePut(`attachments/${input.entityType}/${input.fileName}`, buffer, input.mimeType ?? "application/octet-stream"); const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); await db.insert(attachments).values({ entityType: input.entityType, entityId: input.entityId, fileName: input.fileName, fileKey: uploaded.key, url: uploaded.url, mimeType: input.mimeType }); return uploaded; }

export async function createJournalEntry(entry: typeof journalEntries.$inferInsert, lines: Array<Omit<typeof journalLines.$inferInsert, "journalEntryId">>) {
  const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة");
  validateBalancedEntry(lines);
  return db.transaction(async tx => { const result = await tx.insert(journalEntries).values(entry); const id = Number(result[0].insertId); await tx.insert(journalLines).values(lines.map(line => ({ ...line, journalEntryId: id }))); return id; });
}

export type DetailedReportRow = { accountCode: string; accountName: string; category: string; debit: number; credit: number; balance: number };
export function calculateDetailedReportSections(trialBalance: DetailedReportRow[], ledger: Array<{ date: Date; description: string; accountCode: string; accountName: string; debit: number; credit: number }>, invoiceRows: Array<{ invoiceDate: Date; tax: string | number; type: "sale" | "purchase"; total: string | number }>) {
  const revenue = trialBalance.filter(row => row.category === "revenue").reduce((sum, row) => sum + (row.credit - row.debit), 0);
  const expenses = trialBalance.filter(row => row.category === "expense").reduce((sum, row) => sum + (row.debit - row.credit), 0);
  const assets = trialBalance.filter(row => row.category === "asset").reduce((sum, row) => sum + row.balance, 0);
  const liabilities = trialBalance.filter(row => row.category === "liability").reduce((sum, row) => sum - row.balance, 0);
  const equity = trialBalance.filter(row => row.category === "equity").reduce((sum, row) => sum - row.balance, 0);
  const revenueLines = trialBalance.filter(row => row.category === "revenue").map(row => ({ accountCode: row.accountCode, accountName: row.accountName, amount: row.credit - row.debit }));
  const expenseLines = trialBalance.filter(row => row.category === "expense").map(row => ({ accountCode: row.accountCode, accountName: row.accountName, amount: row.debit - row.credit }));
  const balanceSheet = { assets: trialBalance.filter(row => row.category === "asset"), liabilities: trialBalance.filter(row => row.category === "liability").map(row => ({ ...row, balance: -row.balance })), equity: trialBalance.filter(row => row.category === "equity").map(row => ({ ...row, balance: -row.balance })), totals: { assets, liabilities, equity } };
  const cashFlowMovements = ledger.filter(row => /نقد|بنك|صندوق|cash|bank/i.test(row.accountName)).map(row => ({ ...row, net: row.debit - row.credit }));
  const inflow = cashFlowMovements.filter(row => row.net > 0).reduce((sum, row) => sum + row.net, 0);
  const outflow = cashFlowMovements.filter(row => row.net < 0).reduce((sum, row) => sum + Math.abs(row.net), 0);
  const salesInvoices = invoiceRows.filter(invoice => invoice.type === "sale");
  const purchaseInvoices = invoiceRows.filter(invoice => invoice.type === "purchase");
  const salesTax = salesInvoices.reduce((sum, invoice) => sum + Number(invoice.tax), 0);
  const purchaseTax = purchaseInvoices.reduce((sum, invoice) => sum + Number(invoice.tax), 0);
  const taxableSales = salesInvoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
  const taxablePurchases = purchaseInvoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
  const taxSummary = { totalTax: salesTax + purchaseTax, salesTax, purchaseTax, netTax: salesTax - purchaseTax, taxableSales, taxablePurchases, invoiceCount: invoiceRows.length, byType: [{ type: "sale", invoiceCount: salesInvoices.length, tax: salesTax, taxableAmount: taxableSales }, { type: "purchase", invoiceCount: purchaseInvoices.length, tax: purchaseTax, taxableAmount: taxablePurchases }] };
  return { incomeStatement: { revenue, expenses, netIncome: revenue - expenses, revenueLines, expenseLines }, balanceSheet, cashFlow: { inflow, outflow, net: inflow - outflow, movements: cashFlowMovements }, taxSummary };
}

export async function getFinancialReports(input: { from?: Date; to?: Date }) {
  const db = await getDb();
  if (!db) return { trialBalance: [], incomeStatement: { revenue: 0, expenses: 0, netIncome: 0 }, balanceSheet: { assets: 0, liabilities: 0, equity: 0 }, generalLedger: [], cashFlow: { inflow: 0, outflow: 0, net: 0 }, taxSummary: { totalTax: 0, salesTax: 0, purchaseTax: 0, netTax: 0, taxableSales: 0, taxablePurchases: 0, invoiceCount: 0, byType: [] } };
  const entries = await db.select({ id: journalEntries.id, date: journalEntries.entryDate, description: journalEntries.description }).from(journalEntries);
  const lines = await db.select({ journalEntryId: journalLines.journalEntryId, accountId: journalLines.accountId, debit: journalLines.debit, credit: journalLines.credit, accountCode: accounts.code, accountName: accounts.name, category: accounts.category }).from(journalLines).leftJoin(accounts, eq(journalLines.accountId, accounts.id));
  const invoiceRows = await db.select({ invoiceDate: invoices.invoiceDate, tax: invoices.tax, type: invoices.type, total: invoices.total, paid: invoices.paid }).from(invoices);
  const from = input.from?.getTime() ?? -Infinity; const to = input.to?.getTime() ?? Infinity;
  const entryMap = new Map(entries.filter(entry => entry.date.getTime() >= from && entry.date.getTime() <= to).map(entry => [entry.id, entry]));
  const grouped = new Map<number, { accountCode: string; accountName: string; category: string; debit: number; credit: number }>();
  const ledger = [] as Array<{ date: Date; description: string; accountCode: string; accountName: string; debit: number; credit: number }>;
  for (const line of lines) { const entry = entryMap.get(line.journalEntryId); if (!entry) continue; const debit = Number(line.debit); const credit = Number(line.credit); const current = grouped.get(line.accountId) ?? { accountCode: line.accountCode ?? "", accountName: line.accountName ?? "", category: line.category ?? "asset", debit: 0, credit: 0 }; current.debit += debit; current.credit += credit; grouped.set(line.accountId, current); ledger.push({ date: entry.date, description: entry.description, accountCode: current.accountCode, accountName: current.accountName, debit, credit }); }
  const trialBalance = Array.from(grouped.values()).map(row => ({ ...row, balance: row.debit - row.credit }));
  const revenue = trialBalance.filter(row => row.category === "revenue").reduce((sum, row) => sum + (row.credit - row.debit), 0);
  const expenses = trialBalance.filter(row => row.category === "expense").reduce((sum, row) => sum + (row.debit - row.credit), 0);
  const assets = trialBalance.filter(row => row.category === "asset").reduce((sum, row) => sum + row.balance, 0);
  const liabilities = trialBalance.filter(row => row.category === "liability").reduce((sum, row) => sum - row.balance, 0);
  const equity = trialBalance.filter(row => row.category === "equity").reduce((sum, row) => sum - row.balance, 0);
  const generalLedger = ledger.sort((a, b) => a.date.getTime() - b.date.getTime());
  const filteredInvoices = invoiceRows.filter(invoice => invoice.invoiceDate.getTime() >= from && invoice.invoiceDate.getTime() <= to);
  const details = calculateDetailedReportSections(trialBalance, generalLedger, filteredInvoices);
  return { trialBalance, generalLedger, ...details };
}


export type AuditEventInput = {
  actorUserId?: number | null;
  action: string;
  entityType: string;
  entityId?: number | null;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
};

export function serializeAuditValue(value: unknown) {
  if (value === undefined || value === null) return null;
  return JSON.stringify(value, (_key, nested) => typeof nested === "bigint" ? Number(nested) : nested);
}

export async function recordAuditEvent(input: AuditEventInput) {
  const db = await getDb();
  if (!db) return { id: 0, ...input };
  const result = await db.insert(auditLogs).values({
    actorUserId: input.actorUserId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    beforeJson: serializeAuditValue(input.before),
    afterJson: serializeAuditValue(input.after),
    ipAddress: input.ipAddress ?? null,
  });
  return { id: Number(result[0].insertId), ...input };
}

export async function listAuditLogEntries(input: { entityType?: string; actorUserId?: number; limit?: number } = {}) {
  const db = await getDb();
  if (!db) return [];
  const filters = [];
  if (input.entityType) filters.push(eq(auditLogs.entityType, input.entityType));
  if (input.actorUserId) filters.push(eq(auditLogs.actorUserId, input.actorUserId));
  return db.select().from(auditLogs).where(filters.length ? and(...filters) : undefined).orderBy(desc(auditLogs.createdAt)).limit(Math.min(input.limit ?? 200, 500));
}

export async function listOrganizationUnits() {
  const db = await getDb();
  return db ? db.select().from(organizationUnits).where(eq(organizationUnits.isActive, true)).orderBy(organizationUnits.name) : [];
}

export async function listApprovalTemplates(requestType?: string) {
  const db = await getDb();
  if (!db) return [];
  const templates = await db.select().from(approvalTemplates).where(requestType ? and(eq(approvalTemplates.requestType, requestType), eq(approvalTemplates.isActive, true)) : eq(approvalTemplates.isActive, true)).orderBy(approvalTemplates.name);
  const steps = await db.select().from(approvalTemplateSteps).orderBy(approvalTemplateSteps.stepOrder);
  return templates.map(template => ({ ...template, steps: steps.filter(step => step.templateId === template.id) }));
}

export type WorkflowRequestInput = {
  requestType: "purchase" | "leave" | "expense" | "other";
  referenceNumber: string;
  requesterUserId: number;
  organizationUnitId?: number;
  amount?: number;
  payload: Record<string, unknown>;
  templateId?: number;
};

export async function createWorkflowRequest(input: WorkflowRequestInput) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");
  const amount = input.amount ?? 0;
  const templates = await db.select().from(approvalTemplates).where(input.templateId ? eq(approvalTemplates.id, input.templateId) : and(eq(approvalTemplates.requestType, input.requestType), eq(approvalTemplates.isActive, true))).orderBy(approvalTemplates.id).limit(1);
  const template = templates[0];
  const requestResult = await db.insert(workflowRequests).values({
    requestType: input.requestType,
    referenceNumber: input.referenceNumber,
    requesterUserId: input.requesterUserId,
    organizationUnitId: input.organizationUnitId ?? template?.organizationUnitId ?? null,
    amount: amount.toFixed(2),
    payloadJson: JSON.stringify(input.payload),
    status: "pending",
    currentStep: 1,
  });
  const requestId = Number(requestResult[0].insertId);
  const steps = template ? await db.select().from(approvalTemplateSteps).where(eq(approvalTemplateSteps.templateId, template.id)).orderBy(approvalTemplateSteps.stepOrder) : [];
  const applicable = steps.filter(step => amount >= Number(step.minimumAmount));
  if (applicable.length) await db.insert(workflowApprovals).values(applicable.map(step => ({ requestId, stepOrder: step.stepOrder, approverUserId: step.approverUserId ?? null, status: "pending" as const })));
  await recordAuditEvent({ actorUserId: input.requesterUserId, action: "create", entityType: "workflowRequest", entityId: requestId, after: { requestType: input.requestType, referenceNumber: input.referenceNumber, amount } });
  return { id: requestId, status: "pending", currentStep: 1, approvals: applicable };
}

export type ApprovalActor = { id: number; role: "user" | "accountant" | "admin"; department?: string | null; name?: string | null };
export function canApproveStep(actor: ApprovalActor, step: { approverUserId?: number | null; approverRole?: string | null; approverDepartment?: string | null }) {
  if (actor.role === "admin") return true;
  if (step.approverUserId && step.approverUserId === actor.id) return true;
  if (step.approverRole && step.approverRole === actor.role) return true;
  if (step.approverDepartment && step.approverDepartment === actor.department) return true;
  return false;
}

export async function actionWorkflowRequest(input: { requestId: number; actor: ApprovalActor; decision: "approve" | "reject"; comment?: string }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");
  const requests = await db.select().from(workflowRequests).where(eq(workflowRequests.id, input.requestId)).limit(1);
  const request = requests[0];
  if (!request || request.status !== "pending") throw new Error("الطلب غير متاح للموافقة");
  const currentRows = await db.select().from(workflowApprovals).where(and(eq(workflowApprovals.requestId, request.id), eq(workflowApprovals.stepOrder, request.currentStep), eq(workflowApprovals.status, "pending"))).limit(1);
  const current = currentRows[0];
  if (!current) throw new Error("لا توجد خطوة موافقة معلقة");
  const templates = await db.select().from(approvalTemplates).where(and(eq(approvalTemplates.requestType, request.requestType), eq(approvalTemplates.isActive, true))).limit(1);
  const stepRows = templates[0] ? await db.select().from(approvalTemplateSteps).where(and(eq(approvalTemplateSteps.templateId, templates[0].id), eq(approvalTemplateSteps.stepOrder, current.stepOrder))).limit(1) : [];
  const step = stepRows[0];
  if (!canApproveStep(input.actor, { ...current, ...(step ?? {}) })) throw new Error("لا تملك صلاحية اعتماد هذا الطلب");
  const now = new Date();
  await db.update(workflowApprovals).set({ status: input.decision === "approve" ? "approved" : "rejected", comment: input.comment, approverUserId: input.actor.id, actionedAt: now }).where(eq(workflowApprovals.id, current.id));
  let next: typeof current | undefined;
  if (input.decision === "approve") {
    const pendingRows = await db.select().from(workflowApprovals).where(and(eq(workflowApprovals.requestId, request.id), eq(workflowApprovals.status, "pending"))).orderBy(workflowApprovals.stepOrder).limit(1);
    next = pendingRows[0];
  }
  const status = input.decision === "reject" ? "rejected" : next ? "pending" : "approved";
  await db.update(workflowRequests).set({ status, currentStep: next?.stepOrder ?? request.currentStep, updatedAt: now }).where(eq(workflowRequests.id, request.id));
  await recordAuditEvent({ actorUserId: input.actor.id, action: input.decision, entityType: "workflowRequest", entityId: request.id, before: { status: request.status, currentStep: request.currentStep }, after: { status, currentStep: next?.stepOrder ?? request.currentStep, comment: input.comment } });
  return { requestId: request.id, status, currentStep: next?.stepOrder ?? request.currentStep };
}


export async function listWorkflowRequests(input: { requestType?: string; status?: "pending" | "approved" | "rejected" | "cancelled" } = {}) {
  const db = await getDb();
  if (!db) return [];
  const filters = [];
  if (input.requestType) filters.push(eq(workflowRequests.requestType, input.requestType));
  if (input.status) filters.push(eq(workflowRequests.status, input.status));
  return db.select().from(workflowRequests).where(filters.length ? and(...filters) : undefined).orderBy(desc(workflowRequests.createdAt)).limit(200);
}


export async function createOrganizationUnit(input: { name: string; code: string; parentId?: number | null }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");
  const result = await db.insert(organizationUnits).values({ name: input.name.trim(), code: input.code.trim(), parentId: input.parentId ?? null, isActive: true });
  return { id: Number(result[0].insertId), ...input };
}

export async function updateOrganizationUnit(input: { id: number; name: string; code?: string; parentId?: number | null; isActive?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");
  await db.update(organizationUnits).set({ name: input.name.trim(), ...(input.code ? { code: input.code.trim() } : {}), parentId: input.parentId ?? null, isActive: input.isActive ?? true }).where(eq(organizationUnits.id, input.id));
  return { success: true };
}

export async function listMonthlyClosings() {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");
  return db.select().from(monthlyClosings).orderBy(desc(monthlyClosings.period));
}
export async function upsertMonthlyClosing(period: string) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");
  const existing = await db.select().from(monthlyClosings).where(eq(monthlyClosings.period, period)).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(monthlyClosings).values({ period, status: "open", trialBalanceDifference: "0" });
  const created = await db.select().from(monthlyClosings).where(eq(monthlyClosings.period, period)).limit(1);
  return created[0];
}
export async function closeMonthlyPeriod(input: { period: string; userId: number; trialBalanceDifference: number; validationNote?: string }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");
  if (Math.abs(input.trialBalanceDifference) > 0.01) throw new Error("لا يمكن إقفال الفترة قبل توازن ميزان المراجعة");
  await upsertMonthlyClosing(input.period);
  await db.update(monthlyClosings).set({ status: "closed", closedBy: input.userId, closedAt: new Date(), trialBalanceDifference: input.trialBalanceDifference.toFixed(2), validationNote: input.validationNote ?? "تم اجتياز فحص التوازن" }).where(eq(monthlyClosings.period, input.period));
  const rows = await db.select().from(monthlyClosings).where(eq(monthlyClosings.period, input.period)).limit(1);
  return rows[0];
}
export async function reopenMonthlyPeriod(input: { period: string; userId: number; note?: string }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");
  await upsertMonthlyClosing(input.period);
  await db.update(monthlyClosings).set({ status: "reopened", reopenedBy: input.userId, reopenedAt: new Date(), validationNote: input.note ?? "تمت إعادة فتح الفترة للمراجعة" }).where(eq(monthlyClosings.period, input.period));
  const rows = await db.select().from(monthlyClosings).where(eq(monthlyClosings.period, input.period)).limit(1);
  return rows[0];
}
export async function createApprovalTemplate(input: { requestType: "purchase" | "leave" | "expense" | "other"; name: string; organizationUnitId?: number | null; steps: Array<{ stepOrder: number; approverRole?: string; approverUserId?: number; approverDepartment?: string; minimumAmount?: number }> }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");
  const templateResult = await db.insert(approvalTemplates).values({ requestType: input.requestType, name: input.name.trim(), organizationUnitId: input.organizationUnitId ?? null, isActive: true });
  const templateId = Number(templateResult[0].insertId);
  const steps = input.steps.filter(step => step.stepOrder > 0).map(step => ({ templateId, stepOrder: step.stepOrder, approverRole: step.approverRole || null, approverUserId: step.approverUserId ?? null, approverDepartment: step.approverDepartment || null, minimumAmount: Number(step.minimumAmount ?? 0).toFixed(2) }));
  if (steps.length) await db.insert(approvalTemplateSteps).values(steps);
  return { id: templateId, steps };
}

export async function updateApprovalTemplate(input: { id: number; name: string; organizationUnitId?: number | null; isActive?: boolean; steps: Array<{ stepOrder: number; approverRole?: string; approverUserId?: number; approverDepartment?: string; minimumAmount?: number }> }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");
  await db.update(approvalTemplates).set({ name: input.name.trim(), organizationUnitId: input.organizationUnitId ?? null, isActive: input.isActive ?? true }).where(eq(approvalTemplates.id, input.id));
  await db.delete(approvalTemplateSteps).where(eq(approvalTemplateSteps.templateId, input.id));
  const steps = input.steps.filter(step => step.stepOrder > 0).map(step => ({ templateId: input.id, stepOrder: step.stepOrder, approverRole: step.approverRole || null, approverUserId: step.approverUserId ?? null, approverDepartment: step.approverDepartment || null, minimumAmount: Number(step.minimumAmount ?? 0).toFixed(2) }));
  if (steps.length) await db.insert(approvalTemplateSteps).values(steps);
  return { success: true };
}
