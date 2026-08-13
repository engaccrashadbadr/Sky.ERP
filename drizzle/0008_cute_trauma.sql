CREATE TABLE `costAllocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`costCenterId` int NOT NULL,
	`targetAccountId` int NOT NULL,
	`basis` enum('revenue','quantity','headcount','manual') NOT NULL,
	`allocationRate` decimal(9,4) NOT NULL DEFAULT '0',
	`period` varchar(7) NOT NULL,
	`description` varchar(240),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `costAllocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `costCenters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(40) NOT NULL,
	`name` varchar(160) NOT NULL,
	`parentId` int,
	`managerUserId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `costCenters_id` PRIMARY KEY(`id`),
	CONSTRAINT `costCenters_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `costElements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(40) NOT NULL,
	`name` varchar(160) NOT NULL,
	`category` enum('material','labor','overhead','other') NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `costElements_id` PRIMARY KEY(`id`),
	CONSTRAINT `costElements_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `productCosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`costCenterId` int,
	`costElementId` int NOT NULL,
	`standardCost` decimal(18,2) NOT NULL DEFAULT '0',
	`actualCost` decimal(18,2) NOT NULL DEFAULT '0',
	`currencyCode` varchar(3) NOT NULL DEFAULT 'EGP',
	`effectiveFrom` timestamp NOT NULL,
	`effectiveTo` timestamp,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productCosts_id` PRIMARY KEY(`id`)
);
