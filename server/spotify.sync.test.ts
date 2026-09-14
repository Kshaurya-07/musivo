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
});
