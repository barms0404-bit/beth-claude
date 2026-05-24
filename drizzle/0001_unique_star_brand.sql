CREATE TABLE `agentRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`specialistSlug` varchar(64) NOT NULL,
	`specialistName` varchar(128) NOT NULL,
	`runType` enum('manual','scheduled','batch') NOT NULL DEFAULT 'manual',
	`status` enum('success','failed','timeout') NOT NULL DEFAULT 'success',
	`durationMs` int,
	`tokensUsed` int,
	`researchPreview` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agentRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`specialistSlug` varchar(64) NOT NULL,
	`specialistName` varchar(128) NOT NULL,
	`ticker` varchar(10) NOT NULL,
	`action` varchar(32) NOT NULL,
	`conviction` int NOT NULL,
	`priceAtRec` float NOT NULL,
	`priceTarget` varchar(64),
	`timeHorizon` varchar(64),
	`thesis` text,
	`status` enum('active','hit','miss','expired') NOT NULL DEFAULT 'active',
	`priceAtClose` float,
	`returnPct` float,
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `specialistPerformance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`specialistSlug` varchar(64) NOT NULL,
	`specialistName` varchar(128) NOT NULL,
	`totalRecs` int NOT NULL DEFAULT 0,
	`hits` int NOT NULL DEFAULT 0,
	`misses` int NOT NULL DEFAULT 0,
	`hitRate` float DEFAULT 0,
	`avgReturn` float DEFAULT 0,
	`bestReturn` float DEFAULT 0,
	`worstReturn` float DEFAULT 0,
	`weight` float DEFAULT 1,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `specialistPerformance_id` PRIMARY KEY(`id`),
	CONSTRAINT `specialistPerformance_specialistSlug_unique` UNIQUE(`specialistSlug`)
);
