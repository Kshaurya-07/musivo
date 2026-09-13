import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertLikedTrack, InsertPlaylist, InsertPlaylistTrack, InsertUser, likedTracks, playlistTracks, playlists, users } from "../drizzle/schema";
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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

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
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listUserPlaylists(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(playlists).where(eq(playlists.userId, userId)).orderBy(desc(playlists.updatedAt));
}

export async function createUserPlaylist(values: InsertPlaylist) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(playlists).values(values);
  return { ...values, id: Number(result[0].insertId) };
}

export async function getUserPlaylist(userId: number, playlistId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(playlists).where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId))).limit(1);
  return result[0];
}

export async function listPlaylistTracks(userId: number, playlistId: number) {
  const db = await getDb();
  if (!db) return [];
  const ownedPlaylist = await getUserPlaylist(userId, playlistId);
  if (!ownedPlaylist) return [];
  return db.select().from(playlistTracks).where(eq(playlistTracks.playlistId, playlistId)).orderBy(desc(playlistTracks.createdAt));
}

export async function addTrackToPlaylist(values: InsertPlaylistTrack) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(playlistTracks).values(values).onDuplicateKeyUpdate({ set: { externalId: values.externalId } });
  return values;
}

export async function listLikedTracks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(likedTracks).where(eq(likedTracks.userId, userId)).orderBy(desc(likedTracks.createdAt));
}

export async function hasLikedTrack(userId: number, externalId: string) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: likedTracks.id }).from(likedTracks).where(and(eq(likedTracks.userId, userId), eq(likedTracks.externalId, externalId))).limit(1);
  return result.length > 0;
}

export async function toggleLikedTrack(userId: number, track: Omit<InsertLikedTrack, "userId">) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select({ id: likedTracks.id }).from(likedTracks).where(and(eq(likedTracks.userId, userId), eq(likedTracks.externalId, track.externalId))).limit(1);
  if (existing[0]) {
    await db.delete(likedTracks).where(eq(likedTracks.id, existing[0].id));
    return { liked: false } as const;
  }
  await db.insert(likedTracks).values({ ...track, userId });
  return { liked: true } as const;
}
