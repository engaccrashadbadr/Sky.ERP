CREATE TABLE `bomLines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bomId` int NOT NULL,
	`componentProductId` int NOT NULL,
	`quantity` decimal(18,4) NOT NULL,
	`scrapRate` decimal(9,4) NOT NULL DEFAULT '0',
	`costCenterId` int,
	`sequence` int NOT NULL DEFAULT 1,
	CONSTRAINT `bomLines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`version` varchar(32) NOT NULL,
	`quantity` decimal(18,3) NOT NULL DEFAULT '1',
	`status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
	`costingMethodId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `boms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `costDistributions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`period` varchar(7) NOT NULL,
	`productId` int NOT NULL,
	`costCenterId` int NOT NULL,
	`costElementId` int NOT NULL,
	`basis` enum('material','resource','overhead','outside_processing') NOT NULL,
	`amount` decimal(18,2) NOT NULL,
	`sourceType` varchar(48) NOT NULL,
	`sourceId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `costDistributions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `costingMethods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(40) NOT NULL,
	`name` varchar(160) NOT NULL,
	`method` enum('standard','perpetual_average','periodic_average','fifo') NOT NULL,
	`isOfficial` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `costingMethods_id` PRIMARY KEY(`id`),
	CONSTRAINT `costingMethods_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `workOrderOperations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workOrderId` int NOT NULL,
	`sequence` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`costCenterId` int,
	`resourceRate` decimal(18,2) NOT NULL DEFAULT '0',
	`plannedHours` decimal(18,3) NOT NULL DEFAULT '0',
	`actualHours` decimal(18,3) NOT NULL DEFAULT '0',
	`outsideProcessingCost` decimal(18,2) NOT NULL DEFAULT '0',
	`status` enum('planned','started','completed') NOT NULL DEFAULT 'planned',
	CONSTRAINT `workOrderOperations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(48) NOT NULL,
	`productId` int NOT NULL,
	`bomId` int,
	`costCenterId` int,
	`plannedQuantity` decimal(18,3) NOT NULL,
	`completedQuantity` decimal(18,3) NOT NULL DEFAULT '0',
	`status` enum('planned','released','in_progress','completed','closed','cancelled') NOT NULL DEFAULT 'planned',
	`plannedStart` timestamp,
	`plannedEnd` timestamp,
	`actualMaterialCost` decimal(18,2) NOT NULL DEFAULT '0',
	`actualResourceCost` decimal(18,2) NOT NULL DEFAULT '0',
	`actualOverheadCost` decimal(18,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workOrders_id` PRIMARY KEY(`id`),
	CONSTRAINT `workOrders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
ALTER TABLE `products` ADD `productClass` enum('raw_material','semi_finished','finished_product') DEFAULT 'raw_material' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `classificationNote` varchar(240);