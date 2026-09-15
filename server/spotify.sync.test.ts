import { describe, expect, it } from "vitest";
import {
  getSpotifyConnectionStatus,
  getUserSavedTracksCount,
  upsertUser,
  getUserByOpenId,
  getUserByEmail,
  toggleLikedTrack,
  listLikedTracks,
  upsertSpotifyConnection,
  getSpotifyConnection,
  syncSpotifySavedTracksToLiked,
  getFamiliarTrackIds,
} from "./db";

describe("Database & Memory Fallback Store", () => {
  it("stores and retrieves users seamlessly in memory when database is unconfigured", async () => {
    const testOpenId = `google:test-sub-${Date.now()}`;
    const email = `listener-${Date.now()}@example.com`;

    await upsertUser({
      openId: testOpenId,
      name: "Test Listener",
      email,
      loginMethod: "google",
    });

    const user = await getUserByOpenId(testOpenId);
    expect(user).toBeDefined();
    expect(user?.openId).toBe(testOpenId);
    expect(user?.name).toBe("Test Listener");
    expect(user?.email).toBe(email);

    const userByEmail = await getUserByEmail(email);
    expect(userByEmail).toBeDefined();
    expect(userByEmail?.openId).toBe(testOpenId);
  });

  it("stores and toggles liked tracks in memory fallback", async () => {
    const userId = 777;
    const track = {
      externalId: "spotify-test-track-123",
      title: "Midnight City",
      artist: "M83",
      album: "Hurry Up, We're Dreaming",
      artworkUrl: "https://example.com/art.jpg",
      previewUrl: null,
      storeUrl: null,
      durationMs: 243000,
    };

    const firstToggle = await toggleLikedTrack(userId, track);
    expect(firstToggle.liked).toBe(true);

    const likes = await listLikedTracks(userId);
    expect(likes.some((t) => t.externalId === track.externalId)).toBe(true);

    const count = await getUserSavedTracksCount(userId);
    expect(count).toBeGreaterThanOrEqual(1);

    const secondToggle = await toggleLikedTrack(userId, track);
    expect(secondToggle.liked).toBe(false);
  });

  it("stores and retrieves spotify connection tokens in memory fallback", async () => {
    const userId = 888;
    await upsertSpotifyConnection({
      userId,
      spotifyUserId: "spotify-user-888",
      spotifyDisplayName: "Spotify Fan",
      spotifyProfileImageUrl: null,
      accessTokenEncrypted: "enc-token",
      refreshTokenEncrypted: "enc-refresh",
      accessTokenExpiresAt: new Date(Date.now() + 3600_000),
      scope: "streaming user-read-playback-state",
    });

    const conn = await getSpotifyConnection(userId);
    expect(conn).toBeDefined();
    expect(conn?.spotifyUserId).toBe("spotify-user-888");
    expect(conn?.spotifyDisplayName).toBe("Spotify Fan");

    const status = await getSpotifyConnectionStatus(userId);
    expect(status.connected).toBe(true);
    expect(status.displayName).toBe("Spotify Fan");
  });

  it("syncs Spotify saved tracks directly into user liked tracks without duplicates", async () => {
    const userId = 999;
    const tracksToSync = [
      {
        externalId: "spotify-sync-track-1",
        title: "Sunset Lover",
        artist: "Petit Biscuit",
        album: "Presence",
        artworkUrl: "https://example.com/sunset.jpg",
        previewUrl: null,
        storeUrl: "https://open.spotify.com/track/sync-1",
        durationMs: 237000,
      },
      {
        externalId: "spotify-sync-track-2",
        title: "Sun Models",
        artist: "ODESZA",
        album: "In Return",
        artworkUrl: "https://example.com/sunmodels.jpg",
        previewUrl: null,
        storeUrl: "https://open.spotify.com/track/sync-2",
        durationMs: 160000,
      },
    ];

    const insertedCount = await syncSpotifySavedTracksToLiked(userId, tracksToSync);
    expect(insertedCount).toBe(2);

    const liked = await listLikedTracks(userId);
    expect(liked.length).toBe(2);
    expect(liked.some((t) => t.externalId === "spotify-sync-track-1")).toBe(true);
    expect(liked.some((t) => t.externalId === "spotify-sync-track-2")).toBe(true);

    // Re-syncing the same tracks should not create duplicates
    const secondSyncCount = await syncSpotifySavedTracksToLiked(userId, tracksToSync);
    expect(secondSyncCount).toBe(0);

    const familiar = await getFamiliarTrackIds(userId);
    expect(familiar.has("spotify-sync-track-1")).toBe(true);
    expect(familiar.has("sync-track-1")).toBe(true);
  });
});
