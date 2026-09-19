import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  recordListeningSession,
  getListeningStats,
  getListeningHistory,
  addRecentSearch,
  listRecentSearches,
  removeRecentSearch,
  clearRecentSearches,
} from "./db";

function createAuthContext(userId = 9001): TrpcContext {
  return {
    user: {
      id: userId,
      openIdSub: `test-sub-${userId}`,
      displayName: "Musivo Premium Tester",
      email: "tester@musivo.app",
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Musivo Premium — Listening Analytics & Telemetry Engine", () => {
  const testUserId = 99999;

  it("filters out sessions under 30 seconds from active listening metrics", async () => {
    // 15-second skip (should be discarded by active listening filter >= 30,000ms)
    await recordListeningSession({
      userId: testUserId,
      contentId: "track-short",
      contentType: "track",
      title: "Short Skip Track",
      artist: "Quick Artist",
      listenedMs: 15000,
      durationMs: 180000,
      startedAt: new Date(),
      endedAt: new Date(),
    });

    const stats = await getListeningStats(testUserId);
    expect(stats.tracksPlayed).toBe(0);
    expect(stats.totalListenedMs).toBe(0);
  });

  it("aggregates active sessions >= 30s into daily, weekly, monthly and yearly metrics", async () => {
    // 60-second track session
    await recordListeningSession({
      userId: testUserId,
      contentId: "track-1",
      contentType: "track",
      title: "Midnight Synths",
      artist: "Neon Waves",
      listenedMs: 60000,
      durationMs: 240000,
      startedAt: new Date(),
      endedAt: new Date(),
    });

    // 180-second episode session
    await recordListeningSession({
      userId: testUserId,
      contentId: "podcast-1",
      contentType: "episode",
      title: "The Future of AI",
      artist: "Tech Horizons",
      listenedMs: 180000,
      durationMs: 3600000,
      startedAt: new Date(),
      endedAt: new Date(),
    });

    const stats = await getListeningStats(testUserId);
    expect(stats.tracksPlayed).toBe(1);
    expect(stats.episodesPlayed).toBe(1);
    expect(stats.totalListenedMs).toBe(240000);
    expect(stats.todayMs).toBe(240000);
    expect(stats.thisWeekMs).toBe(240000);
    expect(stats.thisMonthMs).toBe(240000);
    expect(stats.thisYearMs).toBe(240000);

    // Check content breakdown
    expect(stats.musicMs).toBe(60000);
    expect(stats.podcastMs).toBe(180000);

    // Check artists
    expect(stats.uniqueArtistsCount).toBe(2);
    expect(stats.topArtists[0].name).toBe("Tech Horizons");
    expect(stats.topArtists[0].totalMinutes).toBe(3);
  });

  it("retrieves recent listening history chronologically", async () => {
    const history = await getListeningHistory(testUserId, 10);
    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history[0].title).toBe("The Future of AI");
    expect(history[1].title).toBe("Midnight Synths");
  });
});

describe("Musivo Premium — Recent Search Engine", () => {
  const searchUserId = 88888;

  it("records and dedupes recent searches, sorting newest first", async () => {
    await addRecentSearch(searchUserId, "Daft Punk");
    await addRecentSearch(searchUserId, "Tame Impala");
    await addRecentSearch(searchUserId, "Daft Punk"); // Re-search moves to top

    const recent = await listRecentSearches(searchUserId);
    expect(recent.length).toBe(2);
    expect(recent[0]).toBe("Daft Punk");
    expect(recent[1]).toBe("Tame Impala");
  });

  it("removes individual search terms and clears all terms", async () => {
    await addRecentSearch(searchUserId, "ODESZA");
    let recent = await listRecentSearches(searchUserId);
    expect(recent).toContain("ODESZA");

    await removeRecentSearch(searchUserId, "ODESZA");
    recent = await listRecentSearches(searchUserId);
    expect(recent).not.toContain("ODESZA");

    await clearRecentSearches(searchUserId);
    recent = await listRecentSearches(searchUserId);
    expect(recent.length).toBe(0);
  });
});

describe("Musivo Premium — tRPC Router Integration", () => {
  const ctx = createAuthContext(77777);
  const caller = appRouter.createCaller(ctx);

  it("allows recording a listening session and fetching telemetry via tRPC", async () => {
    const recordResult = await caller.music.recordSession({
      contentId: "spotify:track:123",
      contentType: "track",
      title: "Starboy",
      artist: "The Weeknd",
      listenedMs: 75000,
      startedAt: new Date(),
      endedAt: new Date(),
    });
    expect(recordResult.success).toBe(true);

    const stats = await caller.music.getListeningStats();
    expect(stats.tracksPlayed).toBeGreaterThanOrEqual(1);
    expect(stats.topArtists.some((a) => a.name === "The Weeknd")).toBe(true);
  });

  it("provides recent search operations via tRPC", async () => {
    await caller.music.addRecentSearch({ query: "Radiohead" });
    const searches = await caller.music.recentSearches();
    expect(searches).toContain("Radiohead");

    await caller.music.removeRecentSearch({ query: "Radiohead" });
    const afterRemoval = await caller.music.recentSearches();
    expect(afterRemoval).not.toContain("Radiohead");
  });
});
