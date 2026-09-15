import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import {
  buildSpotifyAuthorizeUrl,
  createSpotifyState,
  decryptSpotifyToken,
  encryptSpotifyToken,
  executeCodeExchangeOnce,
  getCanonicalSpotifyRedirectUri,
  verifySpotifyState,
  spotifyUserScopes,
} from "./spotify";
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

  it("canonicalizes Spotify redirect URIs consistently", () => {
    expect(getCanonicalSpotifyRedirectUri("https://musivo.app")).toBe("https://musivo.app/api/spotify/callback");
    expect(getCanonicalSpotifyRedirectUri("https://musivo.app/")).toBe("https://musivo.app/api/spotify/callback");
    expect(getCanonicalSpotifyRedirectUri("http://localhost:3000/")).toBe("http://localhost:3000/api/spotify/callback");
  });

  it("guarantees idempotent authorization code exchange (never re-calls Spotify for duplicate code)", async () => {
    let callCount = 0;
    const mockExchangeFn = async (code: string, redirectUri: string) => {
      callCount++;
      return {
        access_token: `mock-token-for-${code}`,
        refresh_token: `mock-refresh-for-${code}`,
        expires_in: 3600,
      };
    };

    const code = `unique-test-code-${Date.now()}`;
    const redirectUri = "https://musivo.app/api/spotify/callback";

    // Request 1: Initial callback exchange
    const res1 = await executeCodeExchangeOnce(code, redirectUri, mockExchangeFn);
    expect(res1.access_token).toBe(`mock-token-for-${code}`);
    expect(callCount).toBe(1);

    // Request 2: Duplicate callback / browser reload / pre-fetch with same code
    const res2 = await executeCodeExchangeOnce(code, redirectUri, mockExchangeFn);
    expect(res2.access_token).toBe(`mock-token-for-${code}`);
    // MUST NOT have called Spotify again!
    expect(callCount).toBe(1);
  });

  it("deduplicates concurrent code exchanges to a single in-flight call", async () => {
    let callCount = 0;
    const slowMockExchangeFn = async (code: string, redirectUri: string) => {
      callCount++;
      await new Promise((r) => setTimeout(r, 50));
      return {
        access_token: `slow-token-${code}`,
        refresh_token: `slow-refresh-${code}`,
        expires_in: 3600,
      };
    };

    const code = `concurrent-code-${Date.now()}`;
    const redirectUri = "https://musivo.app/api/spotify/callback";

    // Launch 3 simultaneous requests with the exact same code
    const [p1, p2, p3] = await Promise.all([
      executeCodeExchangeOnce(code, redirectUri, slowMockExchangeFn),
      executeCodeExchangeOnce(code, redirectUri, slowMockExchangeFn),
      executeCodeExchangeOnce(code, redirectUri, slowMockExchangeFn),
    ]);

    expect(p1.access_token).toBe(`slow-token-${code}`);
    expect(p2.access_token).toBe(`slow-token-${code}`);
    expect(p3.access_token).toBe(`slow-token-${code}`);
    // Underlying exchange must have executed strictly once!
    expect(callCount).toBe(1);
  });
});

it("does not expose a playback token without a connected streaming scope", async () => {
  const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  const caller = appRouter.createCaller(createContext(cookies));
  await expect(caller.spotify.playbackToken()).rejects.toMatchObject({ code: "FORBIDDEN" });
});
