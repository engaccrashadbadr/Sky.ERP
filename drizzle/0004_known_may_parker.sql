CREATE TABLE `attendanceRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`attendanceDate` timestamp NOT NULL,
	`status` enum('present','absent','late','leave') NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attendanceRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cashDrawerSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openedAt` timestamp NOT NULL DEFAULT (now()),
	`closedAt` timestamp,
	`openingAmount` decimal(18,2) NOT NULL DEFAULT '0',
	`closingAmount` decimal(18,2),
	`status` enum('open','closed') NOT NULL DEFAULT 'open',
	`notes` text,
	CONSTRAINT `cashDrawerSessions_id` PRIMARY KEY(`id`)
);
