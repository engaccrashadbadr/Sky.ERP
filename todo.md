# Project TODO

- [x] Establish Arabic RTL application shell and professional financial-management design system
- [x] Build main dashboard with revenue, expenses, profit, receivables, and alerts summaries
- [x] Add chart of accounts list with categories and create operation
- [x] Complete chart of accounts editing and safe deactivation without destructive deletion
- [x] Add journal-entry workflow with debit/credit balancing validation and account linking, including live entry form UI
- [x] Add sales and purchase invoice creation with tax, discount, status, and payment tracking
- [x] Add customer and supplier records with credit-limit and opening-balance fields in the quick-create UI
- [x] Complete party transaction history and outstanding-balance drill-down through filtered transaction statements
- [x] Add inventory products, quantities, and minimum thresholds in the quick-create UI
- [x] Complete stock movement entry with inbound/outbound quantity updates and threshold-aware low-stock notification
- [x] Add employee records and salary fields
- [x] Add monthly payroll generation from active employee salaries
- [x] Add attendance and absence tracking backend records and protected procedures
- [x] Add attendance and absence management UI with employee selector, date, status, and history table
- [x] Add financial-report navigation and report cards
- [x] Implement live dashboard-backed financial report summary cards
- [x] Implement live trial-balance and general-ledger report queries
- [x] Implement detailed balance-sheet sections, income-statement lines, and cash-flow movements
- [x] Implement detailed tax-summary calculations with sales/purchase tax-type breakdowns, taxable totals, and net tax
- [x] Add role enum, protected/admin tRPC foundations, and persisted administrator role updates
- [x] Add POS interface with barcode/search field, real cart state, quantity controls, and rapid product selection
- [x] Complete POS cart checkout with persisted invoice creation and payment-total calculation
- [x] Complete POS persisted invoice issuance
- [x] Add cash drawer open, close, and session-list backend workflows
- [x] Add cash drawer management UI in POS with opening, closing, and session status controls
- [x] Add automatic owner notifications for unpaid invoices and outbound stock movements
- [x] Add exact minimum-stock threshold evaluation notifications
- [x] Add exact credit-limit breach notifications
- [x] Add server-side Arabic AI assistant for accounting questions
- [x] Add journal classification and report suggestion actions in the Arabic AI assistant
- [x] Add document attachment upload UI with selected-invoice linkage and S3-backed metadata persistence
- [x] Add database schema, migration, query helpers, and typed tRPC procedures for implemented modules
- [x] Add Vitest coverage for journal balancing and authentication logout
- [x] Fix numeric coercion in reusable workflow calculators, wire payroll role authorization into the live tRPC route, and add Vitest coverage for invoice totals, inventory movements, and payroll permissions; detailed balance-sheet, income-statement, cash-flow, tax, journal, export, and credit-exposure coverage is complete
- [x] Verify responsive RTL UI structure, loading/empty states, TypeScript, core tests, and mobile screenshot rendering
- [x] Verify the protected browser-flow gate for create, invoice, stock, payroll, attachment, and AI actions; unauthenticated preview correctly requires OAuth, and route-level authorization tests cover payroll plus invoice, stock, attachment, and AI mutations (full UI submission requires a user OAuth session)
- [x] Save final checkpoint and deliver the project version for preview/publishing by the user
- [x] History: Initial requirements supplied by user in Arabic and English
- [x] History: Project initialized from the full-stack web application template
- [x] History: User expanded the scope to include the complete ERP feature set
- [x] Add PDF export for financial reports and account statements with Arabic RTL formatting through a print-ready RTL document, including party statement rows
- [x] Add Excel export for financial reports and account statements with Arabic column headers, including party statement rows
- [x] Add report-period and report-type selectors to the export controls
- [x] Verify export utility integration through TypeScript compilation, dedicated PDF/Excel Vitest tests, and RTL preview rendering
- [x] Add company currency settings, supported currencies, and exchange rates for multi-currency transactions
- [x] Add currency selection and converted/base amounts to invoices, parties, invoices, and report exports
- [x] Add custom date-range selection to reports and exports
- [x] Add interactive financial charts for revenue, expenses, profit, and receivables
- [x] Add advanced report filters by text, transaction type, currency, and amount range
- [x] Add Excel import template and validated upload for customers, suppliers, accounts, and opening balances
- [x] Add import preview and commit confirmation
- [x] Add row-level validation error report and duplicate handling policy
- [x] Add general-accounting report catalog with balance sheet, income statement, trial balance, general ledger, cash flow, and tax summary entries
- [x] Complete detailed live account-level calculations for balance sheet, income statement, and cash flow
- [x] Complete detailed live tax calculations and breakdowns
- [x] Add customer and supplier statement-of-account views with date, currency, and amount filters
- [x] Add transaction-level party ledgers with running balances; detailed aging buckets remain a future enhancement
- [x] Document and expose a clear document workflow from draft to review to approval to posting to payment and archival
- [x] Add report navigation, responsive chart layout, currency labels, import preview, and validation messaging improvements
- [x] Expose currency selectors and base/converted amounts in invoice and party creation forms
- [x] Replace month-truncated report filters with exact inclusive start and end dates
- [x] Add an explicit transaction-type filter to the reports screen
- [x] Persist account opening balances during Excel import and provide row-level validation feedback
- [x] Build transaction-level customer and supplier statement ledgers with running balances and working filters
- [x] Add currency, exchange-rate, and base-total display to the standard sales and purchase invoice creation workflow
- [x] Prepend explicit opening-balance rows and include all available invoice movements in running statement balances
- [x] Calculate credit exposure from opening balance plus all outstanding sales invoices and payments before alerting
- [x] Add automated credit-limit tests for actual notification behavior with prior exposure, partial payments, and non-breaching invoices
- [x] Refresh attendance history immediately after recording a new attendance status
- [x] Add explicit attendance history loading, error, and empty states
- [x] Extend account editing to include code, parent account, and full tree hierarchy fields
- [x] Add account deactivation safeguards for dependent or critical accounts with clear validation errors
- [x] Expand party ledgers to merge opening balances, invoices, payment settlements, reconciled running balances, and drill-down details
- [x] Prevent indirect parent cycles and invalid reparenting across the account hierarchy
- [x] Add a true parent/child account-tree view with hierarchy context
- [x] Protect critical system/root accounts from deactivation with explicit Arabic validation
- [x] Expand account deactivation dependency checks to linked journal records and child accounts
- [x] Fix report query initialization order so exact date filters compile and load safely
- [x] Recognize Arabic صندوق and cash-account naming variants in detailed cash-flow movement calculations
- [x] Update reports UI to display totalTax, salesTax, purchaseTax, and netTax from the detailed tax summary
- [x] Add tax-summary Vitest assertions for sales and purchase tax breakdowns
- [x] Update detailed-report tests for the new sales and purchase tax-summary breakdown contract
- [x] Render sales tax, purchase tax, and net tax values in the Arabic reports screen
- [x] Verify the visible tax breakdown in the reports UI after wiring the new fields and passing TypeScript/Vitest; direct reports screenshot evidence saved in reports-preview-verification.md
- [x] Restart the development server after tax-summary changes and confirm no current TypeScript or startup transform errors
- [x] Verify the Arabic reports screen visually shows sales tax, purchase tax, and net tax cards in the direct reports preview
- [x] Restore the active navigation section declaration after adding the reports preview query parameter

# Sky ERP expansion

- [x] Rename product branding to Sky ERP across title, login, dashboard, and metadata
- [x] Make dashboard cards and control-panel sections interactive with report navigation
- [x] Add dashboard inclusive from/to date filters and apply them to live summaries and charts
- [x] Build user management and department-based custom permission templates
- [x] Change the default/base currency to Egyptian pound (EGP) with migration-safe currency handling
- [x] Add debt-aging report with aging buckets, party filters, and export support
- [x] Add expanded cash-flow analysis with operating, investing, and financing sections
- [x] Create a modular reports center grouped by financial, sales, purchases, inventory, customers, suppliers, HR, POS, tax, and management reports
- [x] Expand Egyptian accounting report catalog and report-specific filters/calculations based on documented research
- [x] Add unified Excel and PDF export actions for every report module
- [x] Research SAP, Odoo, Oracle, and Egyptian accounting/reporting references; save sources and map adopted report capabilities
- [x] Add Vitest coverage and RTL/browser verification for the Sky ERP expansion; preview evidence is documented with OAuth limitation
- [x] Save and deliver the Sky ERP checkpoint
- [x] Complete Sky ERP branding across dashboard, login, and metadata surfaces
- [x] Make main dashboard summary cards navigate to relevant reports
- [x] Enforce department permission templates in protected procedures, not only as editable metadata
- [x] Replace the remaining SAR import-template default with EGP
- [x] Add customer/supplier aging filters and a management reports group
- [x] Document Egyptian-specific report mappings and adopted calculations from the research notes
- [x] Capture RTL/browser verification for the new Sky ERP dashboard, access, aging, cash-flow, and report-center features; authenticated interactions require user OAuth

# Oracle Financials report expansion

- [x] Add Oracle-aligned report groups for general ledger, accounts payable, accounts receivable, fixed assets, and cash management
- [x] Add payment register, customer collections, invoice/PO matching, asset additions/retirements, and bank reconciliation report entries with explicit live/catalog data-availability states; the report center renders the status and blocks catalog-only drill-down
- [x] Add the protected Oracle report-catalog query and reuse existing live aging, collections, invoice, journal, and cash-flow calculations without fabricating fixed-asset, purchase-order, or bank-transaction data
- [x] Apply the shared report period, party, currency, amount, and text filters plus Excel/PDF exports to live Oracle-aligned report cards, while catalog-only reports show an honest unavailable state
- [x] Add Vitest coverage for the detailed financial calculations and Oracle report-catalog mappings; 19 tests pass
- [x] Save and deliver the Oracle-aligned Sky ERP checkpoint

# Attached ERP module blueprint expansion

- [x] Audit all attached modules against existing schema, routers, pages, and report catalog; findings saved in sky-module-audit.md
- [x] Complete the module components that have live sources and add structured workspaces for FA, CM, Self-Service, Recruitment, and Order Management; catalog-only areas explicitly identify missing source tables and do not fabricate records
- [x] Refactor application navigation into grouped Finance, HRMS, SCM/procurement, Sales, Inventory, POS, and Administration sections with dedicated module workspaces
- [x] Add a comprehensive module and feature report catalog with live, partial, and catalog-only availability states
- [x] Add report entries, shared filters, calculations, and Excel/PDF export actions for every implemented module and addition; HR, inventory, POS, attendance, payroll, parties, and administration now show filtered live, partial, or catalog-only cards with calculated summaries and exports
- [x] Add Vitest coverage for new module helpers and report catalog mappings, including live/partial/catalog availability states; 22 tests pass
- [x] Verify the RTL dashboard and module/report-center layout visually; latest preview shows Sky ERP RTL dashboard with period controls, and authenticated interactions remain OAuth-gated
- [x] Repair missing users.department and users.permissionTemplate columns in the live database before module work continues
- [x] Save and deliver the expanded Sky ERP module-workspace checkpoint after runtime schema verification

# Reliability, audit, approvals, and authentication expansion

- [x] Make empty Excel exports download a valid empty workbook and empty PDF exports state لا توجد بيانات
- [x] Add regression tests for empty and populated Excel/PDF exports
- [x] Add persistent audit-log schema, helpers, protected procedures, and UI for accounting and user changes
- [x] Record audit events for journal entries, invoices, stock, payroll, permissions, and approval actions
- [x] Add organization structure and configurable multi-level approval templates
- [x] Add purchase-request and leave-request approval workflows with ordered approvers and status history
- [x] Extend approval foundation for other request types without fabricating business records
- [x] Review authentication UX and document the OAuth limitation; Arabic OAuth login/registration guidance is shown and insecure hardcoded Admin/123 credentials are not created
- [x] Run full TypeScript, Vitest, and RTL/browser verification; TypeScript passes, 27 tests pass, and the Sky ERP RTL preview loads successfully
- [x] Add protected create/update UI and mutations for organization units and approval templates so approval paths are configurable
- [x] Surface Arabic OAuth sign-in/sign-up guidance on the actual Home unauthenticated entry screen and re-verify visually; the current system remains OAuth-based and does not create hardcoded Admin/123 credentials
- [x] Add edit/update controls in Settings for existing organization units and approval templates, then verify protected update mutations end to end
- [x] Update the actual unauthenticated Home screen with Arabic OAuth account-creation guidance alongside sign-in and capture fresh visual evidence
- [ ] Add focused Vitest coverage invoking admin.updateOrganizationUnit and admin.updateApprovalTemplate through the protected router, including authorization enforcement
- [x] Document the authenticated UI limitation for editing organization units and approval templates; OAuth session is required for end-to-end browser submission

# Interactive workflow and control audit

- [x] Audit dashboard, report, administration, module, and workflow controls; document concrete coverage by section before marking complete
- [x] Make request workflow step cards actionable; prove that clicking مسودة opens the editable draft form with focused workflow-contract coverage; rendered DOM coverage remains limited by the Node-only Vitest setup
- [x] Wire and verify available review and approval steps to the live pending-request queue; keep archive explicitly unavailable until a closeout source/action exists
- [ ] Add focused rendered UI/component coverage for draft, review, approval, archive, and report-step routing after adding a DOM test harness; retain protected-router authorization coverage
- [x] Perform authenticated browser verification of the workflow step bar and key dashboard/report controls, or document the exact OAuth limitation per control; OAuth limitation documented in control-audit.md
