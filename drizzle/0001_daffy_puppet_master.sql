CREATE TABLE `accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(180) NOT NULL,
	`category` enum('asset','liability','equity','revenue','expense') NOT NULL,
	`parentId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `accounts_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` varchar(60) NOT NULL,
	`entityId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`url` text NOT NULL,
	`mimeType` varchar(120),
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeNumber` varchar(32) NOT NULL,
	`name` varchar(180) NOT NULL,
	`department` varchar(120),
	`phone` varchar(40),
	`baseSalary` decimal(18,2) NOT NULL DEFAULT '0',
	`hireDate` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_employeeNumber_unique` UNIQUE(`employeeNumber`)
);
--> statement-breakpoint
CREATE TABLE `invoiceLines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`productId` int,
	`description` varchar(240) NOT NULL,
	`quantity` decimal(18,3) NOT NULL DEFAULT '1',
	`unitPrice` decimal(18,2) NOT NULL DEFAULT '0',
	`taxRate` decimal(6,2) NOT NULL DEFAULT '0',
	`lineTotal` decimal(18,2) NOT NULL DEFAULT '0',
	CONSTRAINT `invoiceLines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceNumber` varchar(40) NOT NULL,
	`type` enum('sale','purchase') NOT NULL,
	`partyId` int,
	`invoiceDate` timestamp NOT NULL,
	`subtotal` decimal(18,2) NOT NULL DEFAULT '0',
	`discount` decimal(18,2) NOT NULL DEFAULT '0',
	`tax` decimal(18,2) NOT NULL DEFAULT '0',
	`total` decimal(18,2) NOT NULL DEFAULT '0',
	`paid` decimal(18,2) NOT NULL DEFAULT '0',
	`status` enum('draft','issued','partially_paid','paid','overdue') NOT NULL DEFAULT 'draft',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `journalEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entryNumber` varchar(32) NOT NULL,
	`entryDate` timestamp NOT NULL,
	`description` text NOT NULL,
	`status` enum('draft','posted') NOT NULL DEFAULT 'draft',
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `journalEntries_id` PRIMARY KEY(`id`),
	CONSTRAINT `journalEntries_entryNumber_unique` UNIQUE(`entryNumber`)
);
--> statement-breakpoint
CREATE TABLE `journalLines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`journalEntryId` int NOT NULL,
	`accountId` int NOT NULL,
	`debit` decimal(18,2) NOT NULL DEFAULT '0',
	`credit` decimal(18,2) NOT NULL DEFAULT '0',
	`note` text,
	CONSTRAINT `journalLines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kind` enum('credit_limit','low_stock','payment_due','system') NOT NULL,
	`title` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('customer','supplier') NOT NULL,
	`name` varchar(180) NOT NULL,
	`phone` varchar(40),
	`email` varchar(320),
	`taxNumber` varchar(80),
	`creditLimit` decimal(18,2) NOT NULL DEFAULT '0',
	`openingBalance` decimal(18,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `parties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payrollRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`period` varchar(7) NOT NULL,
	`employeeCount` int NOT NULL DEFAULT 0,
	`totalAmount` decimal(18,2) NOT NULL DEFAULT '0',
	`status` enum('draft','processed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payrollRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(64) NOT NULL,
	`barcode` varchar(80),
	`name` varchar(180) NOT NULL,
	`unit` varchar(32) NOT NULL DEFAULT 'قطعة',
	`salePrice` decimal(18,2) NOT NULL DEFAULT '0',
	`purchasePrice` decimal(18,2) NOT NULL DEFAULT '0',
	`quantity` decimal(18,3) NOT NULL DEFAULT '0',
	`minQuantity` decimal(18,3) NOT NULL DEFAULT '0',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `stockMoves` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`type` enum('in','out','adjustment') NOT NULL,
	`quantity` decimal(18,3) NOT NULL,
	`reference` varchar(80),
	`movedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stockMoves_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','accountant','admin') NOT NULL DEFAULT 'user';