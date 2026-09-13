CREATE TABLE `likedTracks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`externalId` varchar(128) NOT NULL,
	`title` varchar(255) NOT NULL,
	`artist` varchar(255) NOT NULL,
	`album` varchar(255),
	`artworkUrl` text,
	`previewUrl` text,
	`storeUrl` text,
	`durationMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `likedTracks_id` PRIMARY KEY(`id`),
	CONSTRAINT `likedTrackUnique` UNIQUE(`userId`,`externalId`)
);
