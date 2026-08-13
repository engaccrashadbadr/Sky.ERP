CREATE TABLE `costTypes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(40) NOT NULL,
	`name` varchar(160) NOT NULL,
	`scenario` enum('actual','standard','budget','simulation') NOT NULL,
	`affectsInventoryValuation` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `costTypes_id` PRIMARY KEY(`id`),
	CONSTRAINT `costTypes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `costElements` MODIFY COLUMN `category` enum('material','material_overhead','resource','labor','overhead','outside_processing','other') NOT NULL;