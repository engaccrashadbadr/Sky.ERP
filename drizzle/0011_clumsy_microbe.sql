CREATE TABLE `monthlyClosings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`period` varchar(7) NOT NULL,
	`status` enum('open','closing','closed','reopened') NOT NULL DEFAULT 'open',
	`closedBy` int,
	`closedAt` timestamp,
	`reopenedBy` int,
	`reopenedAt` timestamp,
	`trialBalanceDifference` decimal(18,2) NOT NULL DEFAULT '0',
	`validationNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monthlyClosings_id` PRIMARY KEY(`id`),
	CONSTRAINT `monthlyClosings_period_unique` UNIQUE(`period`)
);
