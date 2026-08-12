# Sky ERP report research notes

## Odoo official reporting documentation
Source: https://www.odoo.com/documentation/17.0/applications/finance/accounting/reporting.html

The Odoo reporting catalog includes Balance Sheet, Profit and Loss / Income Statement, Executive Summary, General Ledger, Aged Receivable, Aged Payable, Cash Flow Statement, Tax Report, and Audit Trail. Its executive summary highlights gross profit margin, net profit margin, ROI, average debtor days, average creditor days, short-term cash forecast, and current ratio. The documentation also describes report expansion to journal items and export to PDF/XLSX, plus period comparison.

## SAP official report overview
Source: https://help.sap.com/docs/SAP_BUSINESS_BYDESIGN/2754875d2d2a403f95e58a41a9c7d6de/2db9db2b722d10148b89ac8f2720feac.html

The official page was dynamically rendered in the browser and exposed the SAP Help Portal report-overview page. Search results identified SAP financial-management categories including General Ledger, Accounts Payable trial balance/open items/balance audit trail, and Accounts Receivable trial balance. These categories support adding open-items, reconciliation, and audit-trail reports to Sky ERP.

## Initial implementation mapping

| External capability | Sky ERP implementation target |
|---|---|
| Balance Sheet / P&L / General Ledger | Existing detailed financial report module |
| Aged Receivable / Aged Payable | New aging report with 0-30, 31-60, 61-90, 91-120, and 120+ buckets |
| Cash Flow Statement / short-term cash forecast | New operating/investing/financing cash-flow analysis |
| Executive Summary / KPI ratios | Interactive dashboard cards and period filters |
| Tax Report / audit trail | Egyptian tax and audit report group |
| Open items / reconciliation | Customer, supplier, bank, and subledger reconciliation reports |
| PDF/XLSX and comparison | Unified export controls across report modules |

## Oracle official Financial Reporting Center
Source: https://docs.oracle.com/en/cloud/saas/financials/25d/facsf/overview-of-financial-reporting-center.html

Oracle positions its Financial Reporting Center as the primary interface for financial users and describes seven report types: Financial Reporting Web Studio reports, Account Groups and Sunburst, Smart View reports, Transactional Business Intelligence analyses, Transactional Business Intelligence dashboards, Analytics Publisher reports, and BI mobile apps. Reports can be organized with folders, favorites, tags, and metadata. The documented audiences span General Ledger, Payables, Receivables, Cash Management, and Intercompany. Sky ERP should adopt a unified report center with grouped modules, saved favorites, report metadata, and interactive dashboard/report drill-down rather than isolated report cards.

## Egyptian accounting implementation mapping

The Egyptian report catalog is implemented as an operational ERP layer, not as a claim of statutory certification. The base currency is **EGP (ج.م)**, while multi-currency transactions retain their source currency and convert to EGP using the stored exchange rate. The financial report group includes the balance sheet, income statement, trial balance, general ledger, cash-flow analysis, tax summaries, debt aging, and bank-reconciliation-oriented workflows. The customer and supplier groups expose separate statements, collections/payables, credit-limit analysis, and aging views.

The adopted report rules are as follows. The income statement calculates net income as revenue less expenses for the selected inclusive date range. The cash-flow analysis classifies movements into operating, investing, and financing sections and reports the net amount as their sum. Debt aging is evaluated as of the selected date and separates current, 1–30, 31–60, 61–90, and over-90-day balances; the UI can restrict the query to customers or suppliers. Tax reporting exposes sales tax, purchase tax, total tax, and net tax, with transaction-level filtering by period, currency, amount, and description. Dashboard cards use the same selected period and open the report center for drill-down.

These mappings are informed by the Egyptian Tax Authority’s electronic-invoicing and VAT context, Egyptian Accounting Standards as published through Egyptian regulatory/accounting references, and the report families documented by SAP, Odoo, and Oracle. Statutory filing formats and tax rates remain configurable and should be reviewed by the organization’s Egyptian tax adviser before production filing.

## Sources for Egyptian context

| Topic | Reference |
|---|---|
| Egyptian Tax Authority electronic invoicing portal | https://www.eta.gov.eg/en/e-invoice |
| Egyptian Tax Authority VAT resources | https://www.eta.gov.eg/en/vat |
| Egyptian Accounting Standards reference context | https://www.fra.gov.eg/ |
| Odoo financial reporting | https://www.odoo.com/documentation/17.0/applications/finance/accounting/reporting.html |
| SAP financial-management reports | https://help.sap.com/docs/SAP_BUSINESS_BYDESIGN/2754875d2d2a403f95e58a41a9c7d6de/2db9db2b722d10148b89ac8f2720feac.html |
| Oracle Financial Reporting Center | https://docs.oracle.com/en/cloud/saas/financials/25d/facsf/overview-of-financial-reporting-center.html |
