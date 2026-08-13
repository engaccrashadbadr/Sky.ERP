CREATE INDEX `invoices_invoice_date_idx` ON `invoices` (`invoiceDate`);--> statement-breakpoint
CREATE INDEX `invoices_party_date_idx` ON `invoices` (`partyId`,`invoiceDate`);--> statement-breakpoint
CREATE INDEX `journal_entries_entry_date_idx` ON `journalEntries` (`entryDate`);--> statement-breakpoint
CREATE INDEX `journal_entries_status_date_idx` ON `journalEntries` (`status`,`entryDate`);--> statement-breakpoint
CREATE INDEX `journal_lines_entry_idx` ON `journalLines` (`journalEntryId`);--> statement-breakpoint
CREATE INDEX `journal_lines_account_idx` ON `journalLines` (`accountId`);