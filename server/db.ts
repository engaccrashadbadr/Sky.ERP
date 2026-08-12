import { and, desc, eq, lt, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { ENV } from "./_core/env";
import { InsertUser, users, accounts, parties, products, invoices, invoiceLines, employees, payrollRuns, notifications, attachments, stockMoves, journalEntries, journalLines, currencies, attendanceRecords, cashDrawerSessions, partyPayments } from "../drizzle/schema";
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

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return rows[0];
}

export async function getDashboardSummary() {
  const db = await getDb();
  if (!db) return { revenue: 0, expenses: 0, profit: 0, receivables: 0, invoiceCount: 0, lowStockCount: 0 };
  const [revenue, expenses, receivables, invoiceCount, lowStock] = await Promise.all([
    db.select({ value: sql<string>`coalesce(sum(${invoices.total}), 0)` }).from(invoices).where(and(eq(invoices.type, "sale"), or(eq(invoices.status, "issued"), eq(invoices.status, "paid"), eq(invoices.status, "partially_paid")))),
    db.select({ value: sql<string>`coalesce(sum(${invoices.total}), 0)` }).from(invoices).where(and(eq(invoices.type, "purchase"), or(eq(invoices.status, "issued"), eq(invoices.status, "paid"), eq(invoices.status, "partially_paid")))),
    db.select({ value: sql<string>`coalesce(sum(${invoices.total} - ${invoices.paid}), 0)` }).from(invoices).where(and(eq(invoices.type, "sale"), or(eq(invoices.status, "issued"), eq(invoices.status, "partially_paid"), eq(invoices.status, "overdue")))),
    db.select({ value: sql<number>`count(*)` }).from(invoices),
    db.select({ value: sql<number>`count(*)` }).from(products).where(and(eq(products.isActive, true), lt(products.quantity, products.minQuantity))),
  ]);
  const r = Number(revenue[0]?.value ?? 0), e = Number(expenses[0]?.value ?? 0);
  return { revenue: r, expenses: e, profit: r - e, receivables: Number(receivables[0]?.value ?? 0), invoiceCount: Number(invoiceCount[0]?.value ?? 0), lowStockCount: Number(lowStock[0]?.value ?? 0) };
}

export async function listCurrencies() { const db = await getDb(); return db ? db.select().from(currencies).where(eq(currencies.isActive, true)).orderBy(desc(currencies.isBase), currencies.code) : []; }
export async function updateCurrency(input: { code: string; exchangeRate: string }) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); return db.update(currencies).set({ exchangeRate: input.exchangeRate }).where(eq(currencies.code, input.code)); }
export async function importMasterRows(input: { accounts?: Array<{ code: string; name: string; category: "asset" | "liability" | "equity" | "revenue" | "expense"; openingBalance?: number }>; parties?: Array<{ type: "customer" | "supplier"; name: string; phone?: string; email?: string; taxNumber?: string; openingBalance?: number; creditLimit?: number; currencyCode?: string }> }) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); let accountsImported = 0; let partiesImported = 0; const errors: Array<{ row: number; field: string; message: string }> = []; await db.transaction(async tx => { for (const { index, row } of (input.accounts ?? []).map((row, index) => ({ row, index }))) { if (!row.code.trim() || !row.name.trim()) { errors.push({ row: index + 2, field: "code/name", message: "كود الحساب واسم الحساب مطلوبان" }); continue; } if (!Number.isFinite(Number(row.openingBalance ?? 0))) { errors.push({ row: index + 2, field: "openingBalance", message: "الرصيد الافتتاحي غير صالح" }); continue; } try { const duplicate = await tx.select({ id: accounts.id }).from(accounts).where(eq(accounts.code, row.code.trim())).limit(1); if (duplicate.length) { errors.push({ row: index + 2, field: "code", message: `كود الحساب ${row.code} موجود مسبقاً` }); continue; } await tx.insert(accounts).values({ code: row.code.trim(), name: row.name.trim(), category: row.category, openingBalance: Number(row.openingBalance ?? 0).toFixed(2) }); accountsImported++; } catch { errors.push({ row: index + 2, field: "code", message: `تعذر استيراد الحساب ${row.code}` }); } } for (const { index, row } of (input.parties ?? []).map((row, index) => ({ row, index }))) { if (!row.name.trim()) { errors.push({ row: index + 2, field: "name", message: "اسم العميل أو المورد مطلوب" }); continue; } const duplicateParty = await tx.select({ id: parties.id }).from(parties).where(and(eq(parties.type, row.type), eq(parties.name, row.name.trim()))).limit(1); if (duplicateParty.length) { errors.push({ row: index + 2, field: "name", message: `السجل ${row.name} موجود مسبقاً لهذا النوع` }); continue; } await tx.insert(parties).values({ type: row.type, name: row.name.trim(), phone: row.phone, email: row.email, taxNumber: row.taxNumber, openingBalance: Number(row.openingBalance ?? 0).toFixed(2), creditLimit: Number(row.creditLimit ?? 0).toFixed(2), currencyCode: row.currencyCode ?? "SAR" }); partiesImported++; } }); return { accountsImported, partiesImported, errors }; }

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
export async function createProduct(input: typeof products.$inferInsert) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); return db.insert(products).values(input); }
export async function createEmployee(input: typeof employees.$inferInsert) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); return db.insert(employees).values(input); }
export function calculateCreditExposure(openingBalance: number, movements: Array<{ total?: string | number | null; paid?: string | number | null }>) { return Number(openingBalance || 0) + movements.reduce((sum, movement) => sum + Math.max(0, Number(movement.total || 0) - Number(movement.paid || 0)), 0); }

export function validateBalancedEntry(lines: Array<{ debit?: string | number | null; credit?: string | number | null }>) {
  const debit = lines.reduce((sum, line) => sum + Number(line.debit ?? 0), 0);
  const credit = lines.reduce((sum, line) => sum + Number(line.credit ?? 0), 0);
  if (Math.abs(debit - credit) > 0.005) throw new Error("يجب أن يتساوى إجمالي المدين مع إجمالي الدائن");
  return { debit, credit, balanced: true };
}

export async function notifyCreditLimitIfBreached(input: { name: string; invoiceNumber: string; openingBalance: number; creditLimit: number; movements: Array<{ total?: string | number | null; paid?: string | number | null }>; notify?: (payload: { title: string; content: string }) => unknown }) { const exposure = calculateCreditExposure(input.openingBalance, input.movements); if (input.creditLimit > 0 && exposure > input.creditLimit) { await input.notify?.({ title: "تجاوز حد ائتمان العميل", content: `تجاوز ${input.name} حد الائتمان بإجمالي تعرض ${exposure.toFixed(2)} بعد الفاتورة ${input.invoiceNumber}.` }); return true; } return false; }

export async function createInvoice(invoice: typeof invoices.$inferInsert, lines: Array<Omit<typeof invoiceLines.$inferInsert, "invoiceId">>) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); const id = await db.transaction(async tx => { const result = await tx.insert(invoices).values(invoice); const createdId = Number(result[0].insertId); if (lines.length) await tx.insert(invoiceLines).values(lines.map(line => ({ ...line, invoiceId: createdId }))); return createdId; }); if (Number(invoice.paid ?? 0) < Number(invoice.total ?? 0)) void notifyOwner({ title: "فاتورة مستحقة", content: `تم إصدار الفاتورة ${invoice.invoiceNumber} بإجمالي ${invoice.total} وتحتاج إلى متابعة التحصيل.` }); if (invoice.type === "sale" && invoice.partyId) { const [party] = await db.select({ name: parties.name, creditLimit: parties.creditLimit, openingBalance: parties.openingBalance }).from(parties).where(eq(parties.id, Number(invoice.partyId))).limit(1); if (party && Number(party.creditLimit) > 0) { const exposureRows = await db.select({ total: invoices.total, paid: invoices.paid }).from(invoices).where(and(eq(invoices.partyId, Number(invoice.partyId)), eq(invoices.type, "sale"))); void notifyCreditLimitIfBreached({ name: party.name, invoiceNumber: String(invoice.invoiceNumber), openingBalance: Number(party.openingBalance), creditLimit: Number(party.creditLimit), movements: exposureRows, notify: notifyOwner }); } } return id; }
export async function createStockMove(input: typeof stockMoves.$inferInsert) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); const result = await db.transaction(async tx => { await tx.insert(stockMoves).values(input); const delta = input.type === "out" ? -Number(input.quantity) : Number(input.quantity); await tx.update(products).set({ quantity: sql`quantity + ${delta}` }).where(eq(products.id, input.productId)); return true; }); const [product] = await db.select({ name: products.name, quantity: products.quantity, minQuantity: products.minQuantity }).from(products).where(eq(products.id, input.productId)).limit(1); if (product && Number(product.quantity) < Number(product.minQuantity)) void notifyOwner({ title: "تنبيه انخفاض المخزون", content: `الصنف ${product.name} أصبح عند كمية ${product.quantity} وهي أقل من الحد الأدنى ${product.minQuantity}.` }); return result; }
export async function listAttendance() { const db = await getDb(); return db ? db.select().from(attendanceRecords).orderBy(desc(attendanceRecords.attendanceDate)).limit(100) : []; }
export async function createAttendance(input: typeof attendanceRecords.$inferInsert) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); return db.insert(attendanceRecords).values(input); }
export async function listCashDrawerSessions() { const db = await getDb(); return db ? db.select().from(cashDrawerSessions).orderBy(desc(cashDrawerSessions.openedAt)).limit(50) : []; }
export async function openCashDrawer(input: { openingAmount: string; notes?: string }) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); const open = await db.select({ id: cashDrawerSessions.id }).from(cashDrawerSessions).where(eq(cashDrawerSessions.status, "open")).limit(1); if (open.length) throw new Error("يوجد درج نقدي مفتوح بالفعل"); return db.insert(cashDrawerSessions).values({ openingAmount: input.openingAmount, notes: input.notes, status: "open" }); }
export async function closeCashDrawer(input: { id: number; closingAmount: string; notes?: string }) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); return db.update(cashDrawerSessions).set({ closingAmount: input.closingAmount, notes: input.notes, closedAt: new Date(), status: "closed" }).where(and(eq(cashDrawerSessions.id, input.id), eq(cashDrawerSessions.status, "open"))); }

export async function createPayrollRun(input: { period: string }) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); const active = await db.select({ id: employees.id, salary: employees.baseSalary }).from(employees).where(eq(employees.isActive, true)); const total = active.reduce((sum, employee) => sum + Number(employee.salary), 0); return db.insert(payrollRuns).values({ period: input.period, employeeCount: active.length, totalAmount: total.toFixed(2), status: "processed" }); }
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
