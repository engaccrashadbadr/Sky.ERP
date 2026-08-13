CREATE TABLE `approvalTemplateSteps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`stepOrder` int NOT NULL,
	`approverRole` varchar(80),
	`approverUserId` int,
	`approverDepartment` varchar(120),
	`minimumAmount` decimal(18,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approvalTemplateSteps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approvalTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestType` varchar(60) NOT NULL,
	`name` varchar(180) NOT NULL,
	`organizationUnitId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approvalTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorUserId` int,
	`action` varchar(80) NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` int,
	`beforeJson` text,
	`afterJson` text,
	`ipAddress` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizationUnits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`code` varchar(40) NOT NULL,
	`parentId` int,
	`managerUserId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organizationUnits_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizationUnits_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `workflowApprovals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`stepOrder` int NOT NULL,
	`approverUserId` int,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`comment` text,
	`actionedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflowApprovals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflowRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestType` varchar(60) NOT NULL,
	`referenceNumber` varchar(60) NOT NULL,
	`requesterUserId` int NOT NULL,
	`organizationUnitId` int,
	`amount` decimal(18,2) NOT NULL DEFAULT '0',
	`payloadJson` text NOT NULL,
	`status` enum('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`currentStep` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflowRequests_id` PRIMARY KEY(`id`),
	CONSTRAINT `workflowRequests_referenceNumber_unique` UNIQUE(`referenceNumber`)
);
