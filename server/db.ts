import { and, desc, eq, lt, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { ENV } from "./_core/env";
import { InsertUser, users, accounts, parties, products, invoices, invoiceLines, employees, payrollRuns, notifications, attachments, stockMoves, journalEntries, journalLines } from "../drizzle/schema";
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

export async function listAccounts() { const db = await getDb(); return db ? db.select().from(accounts).orderBy(accounts.code) : []; }
export async function listParties(type?: "customer" | "supplier") { const db = await getDb(); return db ? db.select().from(parties).where(type ? eq(parties.type, type) : undefined).orderBy(desc(parties.createdAt)) : []; }
export async function listProducts() { const db = await getDb(); return db ? db.select().from(products).where(eq(products.isActive, true)).orderBy(desc(products.createdAt)) : []; }
export async function listInvoices(type?: "sale" | "purchase") { const db = await getDb(); return db ? db.select().from(invoices).where(type ? eq(invoices.type, type) : undefined).orderBy(desc(invoices.invoiceDate)) : []; }
export async function listEmployees() { const db = await getDb(); return db ? db.select().from(employees).where(eq(employees.isActive, true)).orderBy(desc(employees.id)) : []; }
export async function listNotifications() { const db = await getDb(); return db ? db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(20) : []; }
export async function listJournalEntries() { const db = await getDb(); return db ? db.select().from(journalEntries).orderBy(desc(journalEntries.entryDate)).limit(50) : []; }

export async function createAccount(input: typeof accounts.$inferInsert) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); return db.insert(accounts).values(input); }
export async function createParty(input: typeof parties.$inferInsert) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); return db.insert(parties).values(input); }
export async function createProduct(input: typeof products.$inferInsert) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); return db.insert(products).values(input); }
export async function createEmployee(input: typeof employees.$inferInsert) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); return db.insert(employees).values(input); }
export function validateBalancedEntry(lines: Array<{ debit?: string | number | null; credit?: string | number | null }>) {
  const debit = lines.reduce((sum, line) => sum + Number(line.debit ?? 0), 0);
  const credit = lines.reduce((sum, line) => sum + Number(line.credit ?? 0), 0);
  if (Math.abs(debit - credit) > 0.005) throw new Error("يجب أن يتساوى إجمالي المدين مع إجمالي الدائن");
  return { debit, credit, balanced: true };
}

export async function createInvoice(invoice: typeof invoices.$inferInsert, lines: Array<Omit<typeof invoiceLines.$inferInsert, "invoiceId">>) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); const id = await db.transaction(async tx => { const result = await tx.insert(invoices).values(invoice); const createdId = Number(result[0].insertId); if (lines.length) await tx.insert(invoiceLines).values(lines.map(line => ({ ...line, invoiceId: createdId }))); return createdId; }); if (Number(invoice.paid ?? 0) < Number(invoice.total ?? 0)) void notifyOwner({ title: "فاتورة مستحقة", content: `تم إصدار الفاتورة ${invoice.invoiceNumber} بإجمالي ${invoice.total} وتحتاج إلى متابعة التحصيل.` }); return id; }
export async function createStockMove(input: typeof stockMoves.$inferInsert) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); const result = await db.transaction(async tx => { await tx.insert(stockMoves).values(input); const delta = input.type === "out" ? -Number(input.quantity) : Number(input.quantity); await tx.update(products).set({ quantity: sql`quantity + ${delta}` }).where(eq(products.id, input.productId)); return true; }); const [product] = await db.select({ name: products.name, quantity: products.quantity, minQuantity: products.minQuantity }).from(products).where(eq(products.id, input.productId)).limit(1); if (product && Number(product.quantity) < Number(product.minQuantity)) void notifyOwner({ title: "تنبيه انخفاض المخزون", content: `الصنف ${product.name} أصبح عند كمية ${product.quantity} وهي أقل من الحد الأدنى ${product.minQuantity}.` }); return result; }
export async function createPayrollRun(input: { period: string }) { const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); const active = await db.select({ id: employees.id, salary: employees.baseSalary }).from(employees).where(eq(employees.isActive, true)); const total = active.reduce((sum, employee) => sum + Number(employee.salary), 0); return db.insert(payrollRuns).values({ period: input.period, employeeCount: active.length, totalAmount: total.toFixed(2), status: "processed" }); }
export async function saveAttachment(input: { entityType: string; entityId: number; fileName: string; mimeType?: string; data: string }) { const buffer = Buffer.from(input.data, "base64"); const uploaded = await storagePut(`attachments/${input.entityType}/${input.fileName}`, buffer, input.mimeType ?? "application/octet-stream"); const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة"); await db.insert(attachments).values({ entityType: input.entityType, entityId: input.entityId, fileName: input.fileName, fileKey: uploaded.key, url: uploaded.url, mimeType: input.mimeType }); return uploaded; }

export async function createJournalEntry(entry: typeof journalEntries.$inferInsert, lines: Array<Omit<typeof journalLines.$inferInsert, "journalEntryId">>) {
  const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة");
  validateBalancedEntry(lines);
  return db.transaction(async tx => { const result = await tx.insert(journalEntries).values(entry); const id = Number(result[0].insertId); await tx.insert(journalLines).values(lines.map(line => ({ ...line, journalEntryId: id }))); return id; });
}
