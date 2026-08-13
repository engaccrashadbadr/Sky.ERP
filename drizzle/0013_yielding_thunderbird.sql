CREATE TABLE `bankReconciliations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceKey` varchar(160) NOT NULL,
	`reconciliationDate` timestamp NOT NULL,
	`documentNumber` varchar(80),
	`accountName` varchar(180),
	`statementDebit` decimal(18,2) NOT NULL DEFAULT '0',
	`statementCredit` decimal(18,2) NOT NULL DEFAULT '0',
	`description` text,
	`status` enum('unmatched','matched','review') NOT NULL DEFAULT 'review',
	`sourceJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bankReconciliations_id` PRIMARY KEY(`id`),
	CONSTRAINT `bankReconciliations_sourceKey_unique` UNIQUE(`sourceKey`)
);
--> statement-breakpoint
CREATE TABLE `legacyTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceKey` varchar(200) NOT NULL,
	`sourceWorkbook` varchar(180) NOT NULL,
	`sourceSheet` varchar(120) NOT NULL,
	`sourceRow` int NOT NULL,
	`module` varchar(80) NOT NULL,
	`documentType` varchar(80),
	`journalEntryId` int,
	`sourceJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `legacyTransactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `legacyTransactions_sourceKey_unique` UNIQUE(`sourceKey`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(80) NOT NULL,
	`name` varchar(180) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `projects_code_unique` UNIQUE(`code`)
);
