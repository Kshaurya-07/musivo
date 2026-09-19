import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, unique } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  avatarUrl: text("avatarUrl"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const playlists = mysqlTable("playlists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const playlistTracks = mysqlTable("playlistTracks", {
  id: int("id").autoincrement().primaryKey(),
  playlistId: int("playlistId").notNull(),
  externalId: varchar("externalId", { length: 128 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  artist: varchar("artist", { length: 255 }).notNull(),
  album: varchar("album", { length: 255 }),
  artworkUrl: text("artworkUrl"),
  previewUrl: text("previewUrl"),
  storeUrl: text("storeUrl"),
  durationMs: int("durationMs"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  playlistTrackUnique: unique("playlistTrackUnique").on(table.playlistId, table.externalId),
}));

export const likedTracks = mysqlTable("likedTracks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  externalId: varchar("externalId", { length: 128 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  artist: varchar("artist", { length: 255 }).notNull(),
  album: varchar("album", { length: 255 }),
  artworkUrl: text("artworkUrl"),
  previewUrl: text("previewUrl"),
  storeUrl: text("storeUrl"),
  durationMs: int("durationMs"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  likedTrackUnique: unique("likedTrackUnique").on(table.userId, table.externalId),
}));

export const spotifyConnections = mysqlTable("spotifyConnections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  spotifyUserId: varchar("spotifyUserId", { length: 128 }).notNull(),
  spotifyDisplayName: varchar("spotifyDisplayName", { length: 255 }),
  spotifyProfileImageUrl: text("spotifyProfileImageUrl"),
  accessTokenEncrypted: text("accessTokenEncrypted").notNull(),
  refreshTokenEncrypted: text("refreshTokenEncrypted").notNull(),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt").notNull(),
  scope: text("scope"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const spotifyPlaylists = mysqlTable("spotifyPlaylists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  externalId: varchar("externalId", { length: 128 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  storeUrl: text("storeUrl"),
  trackCount: int("trackCount").default(0).notNull(),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
}, (table) => ({
  spotifyPlaylistUnique: unique("spotifyPlaylistUnique").on(table.userId, table.externalId),
}));

export const spotifyRecentTracks = mysqlTable("spotifyRecentTracks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  externalId: varchar("externalId", { length: 128 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  artist: varchar("artist", { length: 255 }).notNull(),
  album: varchar("album", { length: 255 }),
  artworkUrl: text("artworkUrl"),
  storeUrl: text("storeUrl"),
  playedAt: timestamp("playedAt").notNull(),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
}, (table) => ({
  spotifyRecentUnique: unique("spotifyRecentUnique").on(table.userId, table.externalId, table.playedAt),
}));

export const listeningSessions = mysqlTable("listeningSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contentId: varchar("contentId", { length: 128 }).notNull(),
  contentType: varchar("contentType", { length: 32 }).default("track").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  artist: varchar("artist", { length: 255 }).notNull(),
  artworkUrl: text("artworkUrl"),
  durationMs: int("durationMs"),
  listenedMs: int("listenedMs").notNull(),
  completed: int("completed").default(0).notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt").defaultNow().notNull(),
});

export const userSearches = mysqlTable("userSearches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  query: varchar("query", { length: 255 }).notNull(),
  searchedAt: timestamp("searchedAt").defaultNow().notNull(),
});

export type Playlist = typeof playlists.$inferSelect;
export type InsertPlaylist = typeof playlists.$inferInsert;
export type PlaylistTrack = typeof playlistTracks.$inferSelect;
export type InsertPlaylistTrack = typeof playlistTracks.$inferInsert;
export type LikedTrack = typeof likedTracks.$inferSelect;
export type InsertLikedTrack = typeof likedTracks.$inferInsert;
export type SpotifyConnection = typeof spotifyConnections.$inferSelect;
export type InsertSpotifyConnection = typeof spotifyConnections.$inferInsert;
export type SpotifyPlaylist = typeof spotifyPlaylists.$inferSelect;
export type SpotifyRecentTrack = typeof spotifyRecentTracks.$inferSelect;
export type ListeningSession = typeof listeningSessions.$inferSelect;
export type InsertListeningSession = typeof listeningSessions.$inferInsert;
export type UserSearch = typeof userSearches.$inferSelect;
export type InsertUserSearch = typeof userSearches.$inferInsert;
