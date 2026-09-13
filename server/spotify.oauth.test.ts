import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { buildSpotifyAuthorizeUrl, createSpotifyState, decryptSpotifyToken, encryptSpotifyToken, verifySpotifyState, spotifyUserScopes } from "./spotify";
import type { TrpcContext } from "./_core/context";

function createContext(cookieCalls: Array<{ name: string; value: string; options: Record<string, unknown> }>): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "oauth-user",
      email: "listener@example.com",
      name: "Listener",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => cookieCalls.push({ name, value, options }),
    } as TrpcContext["res"],
  };
}

describe("Spotify OAuth", () => {
  it("encrypts and decrypts tokens without storing plaintext", () => {
    const original = "refresh-token-value";
    const encrypted = encryptSpotifyToken(original);
    expect(encrypted).not.toContain(original);
    expect(decryptSpotifyToken(encrypted)).toBe(original);
  });

  it("creates a signed state that verifies and rejects tampering", async () => {
    const state = await createSpotifyState({ userId: 42, nonce: "nonce-123", redirectUri: "https://musivo.example/api/spotify/callback" });
    await expect(verifySpotifyState(state)).resolves.toMatchObject({ userId: 42, nonce: "nonce-123" });
    await expect(verifySpotifyState(`${state}tampered`)).resolves.toBeNull();
  });

  it("builds an authorization URL with playlist and recent-history scopes", async () => {
    const state = await createSpotifyState({ userId: 42, nonce: "nonce-123", redirectUri: "https://musivo.example/api/spotify/callback" });
    const url = new URL(buildSpotifyAuthorizeUrl(state, "https://musivo.example/api/spotify/callback"));
    expect(url.origin).toBe("https://accounts.spotify.com");
    expect(url.pathname).toBe("/authorize");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe(spotifyUserScopes);
    expect(url.searchParams.get("state")).toBe(state);
  });

  it("requires a protected user session and sets a secure state cookie", async () => {
    const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
    const caller = appRouter.createCaller(createContext(cookies));
    const result = await caller.spotify.connect({ origin: "https://musivo.example" });
    expect(result.authorizeUrl).toContain("https://accounts.spotify.com/authorize");
    expect(cookies).toHaveLength(1);
    expect(cookies[0]).toMatchObject({
      name: "__Host-spotify_state",
      options: { httpOnly: true, secure: true, sameSite: "none", path: "/" },
    });
    const state = new URL(result.authorizeUrl).searchParams.get("state");
    expect(state).toBeTruthy();
    await expect(verifySpotifyState(state!)).resolves.toMatchObject({ userId: 42 });
  });
});
