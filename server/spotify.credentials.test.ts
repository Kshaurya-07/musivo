import { describe, expect, it } from "vitest";

describe("Spotify credentials", () => {
  it("can obtain a catalog access token", async () => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    expect(clientId, "SPOTIFY_CLIENT_ID must be configured").toBeTruthy();
    expect(clientSecret, "SPOTIFY_CLIENT_SECRET must be configured").toBeTruthy();

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    expect(response.ok).toBe(true);
    const payload = (await response.json()) as { access_token?: string; token_type?: string };
    expect(payload.access_token).toBeTruthy();
    expect(payload.token_type).toBe("Bearer");
  }, 15000);
});
