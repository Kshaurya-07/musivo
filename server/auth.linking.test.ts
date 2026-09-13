import { describe, expect, it } from "vitest";
import { createSpotifyState, verifySpotifyState } from "./spotify";

describe("Account Linking & Direct Spotify Login", () => {
  it("creates and verifies a state for direct Spotify login", async () => {
    const state = await createSpotifyState({
      isLogin: true,
      nonce: "login-nonce-123",
      redirectUri: "https://musivo-xgm4.onrender.com/api/spotify/callback",
      returnTo: "/?welcome=1",
    });

    const verified = await verifySpotifyState(state);
    expect(verified).not.toBeNull();
    expect(verified?.isLogin).toBe(true);
    expect(verified?.nonce).toBe("login-nonce-123");
    expect(verified?.redirectUri).toBe("https://musivo-xgm4.onrender.com/api/spotify/callback");
    expect(verified?.returnTo).toBe("/?welcome=1");
    expect(verified?.userId).toBeUndefined();
  });

  it("creates and verifies a state for account linking (existing Google user linking Spotify)", async () => {
    const state = await createSpotifyState({
      userId: 88,
      nonce: "link-nonce-456",
      redirectUri: "https://musivo-xgm4.onrender.com/api/spotify/callback",
      returnTo: "/",
    });

    const verified = await verifySpotifyState(state);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(88);
    expect(verified?.isLogin).toBe(false);
    expect(verified?.nonce).toBe("link-nonce-456");
  });

  it("rejects state without userId and without isLogin", async () => {
    const state = await createSpotifyState({
      nonce: "orphan-nonce",
      redirectUri: "https://musivo-xgm4.onrender.com/api/spotify/callback",
    });

    const verified = await verifySpotifyState(state);
    expect(verified).toBeNull();
  });
});
