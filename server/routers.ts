import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addTrackToPlaylist,
  createUserPlaylist,
  deleteSpotifyConnection,
  getSpotifyConnection,
  getSpotifyConnectionStatus,
  getUserPlaylist,
  hasLikedTrack,
  listLikedTracks,
  listPlaylistTracks,
  listSpotifyPlaylists,
  listSpotifyRecentTracks,
  listUserPlaylists,
  toggleLikedTrack,
} from "./db";
import {
  buildSpotifyAuthorizeUrl,
  catalogStatus,
  createSpotifyState,
  getSpotifyHomeTracks,
  getSpotifyPlaylistDetail,
  getUserSpotifyAccessToken,
  createSpotifyPlaylist,
  createAiSpotifyMix,
  searchSpotifyTracks,
  syncSpotifyUserData,
} from "./spotify";
import { randomUUID } from "node:crypto";
import { ENV } from "./_core/env";

type ProviderTrack = {
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

async function searchItunesTracks(query: string, limit: number): Promise<ProviderTrack[]> {
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", query);
  url.searchParams.set("country", "US");
  url.searchParams.set("media", "music");
  url.searchParams.set("entity", "song");
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Music provider responded with ${response.status}`);
  const payload = (await response.json()) as { results?: Array<Record<string, unknown>> };
  return (payload.results ?? [])
    .filter((item) => item.trackId && item.trackName && item.artistName)
    .map((item) => ({
      id: `itunes-${String(item.trackId)}`,
      title: String(item.trackName),
      artist: String(item.artistName),
      album: String(item.collectionName ?? "Single"),
      art: String(item.artworkUrl100 ?? "").replace("100x100", "600x600"),
      audio: typeof item.previewUrl === "string" ? item.previewUrl.replace(/^http:/, "https:") : "",
      storeUrl: String(item.trackViewUrl ?? item.collectionViewUrl ?? ""),
      durationMs: typeof item.trackTimeMillis === "number" ? item.trackTimeMillis : null,
      accent: "#d8ff57",
      source: "iTunes" as const,
    }));
}

const trackInput = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  artist: z.string().min(1),
  album: z.string().optional(),
  art: z.string().url().optional(),
  audio: z.string().url().optional(),
  storeUrl: z.string().url().optional(),
  durationMs: z.number().int().nullable().optional(),
});

function getSpotifyRedirectUri(origin: string) {
  if (ENV.spotifyRedirectUri) return ENV.spotifyRedirectUri;
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    throw new TRPCError({ code: "BAD_REQUEST", message: "A valid app origin is required." });
  }
  if (parsed.protocol !== "https:" && !(parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Spotify connections require a secure app origin." });
  }
  return `${parsed.origin}/api/spotify/callback`;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  music: router({
    status: publicProcedure.query(() => catalogStatus()),
    home: publicProcedure.query(async () => {
      try {
        return await getSpotifyHomeTracks();
      } catch (error) {
        console.error("[Music] Spotify home feed failed:", error);
        return null;
      }
    }),
    search: publicProcedure
      .input(z.object({ query: z.string().trim().min(1).max(80), limit: z.number().int().min(1).max(20).default(12) }))
      .query(async ({ input }) => {
        try {
          const spotifyResults = await searchSpotifyTracks(input.query, input.limit);
          if (spotifyResults) return spotifyResults;
          return await searchItunesTracks(input.query, input.limit);
        } catch (error) {
          console.error("[Music] Spotify catalog search failed; trying fallback:", error);
          try {
            return await searchItunesTracks(input.query, input.limit);
          } catch (fallbackError) {
            console.error("[Music] Fallback search failed:", fallbackError);
            throw new TRPCError({ code: "BAD_GATEWAY", message: "The music catalog is temporarily unavailable." });
          }
        }
      }),
  }),
  spotify: router({
    status: protectedProcedure.query(({ ctx }) => getSpotifyConnectionStatus(ctx.user.id)),
    playbackToken: protectedProcedure.query(async ({ ctx }) => {
      const connection = await getSpotifyConnection(ctx.user.id);
      if (!connection || !connection.scope?.split(" ").includes("streaming")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Reconnect Spotify to enable in-app playback." });
      }
      return { token: await getUserSpotifyAccessToken(ctx.user.id) };
    }),
    connect: protectedProcedure.input(z.object({ origin: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      const redirectUri = getSpotifyRedirectUri(input.origin);
      const nonce = randomUUID();
      const state = await createSpotifyState({ userId: ctx.user.id, nonce, redirectUri });
      const isSecure = ctx.req.protocol === "https" || ctx.req.headers["x-forwarded-proto"] === "https";
      const cookieName = isSecure ? "__Host-spotify_state" : "spotify_state";
      ctx.res.cookie(cookieName, nonce, {
        httpOnly: true,
        secure: isSecure,
        sameSite: isSecure ? "none" : "lax",
        path: "/",
        maxAge: 10 * 60 * 1000,
      });
      return { authorizeUrl: buildSpotifyAuthorizeUrl(state, redirectUri) };
    }),
    sync: protectedProcedure.mutation(async ({ ctx }) => {
      try {
        return await syncSpotifyUserData(ctx.user.id);
      } catch (error) {
        console.error("[Spotify] Sync failed:", error);
        throw new TRPCError({ code: "BAD_GATEWAY", message: "Spotify sync failed. Reconnect your account and try again." });
      }
    }),
    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
      await deleteSpotifyConnection(ctx.user.id);
      return { success: true } as const;
    }),
    playlists: protectedProcedure.query(({ ctx }) => listSpotifyPlaylists(ctx.user.id)),
    playlistDetail: protectedProcedure.input(z.object({ externalId: z.string().min(1), query: z.string().max(80).optional() })).query(async ({ ctx, input }) => {
      try {
        return await getSpotifyPlaylistDetail(ctx.user.id, input.externalId, input.query ?? "");
      } catch (error) {
        console.error("[Spotify] Playlist detail failed:", error);
        throw new TRPCError({ code: "BAD_GATEWAY", message: "Spotify playlist tracks could not be loaded." });
      }
    }),
    recentlyPlayed: protectedProcedure.query(({ ctx }) => listSpotifyRecentTracks(ctx.user.id)),
    createPlaylist: protectedProcedure.input(z.object({ name: z.string().trim().min(1).max(100), description: z.string().trim().max(300).optional(), trackIds: z.array(z.string().min(1)).max(500).default([]) })).mutation(async ({ ctx, input }) => {
      try {
        return await createSpotifyPlaylist(ctx.user.id, input.name, input.description ?? "Created in Musivo", input.trackIds);
      } catch (error) {
        console.error("[Spotify] Playlist creation failed:", error);
        throw new TRPCError({ code: "BAD_GATEWAY", message: "Spotify playlist could not be created. Please reconnect and try again." });
      }
    }),
    createAiMix: protectedProcedure.mutation(async ({ ctx }) => {
      try {
        return await createAiSpotifyMix(ctx.user.id);
      } catch (error) {
        console.error("[Spotify] AI mix failed:", error);
        throw new TRPCError({ code: "BAD_GATEWAY", message: error instanceof Error ? error.message : "The AI mix could not be created right now." });
      }
    }),
  }),
  playlists: router({
    list: protectedProcedure.query(({ ctx }) => listUserPlaylists(ctx.user.id)),
    tracks: protectedProcedure.input(z.object({ playlistId: z.number().int().positive() })).query(({ ctx, input }) => listPlaylistTracks(ctx.user.id, input.playlistId)),
    create: protectedProcedure.input(z.object({ name: z.string().trim().min(1).max(120), description: z.string().trim().max(500).optional() })).mutation(({ ctx, input }) => createUserPlaylist({ userId: ctx.user.id, name: input.name, description: input.description ?? null })),
    addTrack: protectedProcedure.input(z.object({ playlistId: z.number().int().positive(), track: trackInput })).mutation(async ({ ctx, input }) => {
      const ownedPlaylist = await getUserPlaylist(ctx.user.id, input.playlistId);
      if (!ownedPlaylist) throw new TRPCError({ code: "NOT_FOUND", message: "Playlist not found" });
      return addTrackToPlaylist({ playlistId: input.playlistId, externalId: input.track.id, title: input.track.title, artist: input.track.artist, album: input.track.album ?? null, artworkUrl: input.track.art ?? null, previewUrl: input.track.audio ?? null, storeUrl: input.track.storeUrl ?? null, durationMs: input.track.durationMs ?? null });
    }),
  }),
  likes: router({
    list: protectedProcedure.query(({ ctx }) => listLikedTracks(ctx.user.id)),
    has: protectedProcedure.input(z.object({ externalId: z.string().min(1) })).query(({ ctx, input }) => hasLikedTrack(ctx.user.id, input.externalId)),
    toggle: protectedProcedure.input(trackInput).mutation(({ ctx, input }) => toggleLikedTrack(ctx.user.id, { externalId: input.id, title: input.title, artist: input.artist, album: input.album ?? null, artworkUrl: input.art ?? null, previewUrl: input.audio ?? null, storeUrl: input.storeUrl ?? null, durationMs: input.durationMs ?? null })),
  }),
});

export type AppRouter = typeof appRouter;
