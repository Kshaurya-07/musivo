import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./_core/env";
import * as db from "./db";

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
type SpotifyProfile = { id?: string; display_name?: string | null };
type SpotifyPlaylistResponse = { items?: Array<{ id?: string; name?: string; description?: string | null; images?: Array<{ url?: string }>; external_urls?: { spotify?: string }; tracks?: { total?: number } }> };
type SpotifyRecentResponse = { items?: Array<{ played_at?: string; track?: SpotifyTrack | null }> };

type SpotifyStatePayload = { userId: number; nonce: string; redirectUri: string };

const USER_SCOPES = [
  "playlist-read-private",
  "playlist-read-collaborative",
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

export async function verifySpotifyState(state: string) {
  try {
    const { payload } = await jwtVerify(state, getSessionKey(), { algorithms: ["HS256"] });
    const userId = typeof payload.userId === "number" ? payload.userId : Number(payload.userId);
    const nonce = typeof payload.nonce === "string" ? payload.nonce : "";
    const redirectUri = typeof payload.redirectUri === "string" ? payload.redirectUri : "";
    if (!Number.isInteger(userId) || !nonce || !redirectUri) return null;
    return { userId, nonce, redirectUri };
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
  const payload = (await response.json()) as SpotifyTokenResponse;
  if (!response.ok || !payload.access_token) {
    throw new Error(`Spotify token request failed with ${response.status}`);
  }
  return payload;
}

async function getSpotifyAccessToken() {
  if (!hasSpotifyCredentials()) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;
  const payload = await requestSpotifyToken(new URLSearchParams({ grant_type: "client_credentials" }));
  cachedToken = {
    value: payload.access_token!,
    expiresAt: Date.now() + Math.max(60, payload.expires_in ?? 3600) * 1000,
  };
  return cachedToken.value;
}

async function exchangeUserCode(code: string, redirectUri: string) {
  return requestSpotifyToken(new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri }));
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
  const profile = await spotifyUserFetchWithToken<SpotifyProfile>(payload.access_token!, "/me");
  if (!profile.id) throw new Error("Spotify profile did not include an id");
  await db.upsertSpotifyConnection({
    userId,
    spotifyUserId: profile.id,
    spotifyDisplayName: profile.display_name ?? null,
    accessTokenEncrypted: encryptSpotifyToken(payload.access_token!),
    refreshTokenEncrypted: encryptSpotifyToken(payload.refresh_token),
    accessTokenExpiresAt: new Date(Date.now() + Math.max(60, payload.expires_in ?? 3600) * 1000),
    scope: payload.scope ?? USER_SCOPES,
  });
  return profile;
}

async function spotifyUserFetchWithToken<T>(accessToken: string, path: string) {
  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Spotify user API request failed with ${response.status}`);
  return (await response.json()) as T;
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

  await db.replaceSpotifyPlaylists(userId, playlists);
  await db.replaceSpotifyRecentTracks(userId, recentTracks);
  return { playlists: playlists.length, recentlyPlayed: recentTracks.length, syncedAt: new Date() };
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
