ALTER TABLE `invoices` MODIFY COLUMN `currencyCode` varchar(3) NOT NULL DEFAULT 'EGP';--> statement-breakpoint
ALTER TABLE `journalEntries` MODIFY COLUMN `currencyCode` varchar(3) NOT NULL DEFAULT 'EGP';--> statement-breakpoint
ALTER TABLE `parties` MODIFY COLUMN `currencyCode` varchar(3) NOT NULL DEFAULT 'EGP';--> statement-breakpoint
ALTER TABLE `users` ADD `department` varchar(120);--> statement-breakpoint
ALTER TABLE `users` ADD `permissionTemplate` varchar(120) DEFAULT 'تشغيل عام' NOT NULL;