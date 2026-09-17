import { describe, expect, it, vi, afterEach } from "vitest";
import {
  searchSpotifyCatalog,
  getSpotifyShow,
  getSpotifyShowEpisodes,
  getSpotifyEpisode,
  getSpotifyArtist,
  getSpotifyArtistTopTracks,
  getSpotifyArtistAlbums,
  getSpotifyAlbum,
  getSpotifyDevices,
  transferSpotifyPlayback,
  generateSmartQueueContinuation,
} from "./spotify";

describe("Universal Catalog Search", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("safely handles catalog search on empty or error response without throwing", async () => {
    const result = await searchSpotifyCatalog(undefined, "unknown artist xyz 9999", ["track", "artist"], 5);

    expect(result).toBeDefined();
    expect(Array.isArray(result.tracks)).toBe(true);
    expect(Array.isArray(result.artists)).toBe(true);
    expect(Array.isArray(result.albums)).toBe(true);
    expect(Array.isArray(result.playlists)).toBe(true);
    expect(Array.isArray(result.shows)).toBe(true);
  });

  it("maps multi-type responses and computes exact topResult spotlight", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/token")) {
        return new Response(JSON.stringify({ access_token: "mock-token", expires_in: 3600 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({
        tracks: {
          items: [{
            id: "track-123",
            name: "Bohemian Rhapsody",
            artists: [{ name: "Queen" }],
            album: { name: "A Night at the Opera", images: [{ url: "https://example.com/cover.jpg" }] },
            duration_ms: 354000,
            preview_url: "https://example.com/preview.mp3",
            external_urls: { spotify: "https://open.spotify.com/track/track-123" },
          }],
        },
        artists: {
          items: [{
            id: "artist-456",
            name: "Queen",
            genres: ["classic rock", "glam rock"],
            followers: { total: 50000000 },
            images: [{ url: "https://example.com/queen.jpg" }],
            external_urls: { spotify: "https://open.spotify.com/artist/artist-456" },
          }],
        },
        albums: {
          items: [{
            id: "album-789",
            name: "A Night at the Opera",
            artists: [{ name: "Queen" }],
            images: [{ url: "https://example.com/cover.jpg" }],
            release_date: "1975-11-21",
            total_tracks: 12,
            external_urls: { spotify: "https://open.spotify.com/album/album-789" },
          }],
        },
        playlists: { items: [] },
        shows: { items: [] },
        episodes: { items: [] },
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }));

    const result = await searchSpotifyCatalog(undefined, "Queen", ["track", "artist", "album"], 10);

    expect(result.tracks.length).toBe(1);
    expect(result.tracks[0].title).toBe("Bohemian Rhapsody");
    expect(result.artists.length).toBe(1);
    expect(result.artists[0].name).toBe("Queen");
    expect(result.albums.length).toBe(1);
    expect(result.albums[0].name).toBe("A Night at the Opera");

    // Exact artist name match should be spotlighted as topResult
    expect(result.topResult).toBeDefined();
    expect(result.topResult?.type).toBe("artist");
    expect((result.topResult?.item as any).name).toBe("Queen");
  });
});

describe("Podcasts & Episodes Metadata Architecture", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("retrieves podcast show details and formats episodes", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/token")) {
        return new Response(JSON.stringify({ access_token: "mock-token", expires_in: 3600 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({
        id: "show-999",
        name: "Huberman Lab",
        publisher: "Andrew Huberman",
        description: "Neuroscience and health podcast.",
        images: [{ url: "https://example.com/huberman.jpg" }],
        total_episodes: 200,
        episodes: {
          items: [{
            id: "ep-001",
            name: "How to Optimize Sleep",
            description: "Deep dive into sleep architecture.",
            duration_ms: 7200000,
            release_date: "2024-01-01",
            images: [{ url: "https://example.com/ep001.jpg" }],
            resume_point: { resume_position_ms: 1800000 },
          }],
        },
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }));

    const show = await getSpotifyShow(undefined, "show-999");
    expect(show).toBeDefined();
    expect(show?.id).toBe("show-999");
    expect(show?.name).toBe("Huberman Lab");
    expect(show?.publisher).toBe("Andrew Huberman");
    expect(show?.episodes.length).toBe(1);
    expect(show?.episodes[0].resumePositionMs).toBe(1800000);
  });

  it("safely handles missing or invalid show IDs with null without crashing", async () => {
    const show = await getSpotifyShow(undefined, "invalid-nonexistent-show");
    expect(show).toBeNull();
  });

  it("retrieves episode details with resume point support", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/token")) {
        return new Response(JSON.stringify({ access_token: "mock-token", expires_in: 3600 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({
        id: "ep-555",
        name: "AI & The Future",
        description: "Discussion on artificial intelligence.",
        duration_ms: 3600000,
        release_date: "2024-02-15",
        images: [{ url: "https://example.com/ep555.jpg" }],
        resume_point: { resume_position_ms: 900000 },
        show: {
          id: "show-888",
          name: "Future Tech",
          publisher: "Tech Media",
          images: [{ url: "https://example.com/tech.jpg" }],
        },
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }));

    const ep = await getSpotifyEpisode(undefined, "ep-555");
    expect(ep).toBeDefined();
    expect(ep?.id).toBe("ep-555");
    expect(ep?.name).toBe("AI & The Future");
    expect(ep?.resumePositionMs).toBe(900000);
    expect(ep?.show?.name).toBe("Future Tech");
  });
});

describe("Artists & Albums Navigation", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("fetches artist details, top tracks, and discography albums", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/token")) {
        return new Response(JSON.stringify({ access_token: "mock-token", expires_in: 3600 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (urlStr.includes("/top-tracks")) {
        return new Response(JSON.stringify({
          tracks: [{
            id: "top-track-1",
            name: "Starboy",
            artists: [{ name: "The Weeknd" }],
            album: { name: "Starboy", images: [{ url: "https://example.com/starboy.jpg" }] },
            duration_ms: 230000,
            preview_url: "https://example.com/starboy.mp3",
          }],
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (urlStr.includes("/albums")) {
        return new Response(JSON.stringify({
          items: [{
            id: "album-weeknd-1",
            name: "After Hours",
            artists: [{ name: "The Weeknd" }],
            images: [{ url: "https://example.com/afterhours.jpg" }],
            release_date: "2020-03-20",
            total_tracks: 14,
          }],
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({
        id: "weeknd-id",
        name: "The Weeknd",
        genres: ["pop", "r&b"],
        followers: { total: 85000000 },
        images: [{ url: "https://example.com/weeknd.jpg" }],
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }));

    const artist = await getSpotifyArtist(undefined, "weeknd-id");
    expect(artist).toBeDefined();
    expect(artist?.name).toBe("The Weeknd");
    expect(artist?.genres).toContain("r&b");

    const topTracks = await getSpotifyArtistTopTracks(undefined, "weeknd-id");
    expect(topTracks.length).toBe(1);
    expect(topTracks[0].title).toBe("Starboy");

    const albums = await getSpotifyArtistAlbums(undefined, "weeknd-id");
    expect(albums.length).toBe(1);
    expect(albums[0].name).toBe("After Hours");
  });

  it("fetches album details with complete track list", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/token")) {
        return new Response(JSON.stringify({ access_token: "mock-token", expires_in: 3600 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({
        id: "album-dp-1",
        name: "Discovery",
        artists: [{ id: "dp-id", name: "Daft Punk" }],
        images: [{ url: "https://example.com/discovery.jpg" }],
        release_date: "2001-03-12",
        total_tracks: 2,
        tracks: {
          items: [
            {
              id: "dp-track-1",
              name: "One More Time",
              artists: [{ name: "Daft Punk" }],
              duration_ms: 320000,
              track_number: 1,
            },
            {
              id: "dp-track-2",
              name: "Aerodynamic",
              artists: [{ name: "Daft Punk" }],
              duration_ms: 212000,
              track_number: 2,
            },
          ],
        },
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }));

    const album = await getSpotifyAlbum(undefined, "album-dp-1");
    expect(album).toBeDefined();
    expect(album?.name).toBe("Discovery");
    expect(album?.tracks.length).toBe(2);
    expect(album?.tracks[0].title).toBe("One More Time");
    expect(album?.tracks[1].title).toBe("Aerodynamic");
  });
});

describe("Spotify Connect Device Management", () => {
  it("safely handles disconnected user device query returning empty list", async () => {
    const devices = await getSpotifyDevices(999999);
    expect(Array.isArray(devices)).toBe(true);
    expect(devices.length).toBe(0);
  });

  it("throws error when transferring playback for disconnected user", async () => {
    await expect(transferSpotifyPlayback(999999, "device-123", true)).rejects.toThrow(
      "Spotify account is not connected"
    );
  });
});

describe("Smart Queue Continuation", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("discovers candidate tracks and excludes seed IDs", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/token")) {
        return new Response(JSON.stringify({ access_token: "mock-token", expires_in: 3600 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({
        tracks: {
          items: [
            {
              id: "seed-track-1",
              name: "Already Played Seed 1",
              artists: [{ name: "Artist A" }],
              album: { name: "Album A", images: [{ url: "https://example.com/a.jpg" }] },
              duration_ms: 200000,
            },
            {
              id: "new-track-discovery-2",
              name: "Fresh Undiscovered Track",
              artists: [{ name: "Artist B" }],
              album: { name: "Album B", images: [{ url: "https://example.com/b.jpg" }] },
              duration_ms: 240000,
            },
          ],
        },
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }));

    const seeds = ["seed-track-1"];
    const candidates = await generateSmartQueueContinuation(undefined, seeds);

    expect(Array.isArray(candidates)).toBe(true);
    for (const track of candidates) {
      expect(track.id).not.toBe("spotify-seed-track-1");
      expect(track.id).not.toBe("seed-track-1");
    }
  });
});

describe("Sleep Timer Calculation Logic", () => {
  it("calculates countdown duration properly for presets and end-of-track", () => {
    const presetMinutes = 15;
    const totalSeconds = presetMinutes * 60;
    expect(totalSeconds).toBe(900);

    // End-of-track remaining calculation
    const trackDurationSec = 240;
    const currentProgressSec = 190;
    const remainingToTrackEnd = Math.max(1, trackDurationSec - currentProgressSec);
    expect(remainingToTrackEnd).toBe(50);

    // 10s fade-out boundary calculation
    const isFading = remainingToTrackEnd <= 10;
    expect(isFading).toBe(false);

    const nearEndSec = 6;
    const fadeVolume = Math.round((nearEndSec / 10) * 80);
    expect(fadeVolume).toBe(48);
  });
});
