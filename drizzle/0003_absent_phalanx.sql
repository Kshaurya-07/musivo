CREATE TABLE `spotifyConnections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`spotifyUserId` varchar(128) NOT NULL,
	`spotifyDisplayName` varchar(255),
	`accessTokenEncrypted` text NOT NULL,
	`refreshTokenEncrypted` text NOT NULL,
	`accessTokenExpiresAt` timestamp NOT NULL,
	`scope` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `spotifyConnections_id` PRIMARY KEY(`id`),
	CONSTRAINT `spotifyConnections_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `spotifyPlaylists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`externalId` varchar(128) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`imageUrl` text,
	`storeUrl` text,
	`trackCount` int NOT NULL DEFAULT 0,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `spotifyPlaylists_id` PRIMARY KEY(`id`),
	CONSTRAINT `spotifyPlaylistUnique` UNIQUE(`userId`,`externalId`)
);
--> statement-breakpoint
CREATE TABLE `spotifyRecentTracks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`externalId` varchar(128) NOT NULL,
	`title` varchar(255) NOT NULL,
	`artist` varchar(255) NOT NULL,
	`album` varchar(255),
	`artworkUrl` text,
	`storeUrl` text,
	`playedAt` timestamp NOT NULL,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `spotifyRecentTracks_id` PRIMARY KEY(`id`),
	CONSTRAINT `spotifyRecentUnique` UNIQUE(`userId`,`externalId`,`playedAt`)
);
