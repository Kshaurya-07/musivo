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
  url.searchParams.set("show_dialog", "true");
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

export async function saveSpotifyConnectionFromTokens(
  userId: number,
  tokens: { access_token: string; refresh_token?: string; expires_in?: number; scope?: string },
  profile: SpotifyProfile & { email?: string }
) {
  if (!profile.id) throw new Error("Spotify profile did not include an id");
  const existing = await db.getSpotifyConnection(userId);
  const refreshToken = tokens.refresh_token || (existing ? decryptSpotifyToken(existing.refreshTokenEncrypted) : "") || tokens.access_token;

  await db.upsertSpotifyConnection({
    userId,
    spotifyUserId: profile.id,
    spotifyDisplayName: profile.display_name ?? null,
    spotifyProfileImageUrl: profile.images?.[0]?.url ?? null,
    accessTokenEncrypted: encryptSpotifyToken(tokens.access_token),
    refreshTokenEncrypted: encryptSpotifyToken(refreshToken),
    accessTokenExpiresAt: new Date(Date.now() + Math.max(60, tokens.expires_in ?? 3600) * 1000),
    scope: tokens.scope ?? USER_SCOPES,
  });
  return { ...profile, accessToken: tokens.access_token, refreshToken };
}

export async function completeSpotifyConnection(userId: number, code: string, redirectUri: string) {
  const payload = await exchangeUserCode(code, redirectUri);
  if (!payload.access_token) throw new Error("Spotify did not return an access token");
  const profile = await spotifyUserFetchWithToken<SpotifyProfile & { email?: string }>(payload.access_token, "/me");
  return saveSpotifyConnectionFromTokens(userId, payload as { access_token: string; refresh_token?: string; expires_in?: number; scope?: string }, profile);
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

export async function searchSpotifyWithUserToken(userId: number, query: string, limit = 12) {
  try {
    const url = `/search?q=${encodeURIComponent(query)}&type=track&limit=${Math.min(Math.max(limit, 1), 20)}&market=${encodeURIComponent(ENV.spotifyMarket || "US")}`;
    const payload = await spotifyUserFetch<SpotifySearchResponse>(userId, url);
    return (payload.tracks?.items ?? []).filter((track) => track.id && track.name).map(toCatalogTrack);
  } catch (error) {
    console.warn("[Spotify] User search failed, falling back:", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function resolveSpotifyTrack({ userId, title, artist }: { userId?: number; title: string; artist: string }) {
  if (userId) {
    try {
      const match = await searchSpotifyUserTrack(userId, title, artist);
      if (match?.id) {
        return {
          spotifyTrackId: match.id,
          spotifyUri: `spotify:track:${match.id}`,
          durationMs: match.duration_ms || null,
          title: match.name,
          artist: match.artists?.[0]?.name || artist,
          art: match.album?.images?.[0]?.url || "",
        };
      }
      const broad = await spotifyUserFetch<SpotifySearchResponse>(
        userId,
        `/search?q=${encodeURIComponent(`${title} ${artist}`)}&type=track&limit=1&market=${encodeURIComponent(ENV.spotifyMarket || "US")}`
      );
      const broadMatch = broad.tracks?.items?.[0];
      if (broadMatch?.id) {
        return {
          spotifyTrackId: broadMatch.id,
          spotifyUri: `spotify:track:${broadMatch.id}`,
          durationMs: broadMatch.duration_ms || null,
          title: broadMatch.name,
          artist: broadMatch.artists?.[0]?.name || artist,
          art: broadMatch.album?.images?.[0]?.url || "",
        };
      }
    } catch (err) {
      console.warn("[Spotify] Failed to resolve track with user token:", err);
    }
  }

  try {
    const token = await getSpotifyAccessToken();
    if (token) {
      const url = new URL("https://api.spotify.com/v1/search");
      url.searchParams.set("q", `${title} ${artist}`);
      url.searchParams.set("type", "track");
      url.searchParams.set("limit", "1");
      url.searchParams.set("market", ENV.spotifyMarket || "US");
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const payload = (await res.json()) as SpotifySearchResponse;
        const match = payload.tracks?.items?.[0];
        if (match?.id) {
          return {
            spotifyTrackId: match.id,
            spotifyUri: `spotify:track:${match.id}`,
            durationMs: match.duration_ms || null,
            title: match.name,
            artist: match.artists?.[0]?.name || artist,
            art: match.album?.images?.[0]?.url || "",
          };
        }
      }
    }
  } catch (err) {
    console.warn("[Spotify] Failed to resolve track with client credentials:", err);
  }

  return null;
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

export type AiMixTrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  reason: string;
  art: string | null;
  durationMs: number | null;
  duration: string;
  audio?: string;
  storeUrl?: string;
};

export type AiMixOptions = {
  prompt?: string;
  mood?: string;
  count?: number;
  saveToSpotify?: boolean;
};

export const MOOD_PROFILES: Record<
  string,
  {
    name: string;
    description: string;
    seedArtists: string[];
    seedKeywords: string[];
    defaultReason: string;
  }
> = {
  chill: {
    name: "Midnight Reverie",
    description: "Atmospheric synths, late-night lo-fi grooves, and mellow vibes",
    seedArtists: ["M83", "Tycho", "Bonobo", "Beach House", "Cigarettes After Sex", "Khruangbin", "Men I Trust", "Jinsang"],
    seedKeywords: ["chillout", "lo-fi", "ambient", "dream pop"],
    defaultReason: "Lush ambient synthscapes and gentle rhythms tailored for late-night relaxation.",
  },
  workout: {
    name: "Neon Cardio",
    description: "High-octane electronic, driving basslines, and unstoppable momentum",
    seedArtists: ["Fred again..", "The Prodigy", "Daft Punk", "Skrillex", "Deadmau5", "Swedish House Mafia", "Pendulum", "Dua Lipa"],
    seedKeywords: ["high energy", "synthwave", "dance edm", "drum and bass"],
    defaultReason: "Pounding basslines and an elevated tempo that drive peak workout focus.",
  },
  focus: {
    name: "Deep Flow State",
    description: "Minimalist neo-classical, ambient techno, and pure distraction-free flow",
    seedArtists: ["Max Richter", "Nils Frahm", "Kiasmos", "Jon Hopkins", "Boards of Canada", "Olafur Arnalds", "Brian Eno"],
    seedKeywords: ["minimalist", "focus flow", "instrumental", "neo-classical"],
    defaultReason: "Hypnotic minimalist textures engineered for unbroken concentration.",
  },
  party: {
    name: "Weekend Euphoria",
    description: "Infectious dancefloor house, energetic grooves, and uplifting hooks",
    seedArtists: ["Calvin Harris", "Peggy Gou", "Disclosure", "Fisher", "Rufus Du Sol", "Kaytranada", "Dua Lipa", "SG Lewis"],
    seedKeywords: ["dance party", "club house", "disco funk", "summer vibes"],
    defaultReason: "Irresistible grooves and vibrant energy that instantly ignite any room.",
  },
  nostalgia: {
    name: "Golden Era Rewind",
    description: "80s synth classics, 90s alternative, and timeless golden-era anthems",
    seedArtists: ["New Order", "Tears for Fears", "Fleetwood Mac", "The Cure", "Depeche Mode", "Oasis", "Red Hot Chili Peppers"],
    seedKeywords: ["80s retro", "90s alternative", "classic rock", "vintage"],
    defaultReason: "Classic songwriting and nostalgic analog warmth that stand the test of time.",
  },
  acoustic: {
    name: "Sunday Coffeehouse",
    description: "Warm acoustic fingerpicking, intimate indie folk, and soulful storytelling",
    seedArtists: ["Iron & Wine", "Bon Iver", "Phoebe Bridgers", "Sufjan Stevens", "Fleet Foxes", "Vance Joy", "Gregory Alan Isakov"],
    seedKeywords: ["acoustic folk", "coffeehouse", "indie", "warm vocals"],
    defaultReason: "Organic acoustic instrumentation and tender melodies for easy mornings.",
  },
};

function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export async function createAiSpotifyMix(userId?: number, options?: AiMixOptions) {
  const recent = userId ? await db.listSpotifyRecentTracks(userId).catch(() => []) : [];
  const liked = userId ? await db.listLikedTracks(userId).catch(() => []) : [];

  const rawMood = (options?.mood || "").toLowerCase().trim();
  const selectedMood = MOOD_PROFILES[rawMood] ? rawMood : options?.prompt ? "custom" : "chill";
  const moodConfig = MOOD_PROFILES[selectedMood] || MOOD_PROFILES.chill;
  const targetCount = Math.min(Math.max(options?.count ?? 8, 4), 16);

  const mixTitle = options?.prompt
    ? `AI Mix · ${options.prompt.slice(0, 24)}`
    : `AI Mix · ${moodConfig.name}`;

  let matches: AiMixTrack[] = [];
  const seenIds = new Set<string>();

  // 1. LLM Curation (if OpenAI/Forge API key is configured)
  if (ENV.forgeApiKey) {
    try {
      const seedContext = [
        ...recent.slice(0, 10).map((t) => `${t.title} by ${t.artist}`),
        ...liked.slice(0, 10).map((t) => `${t.title} by ${t.artist}`),
      ].join(", ");

      const promptContext = options?.prompt
        ? `The user requested the vibe: "${options.prompt}".`
        : `The user selected the mood: "${moodConfig.name}" (${moodConfig.description}).`;

      const result = await invokeLLM({
        model: "gpt-4o-mini",
        maxTokens: 1200,
        messages: [
          {
            role: "system",
            content:
              "You are an expert music curator for Musivo. Suggest musically cohesive songs that fit the user's requested vibe and listening profile. Return only JSON.",
          },
          {
            role: "user",
            content: `${promptContext}\n${
              seedContext ? `User's seed library: ${seedContext}\n` : ""
            }Suggest ${targetCount} distinct songs that fit this aesthetic. Include title, artist, and a compelling, concise reason (under 15 words) explaining why it fits.`,
          },
        ],
        responseFormat: {
          type: "json_schema",
          json_schema: {
            name: "music_recommendations",
            strict: true,
            schema: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      artist: { type: "string" },
                      reason: { type: "string" },
                    },
                    required: ["title", "artist", "reason"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["recommendations"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = result.choices[0]?.message.content;
      const parsed =
        typeof content === "string"
          ? (JSON.parse(content) as {
              recommendations?: Array<{ title: string; artist: string; reason: string }>;
            })
          : { recommendations: [] };

      const recs = (parsed.recommendations ?? []).slice(0, targetCount);

      for (const rec of recs) {
        let match: SpotifyTrack | undefined;
        if (userId) {
          match = await searchSpotifyUserTrack(userId, rec.title, rec.artist).catch(() => undefined);
        }
        if (!match && hasSpotifyCredentials()) {
          try {
            const token = await getSpotifyAccessToken();
            if (token) {
              const url = new URL("https://api.spotify.com/v1/search");
              url.searchParams.set("q", `${rec.title} ${rec.artist}`);
              url.searchParams.set("type", "track");
              url.searchParams.set("limit", "1");
              const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
              if (res.ok) {
                const payload = (await res.json()) as SpotifySearchResponse;
                match = payload.tracks?.items?.[0];
              }
            }
          } catch {}
        }

        if (match?.id && !seenIds.has(match.id)) {
          seenIds.add(match.id);
          const durMs = match.duration_ms || 210000;
          matches.push({
            id: `spotify-${match.id}`,
            title: match.name,
            artist: match.artists?.[0]?.name || rec.artist,
            album: match.album?.name || "Single",
            reason: rec.reason || moodConfig.defaultReason,
            art: match.album?.images?.[0]?.url ?? null,
            durationMs: durMs,
            duration: formatSeconds(durMs / 1000),
            audio: match.preview_url ?? undefined,
            storeUrl: match.external_urls?.spotify,
          });
        }
      }
    } catch (llmErr) {
      console.warn("[AI Mix] LLM curation skipped/failed; using algorithmic curator:", llmErr);
    }
  }

  // 2. Algorithmic Mix Curator (Seed Artists & Keywords)
  if (matches.length < targetCount) {
    const candidateArtists = [
      ...moodConfig.seedArtists,
      ...recent.map((r) => r.artist),
      ...liked.map((l) => l.artist),
    ].filter(Boolean);

    const shuffledArtists = Array.from(new Set(candidateArtists)).sort(() => Math.random() - 0.5);

    for (const artist of shuffledArtists) {
      if (matches.length >= targetCount) break;
      try {
        let candidates: SpotifyTrack[] = [];
        if (userId) {
          const searchRes = await spotifyUserFetch<SpotifySearchResponse>(
            userId,
            `/search?q=${encodeURIComponent(`artist:${artist}`)}&type=track&limit=4&market=${encodeURIComponent(
              ENV.spotifyMarket || "US"
            )}`
          ).catch(() => null);
          candidates = searchRes?.tracks?.items ?? [];
        }

        if (!candidates.length && hasSpotifyCredentials()) {
          const token = await getSpotifyAccessToken();
          if (token) {
            const url = new URL("https://api.spotify.com/v1/search");
            url.searchParams.set("q", `artist:${artist}`);
            url.searchParams.set("type", "track");
            url.searchParams.set("limit", "4");
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
              const payload = (await res.json()) as SpotifySearchResponse;
              candidates = payload.tracks?.items ?? [];
            }
          }
        }

        for (const cand of candidates) {
          if (matches.length >= targetCount) break;
          if (!cand.id || seenIds.has(cand.id)) continue;
          seenIds.add(cand.id);
          const durMs = cand.duration_ms || 210000;
          matches.push({
            id: `spotify-${cand.id}`,
            title: cand.name,
            artist: cand.artists?.[0]?.name || artist,
            album: cand.album?.name || "Single",
            reason: `Curated for ${artist}'s signature sound matching the ${moodConfig.name} aesthetic.`,
            art: cand.album?.images?.[0]?.url ?? null,
            durationMs: durMs,
            duration: formatSeconds(durMs / 1000),
            audio: cand.preview_url ?? undefined,
            storeUrl: cand.external_urls?.spotify,
          });
        }
      } catch (err) {
        console.warn(`[AI Mix] Seed artist search failed for ${artist}:`, err);
      }
    }
  }

  // 3. Fallback catalog search
  if (matches.length < 4) {
    const fallbackTerms = [options?.prompt, ...moodConfig.seedKeywords, "top hits"].filter(Boolean);
    for (const term of fallbackTerms) {
      if (matches.length >= targetCount) break;
      try {
        const token = await getSpotifyAccessToken();
        if (token) {
          const url = new URL("https://api.spotify.com/v1/search");
          url.searchParams.set("q", String(term));
          url.searchParams.set("type", "track");
          url.searchParams.set("limit", "6");
          const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
            const payload = (await res.json()) as SpotifySearchResponse;
            for (const cand of payload.tracks?.items ?? []) {
              if (matches.length >= targetCount) break;
              if (!cand.id || seenIds.has(cand.id)) continue;
              seenIds.add(cand.id);
              const durMs = cand.duration_ms || 210000;
              matches.push({
                id: `spotify-${cand.id}`,
                title: cand.name,
                artist: cand.artists?.[0]?.name || "Featured Artist",
                album: cand.album?.name || "Single",
                reason: `Discovery pick resonant with the ${moodConfig.name} vibe.`,
                art: cand.album?.images?.[0]?.url ?? null,
                durationMs: durMs,
                duration: formatSeconds(durMs / 1000),
                audio: cand.preview_url ?? undefined,
                storeUrl: cand.external_urls?.spotify,
              });
            }
          }
        }
      } catch {}
    }
  }

  // 4. Save to Spotify if connected and requested
  let playlist: {
    id: string;
    name: string;
    storeUrl: string | null;
    trackCount: number;
  };

  const rawIds = matches.map((m) => m.id.replace(/^spotify-/, "")).filter(Boolean);
  const hasConnection = userId ? await db.getSpotifyConnection(userId).catch(() => null) : null;

  if (hasConnection && userId && options?.saveToSpotify !== false && rawIds.length > 0) {
    try {
      playlist = await createSpotifyPlaylist(
        userId,
        `Musivo · ${mixTitle}`,
        `Curated by Musivo AI Mix: ${options?.prompt || moodConfig.description}`,
        rawIds
      );
    } catch (err) {
      console.warn("[AI Mix] Saving to Spotify playlist skipped:", err);
      playlist = {
        id: `ai-mix-${Date.now()}`,
        name: `Musivo · ${mixTitle}`,
        storeUrl: null,
        trackCount: matches.length,
      };
    }
  } else {
    playlist = {
      id: `ai-mix-${Date.now()}`,
      name: `Musivo · ${mixTitle}`,
      storeUrl: null,
      trackCount: matches.length,
    };
  }

  return {
    playlist,
    recommendations: matches,
    mood: selectedMood,
    title: mixTitle,
    description: options?.prompt || moodConfig.description,
  };
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
