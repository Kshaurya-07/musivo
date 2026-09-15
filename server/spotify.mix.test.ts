import { describe, expect, it } from "vitest";
import { createAiSpotifyMix, MOOD_PROFILES } from "./spotify";

describe("Enhanced AI Mix Studio", () => {
  it("defines complete mood profiles with seed artists and descriptions", () => {
    expect(MOOD_PROFILES.chill).toBeDefined();
    expect(MOOD_PROFILES.chill.name).toBe("Midnight Reverie");
    expect(MOOD_PROFILES.workout).toBeDefined();
    expect(MOOD_PROFILES.workout.name).toBe("Neon Cardio");
    expect(MOOD_PROFILES.focus).toBeDefined();
    expect(MOOD_PROFILES.focus.name).toBe("Deep Flow State");
    expect(MOOD_PROFILES.party).toBeDefined();
    expect(MOOD_PROFILES.nostalgia).toBeDefined();
    expect(MOOD_PROFILES.acoustic).toBeDefined();
  });

  it("gracefully generates an AI mix without throwing on empty recent tracks", async () => {
    const result = await createAiSpotifyMix(999999, {
      mood: "chill",
      count: 4,
      saveToSpotify: false,
    });

    expect(result).toBeDefined();
    expect(result.mood).toBe("chill");
    expect(result.title).toContain("Midnight Reverie");
    expect(result.playlist).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it("accepts a custom prompt and formats the mix title and metadata appropriately", async () => {
    const result = await createAiSpotifyMix(999999, {
      prompt: "Cyberpunk rain drive",
      count: 6,
      saveToSpotify: false,
    });

    expect(result).toBeDefined();
    expect(result.title).toContain("Cyberpunk rain drive");
    expect(result.description).toContain("Cyberpunk rain drive");
    expect(result.tasteProfile).toBeDefined();
    expect(result.tasteProfile?.learnedVibeSummary).toBeDefined();
  });

  it("trains user taste profile and extracts top affinities and summary", async () => {
    const { trainUserAiProfile, listPastAiPlaylists } = await import("./spotify");
    const profile = await trainUserAiProfile(999999);

    expect(profile).toBeDefined();
    expect(Array.isArray(profile.topArtists)).toBe(true);
    expect(profile.topArtists.length).toBeGreaterThan(0);
    expect(Array.isArray(profile.topSeedAffinities)).toBe(true);
    expect(profile.topSeedAffinities.length).toBeGreaterThan(0);
    expect(typeof profile.learnedVibeSummary).toBe("string");
    expect(typeof profile.trainedAt).toBe("string");

    const pastAiPlaylists = await listPastAiPlaylists(999999);
    expect(Array.isArray(pastAiPlaylists)).toBe(true);
  });

  it("discovers novel related artists from seed artists", async () => {
    const { discoverRelatedArtists } = await import("./spotify");
    const related = await discoverRelatedArtists(undefined, ["M83"], 5);

    expect(Array.isArray(related)).toBe(true);
    expect(related.length).toBeGreaterThan(0);
    expect(related).toContain("Tycho");
    expect(related.map((r) => r.toLowerCase())).not.toContain("m83");
  });

  it("produces exploratory mixes without 30-second audio preview clipping and incorporates search intent", async () => {
    const result = await createAiSpotifyMix(999999, {
      mood: "chill",
      searchIntent: "deep house sunset",
      refreshSeed: 42,
      count: 4,
      saveToSpotify: false,
    });

    expect(result).toBeDefined();
    expect(result.title).toContain("deep house sunset");
    expect(result.recommendations.length).toBeGreaterThanOrEqual(0);
    for (const rec of result.recommendations) {
      expect(rec.audio).toBe(""); // Ensure 30s preview URLs are never assigned to audio!
      expect(rec.durationMs).toBeGreaterThan(0);
    }
  });
});
