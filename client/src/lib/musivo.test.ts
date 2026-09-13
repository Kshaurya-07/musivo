import { describe, expect, it } from "vitest";
import { formatTime, getNextTrackIndex, matchesTrackQuery } from "./musivo";

const sampleTracks = [
  { id: 1, title: "Midnight City", artist: "M83", album: "Hurry Up" },
  { id: 2, title: "Sunset Lover", artist: "Petit Biscuit", album: "Presence" },
  { id: 3, title: "A Moment Apart", artist: "ODESZA", album: "A Moment Apart" },
];

describe("Musivo helpers", () => {
  it("formats playback time without leaking invalid values", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(125.4)).toBe("2:05");
    expect(formatTime(Number.NaN)).toBe("0:00");
  });

  it("matches a query against title, artist, and album", () => {
    expect(matchesTrackQuery(sampleTracks[0], "m83")).toBe(true);
    expect(matchesTrackQuery(sampleTracks[1], "presence")).toBe(true);
    expect(matchesTrackQuery(sampleTracks[2], "jazz")).toBe(false);
    expect(matchesTrackQuery(sampleTracks[2], "  ")).toBe(true);
  });

  it("wraps the queue when moving past either end", () => {
    expect(getNextTrackIndex(sampleTracks, 1, -1)).toBe(2);
    expect(getNextTrackIndex(sampleTracks, 3, 1)).toBe(0);
    expect(getNextTrackIndex(sampleTracks, 99, 1)).toBe(1);
    expect(getNextTrackIndex([], 1, 1)).toBe(-1);
  });
});
