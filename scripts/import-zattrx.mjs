import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import XLSX from "xlsx";
import mysql from "mysql2/promise";

const workbookPath = process.argv[2] ?? "/home/ubuntu/upload/ZatTRXLine.xlsx";
const sourceWorkbook = path.basename(workbookPath);
const pool = mysql.createPool(process.env.DATABASE_URL);
const wb = XLSX.readFile(workbookPath, { cellDates: true, raw: false });
const sheet = wb.Sheets["MAIN QUERY"];
if (!sheet) throw new Error("MAIN QUERY sheet is missing");
const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
const s = (v) => v == null ? "" : String(v).trim();
const n = (v) => { const x = Number(s(v).replace(/,/g, "")); return Number.isFinite(x) ? x : 0; };
const dateOf = (v) => { if (v instanceof Date && !Number.isNaN(v.getTime())) return v; const raw = s(v); const m = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/); if (m) return new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1]))); const d = new Date(raw); if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${v}`); return d; };
const key = (i) => `${sourceWorkbook}:MAIN QUERY:${i + 2}`;
const hash = (v) => crypto.createHash("sha1").update(v).digest("hex").slice(0, 16);
const category = (code, name) => { const f = s(code).replace(/\D/g, "")[0]; if (f === "1") return "asset"; if (f === "2") return "liability"; if (f === "3") return "equity"; if (f === "4") return "revenue"; if (f === "5") return "expense"; if (/مورد|payable|liabil/i.test(s(name))) return "liability"; if (/إيراد|مبيعات|revenue|sales/i.test(s(name))) return "revenue"; if (/مصروف|تكلفة|expense/i.test(s(name))) return "expense"; return "asset"; };
const moduleFor = (v) => { const x = s(v); if (/تسويات بنكيه|bank reconciliation/i.test(x)) return "bankReconciliation"; if (/بنك|bank|خزينة|cashbox/i.test(x)) return "cashManagement"; if (/مورد|supplier|payable/i.test(x)) return "payables"; if (/عميل|customer|receivable|sales/i.test(x)) return "receivables"; if (/مخزون|inventory|صرف|إضافة/i.test(x)) return "inventory"; if (/عملة|currency|دورية|recurring|journal/i.test(x)) return "accounting"; return "importReview"; };
const batch = async (db, sql, values, width, chunk = 400) => { let affected = 0; for (let i = 0; i < values.length; i += chunk) { const part = values.slice(i, i + chunk); const placeholders = part.map(() => `(${Array(width).fill("?").join(",")})`).join(","); const [r] = await db.query(sql.replace("__VALUES__", placeholders), part.flat()); affected += Number(r.affectedRows ?? 0); } return affected; };
const accountCode = (row) => { const main = s(row.MAIN_CODE) || `M-${s(row.acc1) || "0"}`; const sub = s(row.SUB_CODE) || s(row.subcode); return { main, sub, leaf: sub && sub !== main ? `${main}-${sub}` : main }; };

const db = await pool.getConnection();
const out = { rowsSeen: rows.length, rowsImported: 0, rowsSkipped: 0, accountsCreated: 0, partiesCreated: 0, projectsCreated: 0, journalsCreated: 0, bankRowsCreated: 0, closingsSaved: 0, errors: [], sourceTotals: { debit: 0, credit: 0 }, importedTotals: { debit: 0, credit: 0 } };
try {
  await db.beginTransaction();
  const [legacy] = await db.query("SELECT sourceKey FROM legacyTransactions");
  const existingKeys = new Set(legacy.map((r) => r.sourceKey));
  const fresh = rows.map((row, index) => ({ row, index })).filter((x) => !existingKeys.has(key(x.index)));
  out.rowsSkipped = rows.length - fresh.length;
  for (const { row } of fresh) { out.sourceTotals.debit += n(row.DBT_LOCAL); out.sourceTotals.credit += n(row.CRT_LOCAL); }

  const refs = new Map();
  for (const { row } of fresh) { const { main, leaf } = accountCode(row); const mainName = s(row.CODE_DESC) || `حساب رئيسي ${main}`; const leafName = s(row["accounts.DESCRIPTION"]) || s(row["asst.DESCRIPTION"]) || `حساب فرعي ${leaf}`; if (!refs.has(main)) refs.set(main, { code: main, name: mainName, category: category(main, leafName), parentCode: null }); if (!refs.has(leaf)) refs.set(leaf, { code: leaf, name: leafName, category: category(main, leafName), parentCode: leaf === main ? null : main }); }
  const [accs] = await db.query("SELECT id, code FROM accounts"); const ids = new Map(accs.map((r) => [String(r.code), Number(r.id)]));
  const accountValues = []; for (const a of refs.values()) if (!ids.has(a.code)) accountValues.push([a.code, a.name.slice(0, 180), a.category, a.parentCode ? ids.get(a.parentCode) ?? null : null]);
  if (accountValues.length) { await batch(db, "INSERT INTO accounts (code,name,category,parentId,isActive,openingBalance) VALUES __VALUES__", accountValues.map((v) => [...v, 1, "0"]), 6); const [newAccs] = await db.query("SELECT id, code FROM accounts"); for (const r of newAccs) ids.set(String(r.code), Number(r.id)); out.accountsCreated = accountValues.length; }

  const partyRefs = new Map(); const projectRefs = new Map();
  for (const { row } of fresh) { const name = s(row["asst.DESCRIPTION"]); const typeDesc = s(row["DOCUMENTS_TYPE_FILE.DESCRIPTION"]); if (name && /مورد|supplier|payable/i.test(typeDesc)) partyRefs.set(`supplier:${name}`, ["supplier", name]); if (name && /عميل|customer|receivable|sales/i.test(typeDesc)) partyRefs.set(`customer:${name}`, ["customer", name]); const pc = s(row.PROJECT_CODE); const pn = s(row["PROJECTS_FILE.DESCRIPTION"]); if (pc || pn) projectRefs.set(pc || `SRC-${hash(pn)}`, [pc || `SRC-${hash(pn)}`, pn || pc]); }
  const [parties] = await db.query("SELECT id,type,name FROM parties"); const partyIds = new Set(parties.map((r) => `${r.type}:${r.name}`)); const partyValues = [...partyRefs.values()].filter(([t, name]) => !partyIds.has(`${t}:${name}`)).map(([t, name]) => [t, name.slice(0, 180), "0", "0", "EGP"]); if (partyValues.length) { await batch(db, "INSERT INTO parties (type,name,creditLimit,openingBalance,currencyCode) VALUES __VALUES__", partyValues, 5); out.partiesCreated = partyValues.length; }
  const [projects] = await db.query("SELECT id,code FROM projects"); const projectIds = new Set(projects.map((r) => String(r.code))); const projectValues = [...projectRefs.values()].filter(([code]) => !projectIds.has(String(code))).map(([code, name]) => [String(code).slice(0, 80), String(name).slice(0, 180), 1]); if (projectValues.length) { await batch(db, "INSERT INTO projects (code,name,isActive) VALUES __VALUES__", projectValues, 3); out.projectsCreated = projectValues.length; }

  const groups = new Map(); for (const item of fresh) { const d = dateOf(item.row.Date); const gk = `${d.toISOString().slice(0,10)}|${s(item.row["DOCUMENT TYPE"])}|${s(item.row["DOCUMNT NUMBER"]) || `ROW-${item.index + 2}`}`; const g = groups.get(gk) ?? { gk, date: d, type: s(item.row["DOCUMENT TYPE"]) || "X", doc: s(item.row["DOCUMNT NUMBER"]) || `ROW-${item.index + 2}`, rows: [] }; g.rows.push(item); groups.set(gk, g); }
  const [existingEntries] = await db.query("SELECT id,entryNumber FROM journalEntries WHERE entryNumber LIKE 'ZAT-%'"); const entryIds = new Map(existingEntries.map((r) => [String(r.entryNumber), Number(r.id)])); const entryRows = []; const groupEntries = [];
  for (const g of groups.values()) { const entryNumber = `ZAT-${g.type}-${g.doc}-${g.date.toISOString().slice(0,10).replaceAll("-","")}`.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32); if (!entryIds.has(entryNumber)) { const posted = g.rows.every(({ row }) => /^(true|1|yes)$/i.test(s(row.POSTING))); entryRows.push([entryNumber, g.date, s(g.rows[0].row.DESCRPTION) || `استيراد ZatTRX نوع ${g.type} مستند ${g.doc}`, "EGP", "1", posted ? "posted" : "draft", null]); } groupEntries.push({ g, entryNumber }); }
  if (entryRows.length) await batch(db, "INSERT INTO journalEntries (entryNumber,entryDate,description,currencyCode,exchangeRate,status,createdBy) VALUES __VALUES__", entryRows, 7);
  if (entryRows.length) { const [allEntries] = await db.query("SELECT id,entryNumber FROM journalEntries WHERE entryNumber LIKE 'ZAT-%'"); for (const r of allEntries) entryIds.set(String(r.entryNumber), Number(r.id)); }
  const lineValues = []; const legacyValues = []; const bankValues = [];
  for (const { g, entryNumber } of groupEntries) { const journalId = entryIds.get(entryNumber); for (const { row, index } of g.rows) { const { main, leaf } = accountCode(row); const aid = ids.get(leaf) ?? ids.get(main); const debit = n(row.DBT_LOCAL), credit = n(row.CRT_LOCAL); if (aid && (debit || credit)) { lineValues.push([journalId, aid, debit.toFixed(2), credit.toFixed(2), s(row.DESCRPTION).slice(0, 1000) || null]); out.importedTotals.debit += debit; out.importedTotals.credit += credit; } else if (!aid) out.errors.push({ row: index + 2, message: `لا يوجد حساب للحركة ${leaf}` }); legacyValues.push([key(index), sourceWorkbook, "MAIN QUERY", index + 2, moduleFor(row["DOCUMENTS_TYPE_FILE.DESCRIPTION"]), s(row["DOCUMENTS_TYPE_FILE.DESCRIPTION"]) || s(row["DOCUMENT TYPE"]), journalId, JSON.stringify(row)]); if (moduleFor(row["DOCUMENTS_TYPE_FILE.DESCRIPTION"]) === "bankReconciliation") bankValues.push([`${key(index)}:bank`, dateOf(row.Date), s(row["DOCUMNT NUMBER"]), s(row["accounts.DESCRIPTION"]), n(row.DBT_LOCAL).toFixed(2), n(row.CRT_LOCAL).toFixed(2), s(row.DESCRPTION), "review", JSON.stringify(row)]); out.rowsImported++; } }
  if (lineValues.length) await batch(db, "INSERT INTO journalLines (journalEntryId,accountId,debit,credit,note) VALUES __VALUES__", lineValues, 5);
  if (legacyValues.length) await batch(db, "INSERT IGNORE INTO legacyTransactions (sourceKey,sourceWorkbook,sourceSheet,sourceRow,module,documentType,journalEntryId,sourceJson) VALUES __VALUES__", legacyValues, 8);
  if (bankValues.length) out.bankRowsCreated = await batch(db, "INSERT IGNORE INTO bankReconciliations (sourceKey,reconciliationDate,documentNumber,accountName,statementDebit,statementCredit,description,status,sourceJson) VALUES __VALUES__", bankValues, 9);

  const periods = new Map(); for (const { row } of fresh) { const d = dateOf(row.Date); const p = /^\d{4}\/\d{2}$/.test(s(row.Month)) ? s(row.Month).replace("/", "-") : d.toISOString().slice(0,7); const t = periods.get(p) ?? { d: 0, c: 0 }; t.d += n(row.DBT_LOCAL); t.c += n(row.CRT_LOCAL); periods.set(p, t); }
  const closeValues = [...periods.entries()].map(([period, t]) => { const diff = Number((t.d - t.c).toFixed(2)); const ok = Math.abs(diff) <= 0.01; return [period, ok ? "closed" : "open", diff.toFixed(2), `تم الاستيراد من ${sourceWorkbook}. المدين ${t.d.toFixed(2)} والدائن ${t.c.toFixed(2)}؛ الفرق ${diff.toFixed(2)}. ${ok ? "متوازنة." : "تحتاج مراجعة قبل الإقفال."}`]; }); if (closeValues.length) { await batch(db, "INSERT INTO monthlyClosings (period,status,trialBalanceDifference,validationNote) VALUES __VALUES__ ON DUPLICATE KEY UPDATE trialBalanceDifference=VALUES(trialBalanceDifference),validationNote=VALUES(validationNote),updatedAt=CURRENT_TIMESTAMP", closeValues, 4); out.closingsSaved = closeValues.length; }
  await db.query("INSERT INTO auditLogs (actorUserId,action,entityType,entityId,beforeJson,afterJson,ipAddress) VALUES (NULL,'import','ZatTRXLine',NULL,NULL,?,NULL)", [JSON.stringify({ sourceWorkbook, ...out })]);
  await db.commit(); fs.writeFileSync("/home/ubuntu/zattrx_import_summary.json", JSON.stringify(out, null, 2)); console.log(JSON.stringify(out, null, 2));
} catch (e) { await db.rollback(); console.error(e); process.exitCode = 1; } finally { db.release(); await pool.end(); }
