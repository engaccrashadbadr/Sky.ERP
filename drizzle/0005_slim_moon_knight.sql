CREATE TABLE `partyPayments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partyId` int NOT NULL,
	`invoiceId` int,
	`amount` decimal(18,2) NOT NULL,
	`paymentDate` timestamp NOT NULL DEFAULT (now()),
	`method` varchar(40) NOT NULL DEFAULT 'cash',
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partyPayments_id` PRIMARY KEY(`id`)
);
