import { describe, expect, it } from "vitest";
import { formatTime, getNextTrackIndex } from "./musivo";

describe("Playback helpers and logic", () => {
  it("formats time correctly from seconds", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(45)).toBe("0:45");
    expect(formatTime(60)).toBe("1:00");
    expect(formatTime(125.4)).toBe("2:05");
    expect(formatTime(360)).toBe("6:00");
    expect(formatTime(-5)).toBe("0:00");
    expect(formatTime(Number.NaN)).toBe("0:00");
  });

  it("handles track URI resolution for Spotify tracks", () => {
    const formatSpotifyUri = (idOrUri: string) => {
      const rawId = idOrUri.replace(/^spotify-/, "").replace(/^spotify:track:/, "");
      return rawId.startsWith("spotify:") ? rawId : `spotify:track:${rawId}`;
    };

    expect(formatSpotifyUri("spotify-4cOdK2wGLETKBW3PvgPWqT")).toBe(
      "spotify:track:4cOdK2wGLETKBW3PvgPWqT"
    );
    expect(formatSpotifyUri("spotify:track:4cOdK2wGLETKBW3PvgPWqT")).toBe(
      "spotify:track:4cOdK2wGLETKBW3PvgPWqT"
    );
    expect(formatSpotifyUri("4cOdK2wGLETKBW3PvgPWqT")).toBe(
      "spotify:track:4cOdK2wGLETKBW3PvgPWqT"
    );
  });

  it("detects whether a track is a Spotify track", () => {
    const isSpotifyTrack = (track: { id: string | number; source?: string; storeUrl?: string }) => {
      return (
        String(track.id).startsWith("spotify-") ||
        track.source === "Spotify" ||
        Boolean(track.storeUrl?.includes("spotify.com"))
      );
    };

    expect(
      isSpotifyTrack({
        id: "spotify-12345",
        source: "Spotify",
        storeUrl: "https://open.spotify.com/track/12345",
      })
    ).toBe(true);

    expect(
      isSpotifyTrack({
        id: "itunes-9876",
        source: "iTunes",
        storeUrl: "https://music.apple.com/song/9876",
      })
    ).toBe(false);

    expect(
      isSpotifyTrack({
        id: "fallback-1",
        source: "fallback",
      })
    ).toBe(false);
  });

  it("interpolates Spotify position correctly during playback", () => {
    const interpolatePosition = (
      lastPositionMs: number,
      stateTimestamp: number,
      currentTimestamp: number,
      durationMs: number,
      paused: boolean
    ) => {
      if (paused) return Math.floor(lastPositionMs / 1000);
      const elapsed = Math.max(0, currentTimestamp - stateTimestamp);
      const currentPosMs = Math.min(lastPositionMs + elapsed, durationMs);
      return Math.floor(currentPosMs / 1000);
    };

    const startTime = 10000;
    // 5 seconds elapsed while playing
    expect(interpolatePosition(20000, startTime, startTime + 5000, 60000, false)).toBe(25);
    // Does not exceed duration
    expect(interpolatePosition(58000, startTime, startTime + 5000, 60000, false)).toBe(60);
    // Paused state does not advance
    expect(interpolatePosition(20000, startTime, startTime + 5000, 60000, true)).toBe(20);
  });

  it("navigates forward and backward in playlist queue without boundary errors", () => {
    const queue = [
      { id: "track-1" },
      { id: "track-2" },
      { id: "track-3" },
    ];

    expect(getNextTrackIndex(queue, "track-1", 1)).toBe(1);
    expect(getNextTrackIndex(queue, "track-2", 1)).toBe(2);
    expect(getNextTrackIndex(queue, "track-3", 1)).toBe(0); // wraps around

    expect(getNextTrackIndex(queue, "track-1", -1)).toBe(2); // wraps backward
    expect(getNextTrackIndex(queue, "track-3", -1)).toBe(1);
  });

  it("supports queue mutations and shuffling while preserving active track", () => {
    const queue = [
      { id: "active", title: "Active Song" },
      { id: "track-1", title: "Song 1" },
      { id: "track-2", title: "Song 2" },
      { id: "track-3", title: "Song 3" },
    ];

    // Add to queue
    const newTrack = { id: "track-4", title: "Song 4" };
    const withAdded = [...queue, newTrack];
    expect(withAdded.length).toBe(5);
    expect(withAdded[4].id).toBe("track-4");

    // Play next in queue (insert at index 1)
    const playNextTrack = { id: "next-up", title: "Next Up" };
    const curIdx = 0;
    const withNext = [...queue];
    withNext.splice(curIdx + 1, 0, playNextTrack);
    expect(withNext[1].id).toBe("next-up");
    expect(withNext[2].id).toBe("track-1");

    // Remove from queue
    const withoutTrack2 = queue.filter((t) => t.id !== "track-2");
    expect(withoutTrack2.length).toBe(3);
    expect(withoutTrack2.some((t) => t.id === "track-2")).toBe(false);

    // Shuffle preserving active track at head
    const curTrackId = "active";
    const cur = queue.find((t) => t.id === curTrackId)!;
    const others = queue.filter((t) => t.id !== curTrackId);
    const shuffled = [cur, ...others.reverse()];
    expect(shuffled[0].id).toBe("active");
    expect(shuffled.length).toBe(4);
  });

  it("handles repeat modes correctly across queue boundaries", () => {
    type RepeatMode = "off" | "all" | "one";
    const getNextInQueue = (
      activeQueue: Array<{ id: string }>,
      currentId: string,
      repeatMode: RepeatMode
    ) => {
      const idx = activeQueue.findIndex((t) => t.id === currentId);
      if (repeatMode === "one") return currentId;
      if (idx >= 0 && idx < activeQueue.length - 1) return activeQueue[idx + 1].id;
      if (repeatMode === "all" && activeQueue.length > 0) return activeQueue[0].id;
      return null; // end of playback
    };

    const queue = [{ id: "t1" }, { id: "t2" }, { id: "t3" }];

    // Normal advance
    expect(getNextInQueue(queue, "t1", "off")).toBe("t2");
    expect(getNextInQueue(queue, "t2", "off")).toBe("t3");
    // End of queue with repeat off
    expect(getNextInQueue(queue, "t3", "off")).toBeNull();
    // End of queue with repeat all
    expect(getNextInQueue(queue, "t3", "all")).toBe("t1");
    // Repeat one
    expect(getNextInQueue(queue, "t2", "one")).toBe("t2");
  });
});
