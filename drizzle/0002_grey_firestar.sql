CREATE TABLE `currencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(3) NOT NULL,
	`name` varchar(80) NOT NULL,
	`symbol` varchar(8) NOT NULL,
	`exchangeRate` decimal(18,6) NOT NULL DEFAULT '1',
	`isBase` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `currencies_id` PRIMARY KEY(`id`),
	CONSTRAINT `currencies_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `invoices` ADD `currencyCode` varchar(3) DEFAULT 'SAR' NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `exchangeRate` decimal(18,6) DEFAULT '1' NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `baseTotal` decimal(18,2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `journalEntries` ADD `currencyCode` varchar(3) DEFAULT 'SAR' NOT NULL;--> statement-breakpoint
ALTER TABLE `journalEntries` ADD `exchangeRate` decimal(18,6) DEFAULT '1' NOT NULL;--> statement-breakpoint
ALTER TABLE `parties` ADD `currencyCode` varchar(3) DEFAULT 'SAR' NOT NULL;