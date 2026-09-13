import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./_core/env";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";

export type CatalogTrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  art: string;
  audio: string;
  storeUrl: string;
  durationMs: number | null;
  accent: string;
  source: "Spotify" | "iTunes";
};

type SpotifyTrack = {
  id: string;
  name: string;
  artists?: Array<{ name?: string }>;
  album?: { name?: string; images?: Array<{ url?: string }> };
  duration_ms?: number;
  preview_url?: string | null;
  external_urls?: { spotify?: string };
};

type SpotifySearchResponse = { tracks?: { items?: SpotifyTrack[] } };
type SpotifyTokenResponse = { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string; token_type?: string };
type SpotifyProfile = { id?: string; display_name?: string | null; images?: Array<{ url?: string }> };
type SpotifyPlaylistResponse = { items?: Array<{ id?: string; name?: string; description?: string | null; images?: Array<{ url?: string }>; external_urls?: { spotify?: string }; tracks?: { total?: number } }> };
type SpotifyRecentResponse = { items?: Array<{ played_at?: string; track?: SpotifyTrack | null }> };
type SpotifyPlaylistTracksResponse = { items?: Array<{ track?: SpotifyTrack | null }> };

type SpotifySavedTracksResponse = { total?: number; items?: Array<{ added_at?: string; track?: SpotifyTrack | null }> };

export type SpotifyStatePayload = {
  userId?: number;
  isLogin?: boolean;
  nonce: string;
  redirectUri: string;
  returnTo?: string;
};

const USER_SCOPES = [
  "streaming",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "user-library-read",
  "playlist-read-private",
  "playlist-read-collaborative",
  "playlist-modify-private",
  "user-read-recently-played",
  "user-read-private",
  "user-read-email",
].join(" ");

let cachedToken: { value: string; expiresAt: number } | null = null;

function getEncryptionKey() {
  const secret = ENV.cookieSecret || ENV.spotifyClientSecret;
  if (!secret) throw new Error("JWT_SECRET is required to encrypt Spotify tokens");
  return createHash("sha256").update(secret).digest();
}

function encode(value: Buffer) {
  return value.toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url");
}

export function encryptSpotifyToken(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `${encode(iv)}.${encode(cipher.getAuthTag())}.${encode(ciphertext)}`;
}

export function decryptSpotifyToken(value: string) {
  const [ivEncoded, tagEncoded, ciphertextEncoded] = value.split(".");
  if (!ivEncoded || !tagEncoded || !ciphertextEncoded) throw new Error("Invalid encrypted Spotify token");
  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), decode(ivEncoded));
  decipher.setAuthTag(decode(tagEncoded));
  return Buffer.concat([decipher.update(decode(ciphertextEncoded)), decipher.final()]).toString("utf8");
}

export function hasSpotifyCredentials() {
  return Boolean(ENV.spotifyClientId && ENV.spotifyClientSecret);
}

function getSessionKey() {
  const secret = ENV.cookieSecret || ENV.spotifyClientSecret;
  if (!secret) throw new Error("JWT_SECRET is required for Spotify OAuth state");
  return new TextEncoder().encode(secret);
}

export async function createSpotifyState(payload: SpotifyStatePayload) {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(getSessionKey());
}

export async function verifySpotifyState(state: string): Promise<SpotifyStatePayload | null> {
  try {
    const { payload } = await jwtVerify(state, getSessionKey(), { algorithms: ["HS256"] });
    const nonce = typeof payload.nonce === "string" ? payload.nonce : "";
    const redirectUri = typeof payload.redirectUri === "string" ? payload.redirectUri : "";
    if (!nonce || !redirectUri) return null;
    const userId = typeof payload.userId === "number" && Number.isInteger(payload.userId) && payload.userId > 0
      ? payload.userId
      : undefined;
    const isLogin = Boolean(payload.isLogin);
    const returnTo = typeof payload.returnTo === "string" ? payload.returnTo : undefined;
    if (!userId && !isLogin) return null;
    return { userId, isLogin, nonce, redirectUri, returnTo };
  } catch {
    return null;
  }
}

export function buildSpotifyAuthorizeUrl(state: string, redirectUri: string) {
  if (!hasSpotifyCredentials()) throw new Error("Spotify credentials are not configured");
  const url = new URL("https://accounts.spotify.com/authorize");
  url.searchParams.set("client_id", ENV.spotifyClientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", USER_SCOPES);
  url.searchParams.set("state", state);
  url.searchParams.set("show_dialog", "false");
  return url.toString();
}

async function requestSpotifyToken(body: URLSearchParams) {
  const basic = Buffer.from(`${ENV.spotifyClientId}:${ENV.spotifyClientSecret}`).toString("base64");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const payload = (await response.json()) as SpotifyTokenResponse & { error?: string; error_description?: string };
  if (!response.ok || !payload.access_token) {
    const detail = payload.error_description || payload.error || `HTTP ${response.status}`;
    throw new Error(`Spotify token request failed with ${response.status}: ${detail}`);
  }
  return payload;
}

async function getSpotifyAccessToken() {
  if (!hasSpotifyCredentials()) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;
  try {
    const payload = await requestSpotifyToken(new URLSearchParams({ grant_type: "client_credentials" }));
    cachedToken = {
      value: payload.access_token!,
      expiresAt: Date.now() + Math.max(60, payload.expires_in ?? 3600) * 1000,
    };
    return cachedToken.value;
  } catch (error) {
    console.warn("[Spotify] Client credentials grant failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function exchangeUserCode(code: string, redirectUri: string) {
  return requestSpotifyToken(new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri }));
}

export async function fetchSpotifyProfile(accessToken: string) {
  return spotifyUserFetchWithToken<SpotifyProfile & { email?: string }>(accessToken, "/me");
}

async function refreshUserAccessToken(userId: number) {
  const connection = await db.getSpotifyConnection(userId);
  if (!connection) throw new Error("Spotify account is not connected");
  const payload = await requestSpotifyToken(new URLSearchParams({ grant_type: "refresh_token", refresh_token: decryptSpotifyToken(connection.refreshTokenEncrypted) }));
  await db.updateSpotifyConnectionTokens(userId, {
    accessTokenEncrypted: encryptSpotifyToken(payload.access_token!),
    refreshTokenEncrypted: payload.refresh_token ? encryptSpotifyToken(payload.refresh_token) : connection.refreshTokenEncrypted,
    accessTokenExpiresAt: new Date(Date.now() + Math.max(60, payload.expires_in ?? 3600) * 1000),
    scope: payload.scope ?? connection.scope,
  });
  return payload.access_token!;
}

export async function getUserSpotifyAccessToken(userId: number) {
  const connection = await db.getSpotifyConnection(userId);
  if (!connection) throw new Error("Spotify account is not connected");
  if (connection.accessTokenExpiresAt.getTime() > Date.now() + 60_000) return decryptSpotifyToken(connection.accessTokenEncrypted);
  return refreshUserAccessToken(userId);
}

async function spotifyUserFetch<T>(userId: number, path: string) {
  const accessToken = await getUserSpotifyAccessToken(userId);
  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Spotify user API request failed with ${response.status}`);
  return (await response.json()) as T;
}

export async function completeSpotifyConnection(userId: number, code: string, redirectUri: string) {
  const payload = await exchangeUserCode(code, redirectUri);
  if (!payload.refresh_token) throw new Error("Spotify did not return a refresh token");
  const profile = await spotifyUserFetchWithToken<SpotifyProfile & { email?: string }>(payload.access_token!, "/me");
  if (!profile.id) throw new Error("Spotify profile did not include an id");
  await db.upsertSpotifyConnection({
    userId,
    spotifyUserId: profile.id,
    spotifyDisplayName: profile.display_name ?? null,
    spotifyProfileImageUrl: profile.images?.[0]?.url ?? null,
    accessTokenEncrypted: encryptSpotifyToken(payload.access_token!),
    refreshTokenEncrypted: encryptSpotifyToken(payload.refresh_token),
    accessTokenExpiresAt: new Date(Date.now() + Math.max(60, payload.expires_in ?? 3600) * 1000),
    scope: payload.scope ?? USER_SCOPES,
  });
  return { ...profile, accessToken: payload.access_token!, refreshToken: payload.refresh_token };
}

async function spotifyUserFetchWithToken<T>(accessToken: string, path: string) {
  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Spotify user API request failed with ${response.status}`);
  return (await response.json()) as T;
}

async function spotifyUserRequest<T>(userId: number, path: string, init: RequestInit) {
  const accessToken = await getUserSpotifyAccessToken(userId);
  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`Spotify user API request failed with ${response.status}`);
  return (await response.json()) as T;
}

async function searchSpotifyUserTrack(userId: number, title: string, artist: string) {
  const payload = await spotifyUserFetch<SpotifySearchResponse>(userId, `/search?q=${encodeURIComponent(`track:${title} artist:${artist}`)}&type=track&limit=1&market=${encodeURIComponent(ENV.spotifyMarket || "US")}`);
  return payload.tracks?.items?.[0];
}

export async function createSpotifyPlaylist(userId: number, name: string, description: string, trackIds: string[]) {
  const connection = await db.getSpotifyConnection(userId);
  if (!connection) throw new Error("Spotify account is not connected");
  const playlist = await spotifyUserRequest<{ id?: string; external_urls?: { spotify?: string }; name?: string }>(userId, `/users/${encodeURIComponent(connection.spotifyUserId)}/playlists`, { method: "POST", body: JSON.stringify({ name, description, public: false, collaborative: false }) });
  if (!playlist.id) throw new Error("Spotify did not create the playlist");
  const uniqueIds = Array.from(new Set(trackIds.map((id) => id.replace(/^spotify-/, "")).filter(Boolean)));
  for (let offset = 0; offset < uniqueIds.length; offset += 100) {
    await spotifyUserRequest(userId, `/playlists/${encodeURIComponent(playlist.id)}/tracks`, { method: "POST", body: JSON.stringify({ uris: uniqueIds.slice(offset, offset + 100).map((id) => `spotify:track:${id}`) }) });
  }
  return { id: playlist.id, name: playlist.name ?? name, storeUrl: playlist.external_urls?.spotify ?? `https://open.spotify.com/playlist/${playlist.id}`, trackCount: uniqueIds.length };
}

export async function createAiSpotifyMix(userId: number) {
  const recent = await db.listSpotifyRecentTracks(userId);
  if (!recent.length) throw new Error("Sync your recently played tracks before building an AI mix.");
  const seedTracks = recent.slice(0, 20).map((track) => `${track.title} — ${track.artist} — ${track.album ?? "single"}`).join("\n");
  const result = await invokeLLM({
    model: "gpt-5-mini",
    maxTokens: 1200,
    messages: [
      { role: "system", content: "You are a music discovery assistant. Analyze recently played tracks and suggest musically similar songs. Return only the requested JSON." },
      { role: "user", content: `Recently played tracks:\n${seedTracks}\nSuggest 8 distinct songs not already in the list. Favor adjacent genres, moods, and artists. Include a concise reason for each.` },
    ],
    responseFormat: { type: "json_schema", json_schema: { name: "music_recommendations", strict: true, schema: { type: "object", properties: { recommendations: { type: "array", items: { type: "object", properties: { title: { type: "string" }, artist: { type: "string" }, reason: { type: "string" } }, required: ["title", "artist", "reason"], additionalProperties: false } } }, required: ["recommendations"], additionalProperties: false } } },
  });
  const content = result.choices[0]?.message.content;
  const parsed = typeof content === "string" ? JSON.parse(content) as { recommendations?: Array<{ title: string; artist: string; reason: string }> } : { recommendations: [] };
  const recommendations = (parsed.recommendations ?? []).slice(0, 8);
  const matches = [];
  for (const recommendation of recommendations) {
    const match = await searchSpotifyUserTrack(userId, recommendation.title, recommendation.artist);
    if (match?.id) matches.push({ ...recommendation, id: match.id, art: match.album?.images?.[0]?.url ?? null });
  }
  if (!matches.length) throw new Error("Spotify could not find matching tracks for the AI mix.");
  const playlist = await createSpotifyPlaylist(userId, `Musivo AI Mix · ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`, "An AI-curated mix based on your recently played tracks in Musivo.", matches.map((match) => match.id));
  return { playlist, recommendations: matches };
}

export async function syncSpotifyUserData(userId: number) {
  const playlistItems: NonNullable<SpotifyPlaylistResponse["items"]> = [];
  for (let offset = 0; offset < 1000; offset += 50) {
    const page = await spotifyUserFetch<SpotifyPlaylistResponse>(userId, `/me/playlists?limit=50&offset=${offset}`);
    const items = page.items ?? [];
    playlistItems.push(...items);
    if (items.length < 50) break;
  }
  const recentPayload = await spotifyUserFetch<SpotifyRecentResponse>(userId, "/me/player/recently-played?limit=50");

  const playlists = playlistItems.filter((item) => item.id && item.name).map((item) => ({
    externalId: item.id!,
    name: item.name!,
    description: item.description ?? null,
    imageUrl: item.images?.[0]?.url ?? null,
    storeUrl: item.external_urls?.spotify ?? `https://open.spotify.com/playlist/${item.id}`,
    trackCount: item.tracks?.total ?? 0,
  }));
  const recentTracks = (recentPayload.items ?? []).filter((item) => item.track?.id && item.track.name && item.played_at).map((item) => ({
    externalId: item.track!.id,
    title: item.track!.name,
    artist: (item.track!.artists ?? []).map((artist) => artist.name).filter(Boolean).join(", ") || "Unknown artist",
    album: item.track!.album?.name ?? null,
    artworkUrl: item.track!.album?.images?.[0]?.url ?? null,
    storeUrl: item.track!.external_urls?.spotify ?? `https://open.spotify.com/track/${item.track!.id}`,
    playedAt: new Date(item.played_at!),
  }));

  let savedCount = 0;
  try {
    const savedPayload = await spotifyUserFetch<SpotifySavedTracksResponse>(userId, "/me/tracks?limit=50");
    savedCount = savedPayload.total ?? (savedPayload.items?.length || 0);
  } catch (err) {
    console.warn("[Spotify] Saved tracks sync count failed:", err);
  }

  await db.replaceSpotifyPlaylists(userId, playlists);
  await db.replaceSpotifyRecentTracks(userId, recentTracks);
  return {
    playlists: playlists.length,
    recentlyPlayed: recentTracks.length,
    savedTracks: savedCount,
    syncedAt: new Date(),
  };
}

export async function getSpotifyPlaylistDetail(userId: number, externalId: string, query = "") {
  const playlist = await db.getSpotifyPlaylist(userId, externalId);
  if (!playlist) throw new Error("Spotify playlist not found in the connected account");

  const tracks: CatalogTrack[] = [];
  for (let offset = 0; offset < 1000; offset += 100) {
    const page = await spotifyUserFetch<SpotifyPlaylistTracksResponse>(userId, `/playlists/${encodeURIComponent(externalId)}/tracks?market=${encodeURIComponent(ENV.spotifyMarket || "US")}&limit=100&offset=${offset}`);
    const items = page.items ?? [];
    tracks.push(...items.filter((item) => item.track?.id && item.track.name).map((item) => toCatalogTrack(item.track!)));
    if (items.length < 100) break;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filteredTracks = normalizedQuery
    ? tracks.filter((track) => `${track.title} ${track.artist} ${track.album}`.toLowerCase().includes(normalizedQuery))
    : tracks;
  return { playlist, tracks: filteredTracks, totalTracks: tracks.length, query };
}

export async function searchSpotifyTracks(query: string, limit = 10) {
  const token = await getSpotifyAccessToken();
  if (!token) return null;
  const url = new URL("https://api.spotify.com/v1/search");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "track");
  url.searchParams.set("market", ENV.spotifyMarket || "US");
  url.searchParams.set("limit", String(Math.min(Math.max(limit, 1), 10)));
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    if (response.status === 401) cachedToken = null;
    throw new Error(`Spotify search failed with ${response.status}`);
  }
  const payload = (await response.json()) as SpotifySearchResponse;
  return (payload.tracks?.items ?? []).filter((track) => track.id && track.name).map(toCatalogTrack);
}

export async function getSpotifyHomeTracks() {
  if (!hasSpotifyCredentials()) return null;
  const queries = ["tag:new", "indie pop", "focus music", "global hits"];
  const tracks: CatalogTrack[] = [];
  const seen = new Set<string>();
  for (const query of queries) {
    const results = await searchSpotifyTracks(query, 6);
    for (const track of results ?? []) {
      if (!seen.has(track.id)) {
        seen.add(track.id);
        tracks.push(track);
      }
    }
  }
  return tracks;
}

export function toCatalogTrack(track: SpotifyTrack): CatalogTrack {
  const artwork = track.album?.images?.[0]?.url ?? "";
  return {
    id: `spotify-${track.id}`,
    title: track.name,
    artist: (track.artists ?? []).map((artist) => artist.name).filter(Boolean).join(", ") || "Unknown artist",
    album: track.album?.name ?? "Single",
    art: artwork,
    audio: track.preview_url ?? "",
    storeUrl: track.external_urls?.spotify ?? `https://open.spotify.com/track/${track.id}`,
    durationMs: typeof track.duration_ms === "number" ? track.duration_ms : null,
    accent: "#d8ff57",
    source: "Spotify",
  };
}

export function clearSpotifyTokenCacheForTests() {
  cachedToken = null;
}

export function catalogStatus() {
  return {
    provider: hasSpotifyCredentials() ? "spotify" as const : "itunes" as const,
    configured: hasSpotifyCredentials(),
    label: hasSpotifyCredentials() ? "Spotify catalog" : "iTunes fallback",
  };
}

export const spotifyUserScopes = USER_SCOPES;
