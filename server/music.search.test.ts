import { describe, expect, it, afterEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("music.search", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("maps provider metadata into Musivo track results", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      results: [{
        trackId: 123,
        trackName: "Demo Song",
        artistName: "Demo Artist",
        collectionName: "Demo Album",
        artworkUrl100: "http://example.com/100x100.jpg",
        previewUrl: "http://example.com/preview.m4a",
        trackViewUrl: "https://music.apple.com/demo",
        trackTimeMillis: 185000,
      }],
    }), { status: 200, headers: { "Content-Type": "application/json" } })));

    const caller = appRouter.createCaller(createPublicContext());
    const [result] = await caller.music.search({ query: "demo", limit: 1 });

    expect(result).toMatchObject({
      id: "itunes-123",
      title: "Demo Song",
      artist: "Demo Artist",
      album: "Demo Album",
      art: "http://example.com/600x600.jpg",
      audio: "https://example.com/preview.m4a",
      source: "iTunes",
    });
  });
});
