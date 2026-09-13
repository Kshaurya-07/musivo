import { describe, expect, it } from "vitest";
import { getSpotifyConnectionStatus, getUserSavedTracksCount } from "./db";

describe("Spotify Library Sync & Status", () => {
  it("returns disconnected status with zero saved tracks for unlinked user", async () => {
    // When DB is null or user does not exist in dev/test environment
    const status = await getSpotifyConnectionStatus(999999);
    expect(status.connected).toBe(false);
    expect(status.displayName).toBeNull();
    expect(status.savedTracksCount).toBe(0);
  });

  it("calculates saved tracks count gracefully when user has no tracks or DB is mocked", async () => {
    const count = await getUserSavedTracksCount(999999);
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
