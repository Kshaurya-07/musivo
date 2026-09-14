import { describe, expect, it } from "vitest";
import { buildGoogleAuthorizeUrl, createGoogleState, verifyGoogleState, hasGoogleCredentials } from "./google";

describe("Google OAuth", () => {
  it("creates and verifies signed Google OAuth state with CSRF protection", async () => {
    const nonce = "nonce-abc-123";
    const redirectUri = "https://musivo.example/api/auth/google/callback";
    const returnTo = "/?view=spotify";

    const state = await createGoogleState({ nonce, redirectUri, returnTo });
    expect(typeof state).toBe("string");
    expect(state.length).toBeGreaterThan(20);

    const verified = await verifyGoogleState(state);
    expect(verified).not.toBeNull();
    expect(verified?.nonce).toBe(nonce);
    expect(verified?.redirectUri).toBe(redirectUri);
    expect(verified?.returnTo).toBe(returnTo);
  });

  it("rejects tampered Google state tokens", async () => {
    const state = await createGoogleState({
      nonce: "valid-nonce",
      redirectUri: "https://musivo.example/api/auth/google/callback",
    });

    const tampered = `${state}bad`;
    const verified = await verifyGoogleState(tampered);
    expect(verified).toBeNull();
  });

  it("builds a valid Google authorize URL with OpenID Connect scopes when configured", () => {
    if (!hasGoogleCredentials()) {
      expect(() => buildGoogleAuthorizeUrl("mock-state", "https://musivo.example/callback")).toThrow(
        "Google OAuth credentials are not configured"
      );
    } else {
      const urlStr = buildGoogleAuthorizeUrl("test-state", "https://musivo.example/callback");
      const url = new URL(urlStr);
      expect(url.origin).toBe("https://accounts.google.com");
      expect(url.pathname).toBe("/o/oauth2/v2/auth");
      expect(url.searchParams.get("response_type")).toBe("code");
      expect(url.searchParams.get("scope")).toContain("openid");
      expect(url.searchParams.get("scope")).toContain("email");
      expect(url.searchParams.get("scope")).toContain("profile");
      expect(url.searchParams.get("state")).toBe("test-state");
      expect(url.searchParams.get("prompt")).toBe("select_account");
    }
  });
});
