CREATE TABLE `listeningSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contentId` varchar(128) NOT NULL,
	`contentType` varchar(32) NOT NULL DEFAULT 'track',
	`title` varchar(255) NOT NULL,
	`artist` varchar(255) NOT NULL,
	`artworkUrl` text,
	`durationMs` int,
	`listenedMs` int NOT NULL,
	`completed` int NOT NULL DEFAULT 0,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`endedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `listeningSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userSearches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`query` varchar(255) NOT NULL,
	`searchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userSearches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;