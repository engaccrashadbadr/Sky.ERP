CREATE TABLE `permissionRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subjectType` enum('role','department','template') NOT NULL,
	`subjectValue` varchar(120) NOT NULL,
	`permissionKey` varchar(100) NOT NULL,
	`effect` boolean NOT NULL DEFAULT true,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `permissionRules_id` PRIMARY KEY(`id`)
);
