import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { addTrackToPlaylist, createUserPlaylist, getUserPlaylist, listPlaylistTracks, listUserPlaylists } from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  music: router({
    search: publicProcedure
      .input(z.object({ query: z.string().trim().min(1).max(80), limit: z.number().int().min(1).max(20).default(12) }))
      .query(async ({ input }) => {
        const url = new URL("https://itunes.apple.com/search");
        url.searchParams.set("term", input.query);
        url.searchParams.set("country", "US");
        url.searchParams.set("media", "music");
        url.searchParams.set("entity", "song");
        url.searchParams.set("limit", String(input.limit));

        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Music provider responded with ${response.status}`);
          const payload = (await response.json()) as { results?: Array<Record<string, unknown>> };
          return (payload.results ?? []).filter((item) => item.trackId && item.trackName && item.artistName).map((item) => ({
            id: `itunes-${String(item.trackId)}`,
            title: String(item.trackName),
            artist: String(item.artistName),
            album: String(item.collectionName ?? "Single"),
            art: String(item.artworkUrl100 ?? "").replace("100x100", "600x600"),
            audio: typeof item.previewUrl === "string" ? item.previewUrl.replace(/^http:/, "https:") : "",
            storeUrl: String(item.trackViewUrl ?? item.collectionViewUrl ?? ""),
            durationMs: typeof item.trackTimeMillis === "number" ? item.trackTimeMillis : null,
            accent: "#d8ff57",
            source: "iTunes",
          }));
        } catch (error) {
          console.error("[Music] Search failed:", error);
          throw new TRPCError({ code: "BAD_GATEWAY", message: "The music catalog is temporarily unavailable." });
        }
      }),
  }),
  playlists: router({
    list: protectedProcedure.query(({ ctx }) => listUserPlaylists(ctx.user.id)),
    tracks: protectedProcedure.input(z.object({ playlistId: z.number().int().positive() })).query(({ ctx, input }) => listPlaylistTracks(ctx.user.id, input.playlistId)),
    create: protectedProcedure.input(z.object({ name: z.string().trim().min(1).max(120), description: z.string().trim().max(500).optional() })).mutation(({ ctx, input }) => createUserPlaylist({ userId: ctx.user.id, name: input.name, description: input.description ?? null })),
    addTrack: protectedProcedure.input(z.object({ playlistId: z.number().int().positive(), track: z.object({ id: z.string().min(1), title: z.string().min(1), artist: z.string().min(1), album: z.string().optional(), art: z.string().url().optional(), audio: z.string().url().optional(), storeUrl: z.string().url().optional(), durationMs: z.number().int().nullable().optional() }) })).mutation(async ({ ctx, input }) => {
      const ownedPlaylist = await getUserPlaylist(ctx.user.id, input.playlistId);
      if (!ownedPlaylist) throw new TRPCError({ code: "NOT_FOUND", message: "Playlist not found" });
      return addTrackToPlaylist({ playlistId: input.playlistId, externalId: input.track.id, title: input.track.title, artist: input.track.artist, album: input.track.album ?? null, artworkUrl: input.track.art ?? null, previewUrl: input.track.audio ?? null, storeUrl: input.track.storeUrl ?? null, durationMs: input.track.durationMs ?? null });
    }),
  }),
});

export type AppRouter = typeof appRouter;
