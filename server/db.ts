import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertLikedTrack,
  InsertPlaylist,
  InsertPlaylistTrack,
  InsertSpotifyConnection,
  InsertUser,
  LikedTrack,
  Playlist,
  PlaylistTrack,
  SpotifyConnection,
  SpotifyPlaylist,
  SpotifyRecentTrack,
  User,
  likedTracks,
  playlistTracks,
  playlists,
  spotifyConnections,
  spotifyPlaylists,
  spotifyRecentTracks,
  users,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Resilient in-memory fallback store when running without an attached MySQL instance
class MemoryStore {
  users = new Map<string, User>(); // openId -> User
  usersById = new Map<number, User>(); // id -> User
  nextUserId = 1;

  spotifyConnections = new Map<number, SpotifyConnection>(); // userId -> connection
  nextSpotifyConnectionId = 1;

  playlists = new Map<number, Playlist>(); // id -> Playlist
  nextPlaylistId = 1;

  playlistTracks = new Map<number, PlaylistTrack[]>(); // playlistId -> tracks
  nextPlaylistTrackId = 1;

  likedTracks = new Map<number, LikedTrack[]>(); // userId -> tracks
  nextLikedTrackId = 1;

  spotifyPlaylists = new Map<number, SpotifyPlaylist[]>(); // userId -> playlists
  nextSpotifyPlaylistId = 1;

  spotifyRecentTracks = new Map<number, SpotifyRecentTrack[]>(); // userId -> tracks
  nextSpotifyRecentId = 1;

  userSearches = new Map<number, string[]>(); // userId -> recent queries
}

const memoryStore = new MemoryStore();

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (db) {
    try {
      const values: InsertUser = { openId: user.openId };
      const updateSet: Record<string, unknown> = {};
      const textFields = ["name", "email", "loginMethod", "avatarUrl"] as const;

      for (const field of textFields) {
        const value = user[field];
        if (value !== undefined) {
          values[field] = value ?? null;
          updateSet[field] = value ?? null;
        }
      }
      if (user.lastSignedIn !== undefined) {
        values.lastSignedIn = user.lastSignedIn;
        updateSet.lastSignedIn = user.lastSignedIn;
      }
      if (user.role !== undefined) {
        values.role = user.role;
        updateSet.role = user.role;
      } else if (user.openId === ENV.ownerOpenId) {
        values.role = 'admin';
        updateSet.role = 'admin';
      }
      if (!values.lastSignedIn) values.lastSignedIn = new Date();
      if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

      await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
      return;
    } catch (error) {
      console.warn("[Database] MySQL upsert failed; falling back to in-memory store:", error);
    }
  }

  // In-memory fallback
  let existing = memoryStore.users.get(user.openId);
  const now = new Date();
  if (existing) {
    if (user.name !== undefined) existing.name = user.name ?? null;
    if (user.email !== undefined) existing.email = user.email ?? null;
    if (user.avatarUrl !== undefined) existing.avatarUrl = user.avatarUrl ?? null;
    if (user.loginMethod !== undefined) existing.loginMethod = user.loginMethod ?? null;
    if (user.role !== undefined) existing.role = user.role;
    existing.lastSignedIn = user.lastSignedIn ?? now;
    existing.updatedAt = now;
  } else {
    const id = memoryStore.nextUserId++;
    const role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
    existing = {
      id,
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      avatarUrl: user.avatarUrl ?? null,
      loginMethod: user.loginMethod ?? null,
      role,
      createdAt: now,
      updatedAt: now,
      lastSignedIn: user.lastSignedIn ?? now,
    };
    memoryStore.users.set(user.openId, existing);
    memoryStore.usersById.set(id, existing);
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (db) {
    try {
      const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
      if (result.length > 0) return result[0];
    } catch (err) {
      console.warn("[Database] getUserByOpenId MySQL query failed; checking memory:", err);
    }
  }
  return memoryStore.users.get(openId);
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (db) {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (result.length > 0) return result[0];
    } catch (err) {
      console.warn("[Database] getUserById MySQL query failed; checking memory:", err);
    }
  }
  return memoryStore.usersById.get(id);
}

export async function getUserByEmail(email: string) {
  if (!email) return undefined;
  const normalized = email.trim().toLowerCase();
  const db = await getDb();
  if (db) {
    try {
      const result = await db.select().from(users).where(eq(users.email, normalized)).limit(1);
      if (result.length > 0) return result[0];
    } catch (err) {
      console.warn("[Database] getUserByEmail MySQL query failed; checking memory:", err);
    }
  }
  return Array.from(memoryStore.users.values()).find(
    (u) => u.email?.trim().toLowerCase() === normalized
  );
}

export async function listUserPlaylists(userId: number) {
  const db = await getDb();
  if (db) {
    try {
      return await db.select().from(playlists).where(eq(playlists.userId, userId)).orderBy(desc(playlists.updatedAt));
    } catch (err) {
      console.warn("[Database] listUserPlaylists MySQL failed; checking memory:", err);
    }
  }
  return Array.from(memoryStore.playlists.values())
    .filter((p) => p.userId === userId)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function createUserPlaylist(values: InsertPlaylist) {
  const db = await getDb();
  if (db) {
    try {
      const result = await db.insert(playlists).values(values);
      return { ...values, id: Number(result[0].insertId) };
    } catch (err) {
      console.warn("[Database] createUserPlaylist MySQL failed; saving to memory:", err);
    }
  }
  const id = memoryStore.nextPlaylistId++;
  const now = new Date();
  const playlist: Playlist = {
    id,
    userId: values.userId,
    name: values.name,
    description: values.description ?? null,
    createdAt: now,
    updatedAt: now,
  };
  memoryStore.playlists.set(id, playlist);
  return playlist;
}

export async function getUserPlaylist(userId: number, playlistId: number) {
  const db = await getDb();
  if (db) {
    try {
      const result = await db.select().from(playlists).where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId))).limit(1);
      if (result[0]) return result[0];
    } catch (err) {
      console.warn("[Database] getUserPlaylist MySQL failed; checking memory:", err);
    }
  }
  const pl = memoryStore.playlists.get(playlistId);
  return pl && pl.userId === userId ? pl : undefined;
}

export async function listPlaylistTracks(userId: number, playlistId: number) {
  const db = await getDb();
  if (db) {
    try {
      const ownedPlaylist = await getUserPlaylist(userId, playlistId);
      if (!ownedPlaylist) return [];
      return await db.select().from(playlistTracks).where(eq(playlistTracks.playlistId, playlistId)).orderBy(desc(playlistTracks.createdAt));
    } catch (err) {
      console.warn("[Database] listPlaylistTracks MySQL failed; checking memory:", err);
    }
  }
  const pl = await getUserPlaylist(userId, playlistId);
  if (!pl) return [];
  return memoryStore.playlistTracks.get(playlistId) ?? [];
}

export async function addTrackToPlaylist(values: InsertPlaylistTrack) {
  const db = await getDb();
  if (db) {
    try {
      await db.insert(playlistTracks).values(values).onDuplicateKeyUpdate({ set: { externalId: values.externalId } });
      return values;
    } catch (err) {
      console.warn("[Database] addTrackToPlaylist MySQL failed; saving to memory:", err);
    }
  }
  const tracks = memoryStore.playlistTracks.get(values.playlistId) ?? [];
  const existingIdx = tracks.findIndex((t) => t.externalId === values.externalId);
  const item: PlaylistTrack = {
    id: memoryStore.nextPlaylistTrackId++,
    playlistId: values.playlistId,
    externalId: values.externalId,
    title: values.title,
    artist: values.artist,
    album: values.album ?? null,
    artworkUrl: values.artworkUrl ?? null,
    previewUrl: values.previewUrl ?? null,
    storeUrl: values.storeUrl ?? null,
    durationMs: values.durationMs ?? null,
    createdAt: new Date(),
  };
  if (existingIdx >= 0) {
    tracks[existingIdx] = item;
  } else {
    tracks.unshift(item);
  }
  memoryStore.playlistTracks.set(values.playlistId, tracks);
  return values;
}

export async function listLikedTracks(userId: number) {
  const db = await getDb();
  if (db) {
    try {
      return await db.select().from(likedTracks).where(eq(likedTracks.userId, userId)).orderBy(desc(likedTracks.createdAt));
    } catch (err) {
      console.warn("[Database] listLikedTracks MySQL failed; checking memory:", err);
    }
  }
  return memoryStore.likedTracks.get(userId) ?? [];
}

export async function hasLikedTrack(userId: number, externalId: string) {
  const db = await getDb();
  if (db) {
    try {
      const result = await db.select({ id: likedTracks.id }).from(likedTracks).where(and(eq(likedTracks.userId, userId), eq(likedTracks.externalId, externalId))).limit(1);
      return result.length > 0;
    } catch (err) {
      console.warn("[Database] hasLikedTrack MySQL failed; checking memory:", err);
    }
  }
  return Boolean(memoryStore.likedTracks.get(userId)?.some((t) => t.externalId === externalId));
}

export async function toggleLikedTrack(userId: number, track: Omit<InsertLikedTrack, "userId">) {
  const db = await getDb();
  if (db) {
    try {
      const existing = await db.select({ id: likedTracks.id }).from(likedTracks).where(and(eq(likedTracks.userId, userId), eq(likedTracks.externalId, track.externalId))).limit(1);
      if (existing[0]) {
        await db.delete(likedTracks).where(eq(likedTracks.id, existing[0].id));
        return { liked: false } as const;
      }
      await db.insert(likedTracks).values({ ...track, userId });
      return { liked: true } as const;
    } catch (err) {
      console.warn("[Database] toggleLikedTrack MySQL failed; using memory fallback:", err);
    }
  }
  const tracks = memoryStore.likedTracks.get(userId) ?? [];
  const idx = tracks.findIndex((t) => t.externalId === track.externalId);
  if (idx >= 0) {
    tracks.splice(idx, 1);
    memoryStore.likedTracks.set(userId, tracks);
    return { liked: false } as const;
  }
  const item: LikedTrack = {
    id: memoryStore.nextLikedTrackId++,
    userId,
    externalId: track.externalId,
    title: track.title,
    artist: track.artist,
    album: track.album ?? null,
    artworkUrl: track.artworkUrl ?? null,
    previewUrl: track.previewUrl ?? null,
    storeUrl: track.storeUrl ?? null,
    durationMs: track.durationMs ?? null,
    createdAt: new Date(),
  };
  tracks.unshift(item);
  memoryStore.likedTracks.set(userId, tracks);
  return { liked: true } as const;
}

export async function syncSpotifySavedTracksToLiked(
  userId: number,
  tracks: Array<Omit<InsertLikedTrack, "userId">>
): Promise<number> {
  const db = await getDb();
  if (db) {
    try {
      let insertedCount = 0;
      for (const track of tracks) {
        const existing = await db
          .select({ id: likedTracks.id })
          .from(likedTracks)
          .where(and(eq(likedTracks.userId, userId), eq(likedTracks.externalId, track.externalId)))
          .limit(1);
        if (!existing.length) {
          await db.insert(likedTracks).values({ ...track, userId });
          insertedCount++;
        }
      }
      return insertedCount;
    } catch (err) {
      console.warn("[Database] syncSpotifySavedTracksToLiked MySQL failed; using memory fallback:", err);
    }
  }

  const existing = memoryStore.likedTracks.get(userId) ?? [];
  const existingMap = new Map(existing.map((t) => [t.externalId, t]));
  let added = 0;

  for (const track of tracks) {
    if (!existingMap.has(track.externalId)) {
      const item: LikedTrack = {
        id: memoryStore.nextLikedTrackId++,
        userId,
        externalId: track.externalId,
        title: track.title,
        artist: track.artist,
        album: track.album ?? null,
        artworkUrl: track.artworkUrl ?? null,
        previewUrl: track.previewUrl ?? null,
        storeUrl: track.storeUrl ?? null,
        durationMs: track.durationMs ?? null,
        createdAt: new Date(),
      };
      existing.push(item);
      existingMap.set(track.externalId, item);
      added++;
    }
  }

  memoryStore.likedTracks.set(userId, existing);
  return added;
}

export async function storeUserRecentSearch(userId: number, query: string): Promise<void> {
  const trimmed = query.trim();
  if (!trimmed) return;
  const list = memoryStore.userSearches.get(userId) ?? [];
  const filtered = list.filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
  filtered.unshift(trimmed);
  memoryStore.userSearches.set(userId, filtered.slice(0, 10));
}

export async function getUserRecentSearches(userId: number): Promise<string[]> {
  return memoryStore.userSearches.get(userId) ?? [];
}

export async function getFamiliarTrackIds(userId?: number): Promise<Set<string>> {
  if (!userId) return new Set();
  const liked = await listLikedTracks(userId).catch(() => []);
  const recent = await listSpotifyRecentTracks(userId).catch(() => []);
  const ids = new Set<string>();
  liked.forEach((t) => {
    ids.add(String(t.externalId));
    ids.add(String(t.externalId).replace(/^spotify-/, ""));
  });
  recent.forEach((t) => {
    ids.add(String(t.externalId));
    ids.add(String(t.externalId).replace(/^spotify-/, ""));
  });
  return ids;
}

export async function getSpotifyConnection(userId: number) {
  const db = await getDb();
  if (db) {
    try {
      const result = await db.select().from(spotifyConnections).where(eq(spotifyConnections.userId, userId)).limit(1);
      if (result[0]) return result[0];
    } catch (err) {
      console.warn("[Database] getSpotifyConnection MySQL failed; checking memory:", err);
    }
  }
  return memoryStore.spotifyConnections.get(userId);
}

export async function getSpotifyConnectionBySpotifyUserId(spotifyUserId: string) {
  if (!spotifyUserId) return undefined;
  const db = await getDb();
  if (db) {
    try {
      const result = await db.select().from(spotifyConnections).where(eq(spotifyConnections.spotifyUserId, spotifyUserId)).limit(1);
      if (result[0]) return result[0];
    } catch (err) {
      console.warn("[Database] getSpotifyConnectionBySpotifyUserId MySQL failed; checking memory:", err);
    }
  }
  return Array.from(memoryStore.spotifyConnections.values()).find(
    (c) => c.spotifyUserId === spotifyUserId
  );
}

export async function getUserSavedTracksCount(userId: number) {
  const db = await getDb();
  if (db) {
    try {
      const result = await db.select({ id: likedTracks.id }).from(likedTracks).where(eq(likedTracks.userId, userId));
      return result.length;
    } catch (err) {
      console.warn("[Database] getUserSavedTracksCount MySQL failed; checking memory:", err);
    }
  }
  return memoryStore.likedTracks.get(userId)?.length ?? 0;
}

export async function getSpotifyConnectionStatus(userId: number) {
  const connection = await getSpotifyConnection(userId);
  if (!connection) {
    return {
      connected: false as const,
      displayName: null,
      profileImageUrl: null,
      spotifyUserId: null,
      scope: null,
      updatedAt: null,
      savedTracksCount: 0,
    };
  }
  const savedTracksCount = await getUserSavedTracksCount(userId);
  return {
    connected: true as const,
    displayName: connection.spotifyDisplayName,
    profileImageUrl: connection.spotifyProfileImageUrl,
    spotifyUserId: connection.spotifyUserId,
    scope: connection.scope,
    updatedAt: connection.updatedAt,
    savedTracksCount,
  };
}

export async function upsertSpotifyConnection(values: InsertSpotifyConnection) {
  const db = await getDb();
  if (db) {
    try {
      await db.insert(spotifyConnections).values(values).onDuplicateKeyUpdate({
        set: {
          spotifyUserId: values.spotifyUserId,
          spotifyDisplayName: values.spotifyDisplayName,
          spotifyProfileImageUrl: values.spotifyProfileImageUrl,
          accessTokenEncrypted: values.accessTokenEncrypted,
          refreshTokenEncrypted: values.refreshTokenEncrypted,
          accessTokenExpiresAt: values.accessTokenExpiresAt,
          scope: values.scope,
          updatedAt: new Date(),
        },
      });
      return;
    } catch (err) {
      console.warn("[Database] upsertSpotifyConnection MySQL failed; saving to memory:", err);
    }
  }
  const existing = memoryStore.spotifyConnections.get(values.userId);
  const now = new Date();
  const conn: SpotifyConnection = {
    id: existing?.id ?? memoryStore.nextSpotifyConnectionId++,
    userId: values.userId,
    spotifyUserId: values.spotifyUserId,
    spotifyDisplayName: values.spotifyDisplayName ?? null,
    spotifyProfileImageUrl: values.spotifyProfileImageUrl ?? null,
    accessTokenEncrypted: values.accessTokenEncrypted,
    refreshTokenEncrypted: values.refreshTokenEncrypted,
    accessTokenExpiresAt: values.accessTokenExpiresAt,
    scope: values.scope ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  memoryStore.spotifyConnections.set(values.userId, conn);
}

export async function updateSpotifyConnectionTokens(userId: number, values: Pick<InsertSpotifyConnection, "accessTokenEncrypted" | "refreshTokenEncrypted" | "accessTokenExpiresAt" | "scope">) {
  const db = await getDb();
  if (db) {
    try {
      await db.update(spotifyConnections).set({ ...values, updatedAt: new Date() }).where(eq(spotifyConnections.userId, userId));
      return;
    } catch (err) {
      console.warn("[Database] updateSpotifyConnectionTokens MySQL failed; updating memory:", err);
    }
  }
  const conn = memoryStore.spotifyConnections.get(userId);
  if (conn) {
    conn.accessTokenEncrypted = values.accessTokenEncrypted;
    if (values.refreshTokenEncrypted) conn.refreshTokenEncrypted = values.refreshTokenEncrypted;
    conn.accessTokenExpiresAt = values.accessTokenExpiresAt;
    if (values.scope) conn.scope = values.scope;
    conn.updatedAt = new Date();
  }
}

export async function deleteSpotifyConnection(userId: number) {
  const db = await getDb();
  if (db) {
    try {
      await db.delete(spotifyConnections).where(eq(spotifyConnections.userId, userId));
      await db.delete(spotifyPlaylists).where(eq(spotifyPlaylists.userId, userId));
      await db.delete(spotifyRecentTracks).where(eq(spotifyRecentTracks.userId, userId));
      return;
    } catch (err) {
      console.warn("[Database] deleteSpotifyConnection MySQL failed; deleting from memory:", err);
    }
  }
  memoryStore.spotifyConnections.delete(userId);
  memoryStore.spotifyPlaylists.delete(userId);
  memoryStore.spotifyRecentTracks.delete(userId);
}

export async function listSpotifyPlaylists(userId: number) {
  const db = await getDb();
  if (db) {
    try {
      return await db.select().from(spotifyPlaylists).where(eq(spotifyPlaylists.userId, userId)).orderBy(desc(spotifyPlaylists.syncedAt));
    } catch (err) {
      console.warn("[Database] listSpotifyPlaylists MySQL failed; checking memory:", err);
    }
  }
  return memoryStore.spotifyPlaylists.get(userId) ?? [];
}

export async function getSpotifyPlaylist(userId: number, externalId: string) {
  const db = await getDb();
  if (db) {
    try {
      const result = await db.select().from(spotifyPlaylists).where(and(eq(spotifyPlaylists.userId, userId), eq(spotifyPlaylists.externalId, externalId))).limit(1);
      if (result[0]) return result[0];
    } catch (err) {
      console.warn("[Database] getSpotifyPlaylist MySQL failed; checking memory:", err);
    }
  }
  return (memoryStore.spotifyPlaylists.get(userId) ?? []).find((p) => p.externalId === externalId);
}

export async function listSpotifyRecentTracks(userId: number) {
  const db = await getDb();
  if (db) {
    try {
      return await db.select().from(spotifyRecentTracks).where(eq(spotifyRecentTracks.userId, userId)).orderBy(desc(spotifyRecentTracks.playedAt));
    } catch (err) {
      console.warn("[Database] listSpotifyRecentTracks MySQL failed; checking memory:", err);
    }
  }
  return memoryStore.spotifyRecentTracks.get(userId) ?? [];
}

export async function replaceSpotifyPlaylists(userId: number, values: Array<Omit<typeof spotifyPlaylists.$inferInsert, "userId">>) {
  const db = await getDb();
  if (db) {
    try {
      await db.delete(spotifyPlaylists).where(eq(spotifyPlaylists.userId, userId));
      for (const value of values) {
        await db.insert(spotifyPlaylists).values({ ...value, userId });
      }
      return;
    } catch (err) {
      console.warn("[Database] replaceSpotifyPlaylists MySQL failed; saving to memory:", err);
    }
  }
  const now = new Date();
  const items: SpotifyPlaylist[] = values.map((v) => ({
    id: memoryStore.nextSpotifyPlaylistId++,
    userId,
    externalId: v.externalId,
    name: v.name,
    description: v.description ?? null,
    imageUrl: v.imageUrl ?? null,
    storeUrl: v.storeUrl ?? null,
    trackCount: v.trackCount ?? 0,
    syncedAt: now,
  }));
  memoryStore.spotifyPlaylists.set(userId, items);
}

export async function replaceSpotifyRecentTracks(userId: number, values: Array<Omit<typeof spotifyRecentTracks.$inferInsert, "userId">>) {
  const db = await getDb();
  if (db) {
    try {
      await db.delete(spotifyRecentTracks).where(eq(spotifyRecentTracks.userId, userId));
      for (const value of values) {
        await db.insert(spotifyRecentTracks).values({ ...value, userId });
      }
      return;
    } catch (err) {
      console.warn("[Database] replaceSpotifyRecentTracks MySQL failed; saving to memory:", err);
    }
  }
  const now = new Date();
  const items: SpotifyRecentTrack[] = values.map((v) => ({
    id: memoryStore.nextSpotifyRecentId++,
    userId,
    externalId: v.externalId,
    title: v.title,
    artist: v.artist,
    album: v.album ?? null,
    artworkUrl: v.artworkUrl ?? null,
    storeUrl: v.storeUrl ?? null,
    playedAt: v.playedAt instanceof Date ? v.playedAt : new Date(v.playedAt),
    syncedAt: now,
  }));
  memoryStore.spotifyRecentTracks.set(userId, items);
}
