import { ENV } from "./_core/env";

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

type SpotifySearchResponse = {
  tracks?: { items?: SpotifyTrack[] };
};

let cachedToken: { value: string; expiresAt: number } | null = null;

export function hasSpotifyCredentials() {
  return Boolean(ENV.spotifyClientId && ENV.spotifyClientSecret);
}

async function getSpotifyAccessToken() {
  if (!hasSpotifyCredentials()) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;

  const basic = Buffer.from(`${ENV.spotifyClientId}:${ENV.spotifyClientSecret}`).toString("base64");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`Spotify token request failed with ${response.status}`);
  }

  const payload = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!payload.access_token) throw new Error("Spotify did not return an access token");

  cachedToken = {
    value: payload.access_token,
    expiresAt: Date.now() + Math.max(60, payload.expires_in ?? 3600) * 1000,
  };
  return cachedToken.value;
}

function toCatalogTrack(track: SpotifyTrack): CatalogTrack {
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

export async function searchSpotifyTracks(query: string, limit = 10) {
  const token = await getSpotifyAccessToken();
  if (!token) return null;

  const url = new URL("https://api.spotify.com/v1/search");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "track");
  url.searchParams.set("market", ENV.spotifyMarket || "US");
  url.searchParams.set("limit", String(Math.min(Math.max(limit, 1), 10)));

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
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

export function clearSpotifyTokenCacheForTests() {
  cachedToken = null;
}

export function resetSpotifyTokenCacheForTests() {
  cachedToken = null;
}

export function catalogStatus() {
  return {
    provider: hasSpotifyCredentials() ? "spotify" as const : "itunes" as const,
    configured: hasSpotifyCredentials(),
    label: hasSpotifyCredentials() ? "Spotify catalog" : "iTunes fallback",
  };
}

export function isSpotifyTrackId(id: string) {
  return id.startsWith("spotify-");
}

export function spotifyIdFromTrackId(id: string) {
  return id.replace(/^spotify-/, "");
}

export type { SpotifyTrack };
export { toCatalogTrack };
