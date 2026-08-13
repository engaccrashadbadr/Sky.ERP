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

export const permissionRules = mysqlTable("permissionRules", {
  id: int("id").autoincrement().primaryKey(),
  subjectType: mysqlEnum("subjectType", ["role", "department", "template"]).notNull(),
  subjectValue: varchar("subjectValue", { length: 120 }).notNull(),
  permissionKey: varchar("permissionKey", { length: 100 }).notNull(),
  effect: boolean("effect").default(true).notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
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
  productClass: mysqlEnum("productClass", ["raw_material", "semi_finished", "finished_product"]).default("raw_material").notNull(),
  classificationNote: varchar("classificationNote", { length: 240 }),
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

export const organizationUnits = mysqlTable("organizationUnits", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  parentId: int("parentId"),
  managerUserId: int("managerUserId"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const approvalTemplates = mysqlTable("approvalTemplates", {
  id: int("id").autoincrement().primaryKey(),
  requestType: varchar("requestType", { length: 60 }).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  organizationUnitId: int("organizationUnitId"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const approvalTemplateSteps = mysqlTable("approvalTemplateSteps", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull(),
  stepOrder: int("stepOrder").notNull(),
  approverRole: varchar("approverRole", { length: 80 }),
  approverUserId: int("approverUserId"),
  approverDepartment: varchar("approverDepartment", { length: 120 }),
  minimumAmount: decimal("minimumAmount", { precision: 18, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const workflowRequests = mysqlTable("workflowRequests", {
  id: int("id").autoincrement().primaryKey(),
  requestType: varchar("requestType", { length: 60 }).notNull(),
  referenceNumber: varchar("referenceNumber", { length: 60 }).notNull().unique(),
  requesterUserId: int("requesterUserId").notNull(),
  organizationUnitId: int("organizationUnitId"),
  amount: decimal("amount", { precision: 18, scale: 2 }).default("0").notNull(),
  payloadJson: text("payloadJson").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "cancelled"]).default("pending").notNull(),
  currentStep: int("currentStep").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const workflowApprovals = mysqlTable("workflowApprovals", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull(),
  stepOrder: int("stepOrder").notNull(),
  approverUserId: int("approverUserId"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  comment: text("comment"),
  actionedAt: timestamp("actionedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  actorUserId: int("actorUserId"),
  action: varchar("action", { length: 80 }).notNull(),
  entityType: varchar("entityType", { length: 80 }).notNull(),
  entityId: int("entityId"),
  beforeJson: text("beforeJson"),
  afterJson: text("afterJson"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const costCenters = mysqlTable("costCenters", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  parentId: int("parentId"),
  managerUserId: int("managerUserId"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const costElements = mysqlTable("costElements", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  category: mysqlEnum("category", ["material", "material_overhead", "resource", "labor", "overhead", "outside_processing", "other"]).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const productCosts = mysqlTable("productCosts", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  costCenterId: int("costCenterId"),
  costElementId: int("costElementId").notNull(),
  standardCost: decimal("standardCost", { precision: 18, scale: 2 }).default("0").notNull(),
  actualCost: decimal("actualCost", { precision: 18, scale: 2 }).default("0").notNull(),
  currencyCode: varchar("currencyCode", { length: 3 }).default("EGP").notNull(),
  effectiveFrom: timestamp("effectiveFrom").notNull(),
  effectiveTo: timestamp("effectiveTo"),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const costAllocations = mysqlTable("costAllocations", {
  id: int("id").autoincrement().primaryKey(),
  costCenterId: int("costCenterId").notNull(),
  targetAccountId: int("targetAccountId").notNull(),
  basis: mysqlEnum("basis", ["revenue", "quantity", "headcount", "manual"]).notNull(),
  allocationRate: decimal("allocationRate", { precision: 9, scale: 4 }).default("0").notNull(),
  period: varchar("period", { length: 7 }).notNull(),
  description: varchar("description", { length: 240 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const costTypes = mysqlTable("costTypes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  scenario: mysqlEnum("scenario", ["actual", "standard", "budget", "simulation"]).notNull(),
  affectsInventoryValuation: boolean("affectsInventoryValuation").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const costingMethods = mysqlTable("costingMethods", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  method: mysqlEnum("method", ["standard", "perpetual_average", "periodic_average", "fifo"]).notNull(),
  isOfficial: boolean("isOfficial").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const boms = mysqlTable("boms", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  version: varchar("version", { length: 32 }).notNull(),
  quantity: decimal("quantity", { precision: 18, scale: 3 }).default("1").notNull(),
  status: mysqlEnum("status", ["draft", "active", "archived"]).default("draft").notNull(),
  costingMethodId: int("costingMethodId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const bomLines = mysqlTable("bomLines", {
  id: int("id").autoincrement().primaryKey(),
  bomId: int("bomId").notNull(),
  componentProductId: int("componentProductId").notNull(),
  quantity: decimal("quantity", { precision: 18, scale: 4 }).notNull(),
  scrapRate: decimal("scrapRate", { precision: 9, scale: 4 }).default("0").notNull(),
  costCenterId: int("costCenterId"),
  sequence: int("sequence").default(1).notNull(),
});
export const workOrders = mysqlTable("workOrders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 48 }).notNull().unique(),
  productId: int("productId").notNull(),
  bomId: int("bomId"),
  costCenterId: int("costCenterId"),
  plannedQuantity: decimal("plannedQuantity", { precision: 18, scale: 3 }).notNull(),
  completedQuantity: decimal("completedQuantity", { precision: 18, scale: 3 }).default("0").notNull(),
  status: mysqlEnum("status", ["planned", "released", "in_progress", "completed", "closed", "cancelled"]).default("planned").notNull(),
  plannedStart: timestamp("plannedStart"),
  plannedEnd: timestamp("plannedEnd"),
  actualMaterialCost: decimal("actualMaterialCost", { precision: 18, scale: 2 }).default("0").notNull(),
  actualResourceCost: decimal("actualResourceCost", { precision: 18, scale: 2 }).default("0").notNull(),
  actualOverheadCost: decimal("actualOverheadCost", { precision: 18, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const workOrderOperations = mysqlTable("workOrderOperations", {
  id: int("id").autoincrement().primaryKey(),
  workOrderId: int("workOrderId").notNull(),
  sequence: int("sequence").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  costCenterId: int("costCenterId"),
  resourceRate: decimal("resourceRate", { precision: 18, scale: 2 }).default("0").notNull(),
  plannedHours: decimal("plannedHours", { precision: 18, scale: 3 }).default("0").notNull(),
  actualHours: decimal("actualHours", { precision: 18, scale: 3 }).default("0").notNull(),
  outsideProcessingCost: decimal("outsideProcessingCost", { precision: 18, scale: 2 }).default("0").notNull(),
  status: mysqlEnum("status", ["planned", "started", "completed"]).default("planned").notNull(),
});
export const costDistributions = mysqlTable("costDistributions", {
  id: int("id").autoincrement().primaryKey(),
  period: varchar("period", { length: 7 }).notNull(),
  productId: int("productId").notNull(),
  costCenterId: int("costCenterId").notNull(),
  costElementId: int("costElementId").notNull(),
  basis: mysqlEnum("basis", ["material", "resource", "overhead", "outside_processing"]).notNull(),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  sourceType: varchar("sourceType", { length: 48 }).notNull(),
  sourceId: int("sourceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const monthlyClosings = mysqlTable("monthlyClosings", {
  id: int("id").autoincrement().primaryKey(),
  period: varchar("period", { length: 7 }).notNull().unique(),
  status: mysqlEnum("status", ["open", "closing", "closed", "reopened"]).default("open").notNull(),
  closedBy: int("closedBy"),
  closedAt: timestamp("closedAt"),
  reopenedBy: int("reopenedBy"),
  reopenedAt: timestamp("reopenedAt"),
  trialBalanceDifference: decimal("trialBalanceDifference", { precision: 18, scale: 2 }).default("0").notNull(),
  validationNote: text("validationNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const bankReconciliations = mysqlTable("bankReconciliations", {
  id: int("id").autoincrement().primaryKey(),
  sourceKey: varchar("sourceKey", { length: 160 }).notNull().unique(),
  reconciliationDate: timestamp("reconciliationDate").notNull(),
  documentNumber: varchar("documentNumber", { length: 80 }),
  accountName: varchar("accountName", { length: 180 }),
  statementDebit: decimal("statementDebit", { precision: 18, scale: 2 }).default("0").notNull(),
  statementCredit: decimal("statementCredit", { precision: 18, scale: 2 }).default("0").notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["unmatched", "matched", "review"]).default("review").notNull(),
  sourceJson: text("sourceJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const legacyTransactions = mysqlTable("legacyTransactions", {
  id: int("id").autoincrement().primaryKey(),
  sourceKey: varchar("sourceKey", { length: 200 }).notNull().unique(),
  sourceWorkbook: varchar("sourceWorkbook", { length: 180 }).notNull(),
  sourceSheet: varchar("sourceSheet", { length: 120 }).notNull(),
  sourceRow: int("sourceRow").notNull(),
  module: varchar("module", { length: 80 }).notNull(),
  documentType: varchar("documentType", { length: 80 }),
  journalEntryId: int("journalEntryId"),
  sourceJson: text("sourceJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type Party = typeof parties.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Employee = typeof employees.$inferSelect;
