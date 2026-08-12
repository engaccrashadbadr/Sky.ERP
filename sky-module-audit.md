# Sky ERP Module Audit

## Existing live persisted areas

| Blueprint area | Existing schema/router evidence | Status |
|---|---|---|
| GL | `accounts`, `journalEntries`, `journalLines`, `accounts.*`, `journals.*`, live financial reports | Live |
| AP / AR shared party flows | `parties`, `invoices`, `partyPayments`, invoice and statement procedures | Live, combined |
| Inventory | `products`, `stockMoves`, `products.*`, `stock.move`, low-stock notifications | Live, basic |
| Core HR | `employees`, `attendanceRecords`, employee and attendance procedures | Live, basic |
| Payroll | `payrollRuns`, `employees.payroll` | Live, basic |
| POS / cash drawer | `cashDrawerSessions`, `cashDrawer.*`, POS UI in `Home.tsx` | Live |
| Multi-currency | `currencies`, invoice/party currency fields, report filters | Live |
| Attachments and AI | `attachments`, `attachments.upload`, `assistant.ask` | Live |
| User access | `users`, `admin.users`, `admin.setRole`, `admin.setAccess`, department/template middleware | Live |

## Missing or partial areas from the attachment

| Blueprint area | Gap |
|---|---|
| GL | Financial periods, allocations/cost centers, formal reconciliations, and recurring journals are not separate persisted workflows. |
| AP | Supplier bank/contact structures, credit/debit notes, withholding tax, payment register detail, and purchasing integration are incomplete. |
| AR | Delivery/billing addresses, credit/debit notes, collections workflow, and order-management integration are incomplete. |
| FA | No fixed-asset tables or depreciation workflow currently exist. |
| CM | No bank-account/transaction/reconciliation tables currently exist; cash-flow analysis is journal-derived. |
| Core HR | No organizational structure, contracts, skills, qualifications, or employee lifecycle tables currently exist. |
| Payroll | Salary elements, deductions, loans, bank-transfer files, and GL posting are incomplete. |
| Self-Service | No employee portal, leave requests, payslip access, training, or performance workflow exists. |
| Recruitment | No vacancies, applications, interviews, offers, or onboarding tables exist. |
| Purchasing | No requisitions, purchase orders, receiving, approvals, contracts, or supplier evaluation tables exist. |
| Inventory | No warehouses/locations, transfers, physical counts, valuation methods, or aging tables exist. |
| Order Management | No sales orders, quotations, shipping/delivery, returns, or price-list tables exist. |

## Implementation policy

The next implementation should prioritize additive, high-value workflows that fit existing tables, avoid fabricated business data, and expose partial or catalog-only report states until dedicated source tables exist. Existing combined party/invoice flows should be organized into AP and AR modules without duplicating persistence.
