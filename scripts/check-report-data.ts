import { getFinancialReports } from "../server/db";

const report = await getFinancialReports({});
const trialBalance = report.trialBalance ?? [];
const ledger = report.generalLedger ?? [];
const income = report.incomeStatement ?? {};
const balance = report.balanceSheet ?? {};
console.log(JSON.stringify({
  trialBalanceRows: trialBalance.length,
  ledgerRows: ledger.length,
  firstLedgerDate: ledger[0]?.date ?? null,
  lastLedgerDate: ledger.at(-1)?.date ?? null,
  revenue: income.revenue ?? 0,
  expenses: income.expenses ?? 0,
  netIncome: income.netIncome ?? 0,
  assetsRows: Array.isArray(balance.assets) ? balance.assets.length : -1,
  liabilitiesRows: Array.isArray(balance.liabilities) ? balance.liabilities.length : -1,
  equityRows: Array.isArray(balance.equity) ? balance.equity.length : -1,
}, null, 2));
