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
});
