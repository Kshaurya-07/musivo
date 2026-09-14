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
  });
});
