import { boolean, decimal, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "accountant", "admin"]).default("user").notNull(),
  department: varchar("department", { length: 120 }),
  permissionTemplate: varchar("permissionTemplate", { length: 120 }).default("تشغيل عام").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const currencies = mysqlTable("currencies", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 3 }).notNull().unique(),
  name: varchar("name", { length: 80 }).notNull(),
  symbol: varchar("symbol", { length: 8 }).notNull(),
  exchangeRate: decimal("exchangeRate", { precision: 18, scale: 6 }).default("1").notNull(),
  isBase: boolean("isBase").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const accounts = mysqlTable("accounts", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  category: mysqlEnum("category", ["asset", "liability", "equity", "revenue", "expense"]).notNull(),
  parentId: int("parentId"),
  isActive: boolean("isActive").default(true).notNull(),
  openingBalance: decimal("openingBalance", { precision: 18, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const journalEntries = mysqlTable("journalEntries", {
  id: int("id").autoincrement().primaryKey(),
  entryNumber: varchar("entryNumber", { length: 32 }).notNull().unique(),
  entryDate: timestamp("entryDate").notNull(),
  description: text("description").notNull(),
  currencyCode: varchar("currencyCode", { length: 3 }).default("EGP").notNull(),
  exchangeRate: decimal("exchangeRate", { precision: 18, scale: 6 }).default("1").notNull(),
  status: mysqlEnum("status", ["draft", "posted"]).default("draft").notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const journalLines = mysqlTable("journalLines", {
  id: int("id").autoincrement().primaryKey(),
  journalEntryId: int("journalEntryId").notNull(),
  accountId: int("accountId").notNull(),
  debit: decimal("debit", { precision: 18, scale: 2 }).default("0").notNull(),
  credit: decimal("credit", { precision: 18, scale: 2 }).default("0").notNull(),
  note: text("note"),
});

export const parties = mysqlTable("parties", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["customer", "supplier"]).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 320 }),
  taxNumber: varchar("taxNumber", { length: 80 }),
  creditLimit: decimal("creditLimit", { precision: 18, scale: 2 }).default("0").notNull(),
  openingBalance: decimal("openingBalance", { precision: 18, scale: 2 }).default("0").notNull(),
  currencyCode: varchar("currencyCode", { length: 3 }).default("EGP").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  sku: varchar("sku", { length: 64 }).notNull().unique(),
  barcode: varchar("barcode", { length: 80 }),
  name: varchar("name", { length: 180 }).notNull(),
  unit: varchar("unit", { length: 32 }).default("قطعة").notNull(),
  salePrice: decimal("salePrice", { precision: 18, scale: 2 }).default("0").notNull(),
  purchasePrice: decimal("purchasePrice", { precision: 18, scale: 2 }).default("0").notNull(),
  quantity: decimal("quantity", { precision: 18, scale: 3 }).default("0").notNull(),
  minQuantity: decimal("minQuantity", { precision: 18, scale: 3 }).default("0").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  invoiceNumber: varchar("invoiceNumber", { length: 40 }).notNull().unique(),
  type: mysqlEnum("type", ["sale", "purchase"]).notNull(),
  partyId: int("partyId"),
  invoiceDate: timestamp("invoiceDate").notNull(),
  subtotal: decimal("subtotal", { precision: 18, scale: 2 }).default("0").notNull(),
  discount: decimal("discount", { precision: 18, scale: 2 }).default("0").notNull(),
  tax: decimal("tax", { precision: 18, scale: 2 }).default("0").notNull(),
  total: decimal("total", { precision: 18, scale: 2 }).default("0").notNull(),
  paid: decimal("paid", { precision: 18, scale: 2 }).default("0").notNull(),
  status: mysqlEnum("status", ["draft", "issued", "partially_paid", "paid", "overdue"]).default("draft").notNull(),
  notes: text("notes"),
  currencyCode: varchar("currencyCode", { length: 3 }).default("EGP").notNull(),
  exchangeRate: decimal("exchangeRate", { precision: 18, scale: 6 }).default("1").notNull(),
  baseTotal: decimal("baseTotal", { precision: 18, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const partyPayments = mysqlTable("partyPayments", {
  id: int("id").autoincrement().primaryKey(),
  partyId: int("partyId").notNull(),
  invoiceId: int("invoiceId"),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  paymentDate: timestamp("paymentDate").defaultNow().notNull(),
  method: varchar("method", { length: 40 }).default("cash").notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const invoiceLines = mysqlTable("invoiceLines", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  productId: int("productId"),
  description: varchar("description", { length: 240 }).notNull(),
  quantity: decimal("quantity", { precision: 18, scale: 3 }).default("1").notNull(),
  unitPrice: decimal("unitPrice", { precision: 18, scale: 2 }).default("0").notNull(),
  taxRate: decimal("taxRate", { precision: 6, scale: 2 }).default("0").notNull(),
  lineTotal: decimal("lineTotal", { precision: 18, scale: 2 }).default("0").notNull(),
});

export const stockMoves = mysqlTable("stockMoves", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  type: mysqlEnum("type", ["in", "out", "adjustment"]).notNull(),
  quantity: decimal("quantity", { precision: 18, scale: 3 }).notNull(),
  reference: varchar("reference", { length: 80 }),
  movedAt: timestamp("movedAt").defaultNow().notNull(),
});

export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  employeeNumber: varchar("employeeNumber", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  department: varchar("department", { length: 120 }),
  phone: varchar("phone", { length: 40 }),
  baseSalary: decimal("baseSalary", { precision: 18, scale: 2 }).default("0").notNull(),
  hireDate: timestamp("hireDate"),
  isActive: boolean("isActive").default(true).notNull(),
});

export const payrollRuns = mysqlTable("payrollRuns", {
  id: int("id").autoincrement().primaryKey(),
  period: varchar("period", { length: 7 }).notNull(),
  employeeCount: int("employeeCount").default(0).notNull(),
  totalAmount: decimal("totalAmount", { precision: 18, scale: 2 }).default("0").notNull(),
  status: mysqlEnum("status", ["draft", "processed"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const attendanceRecords = mysqlTable("attendanceRecords", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  attendanceDate: timestamp("attendanceDate").notNull(),
  status: mysqlEnum("status", ["present", "absent", "late", "leave"]).notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const cashDrawerSessions = mysqlTable("cashDrawerSessions", {
  id: int("id").autoincrement().primaryKey(),
  openedAt: timestamp("openedAt").defaultNow().notNull(),
  closedAt: timestamp("closedAt"),
  openingAmount: decimal("openingAmount", { precision: 18, scale: 2 }).default("0").notNull(),
  closingAmount: decimal("closingAmount", { precision: 18, scale: 2 }),
  status: mysqlEnum("status", ["open", "closed"]).default("open").notNull(),
  notes: text("notes"),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  kind: mysqlEnum("kind", ["credit_limit", "low_stock", "payment_due", "system"]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const attachments = mysqlTable("attachments", {
  id: int("id").autoincrement().primaryKey(),
  entityType: varchar("entityType", { length: 60 }).notNull(),
  entityId: int("entityId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(),
  url: text("url").notNull(),
  mimeType: varchar("mimeType", { length: 120 }),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type Party = typeof parties.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Employee = typeof employees.$inferSelect;
