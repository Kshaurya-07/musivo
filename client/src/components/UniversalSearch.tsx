import React, { useState, useEffect } from "react";
import {
  Search,
  X,
  Play,
  Pause,
  Plus,
  Users,
  Disc3,
  ListMusic,
  Mic,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { usePlayback, type PlaybackTrack } from "@/contexts/PlaybackContext";
import { formatTime } from "@/lib/musivo";

interface UniversalSearchProps {
  onSelectArtist: (artistId: string) => void;
  onSelectAlbum: (albumId: string) => void;
  onSelectShow: (showId: string) => void;
  initialQuery?: string;
}

type SearchCategory = "all" | "tracks" | "artists" | "albums" | "playlists" | "shows";

export function UniversalSearch({
  onSelectArtist,
  onSelectAlbum,
  onSelectShow,
  initialQuery = "",
}: UniversalSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [category, setCategory] = useState<SearchCategory>("all");

  const { playTrack, currentTrack, isPlaying, togglePlay, addToQueue } = usePlayback();

  // Debounce input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Determine API types param from category
  const typesMap: Record<SearchCategory, string[]> = {
    all: ["track", "artist", "album", "playlist", "show"],
    tracks: ["track"],
    artists: ["artist"],
    albums: ["album"],
    playlists: ["playlist"],
    shows: ["show"],
  };

  const searchQuery = trpc.music.universalSearch.useQuery(
    {
      query: debouncedQuery,
      types: typesMap[category],
      limit: category === "all" ? 12 : 24,
    },
    {
      enabled: Boolean(debouncedQuery.length >= 1),
      staleTime: 1000 * 60 * 3,
    }
  );

  const results = searchQuery.data;
  const tracks = results?.tracks || [];
  const artists = results?.artists || [];
  const albums = results?.albums || [];
  const playlists = results?.playlists || [];
  const shows = results?.shows || [];
  const topResult = results?.topResult;

  const categories: Array<{ id: SearchCategory; label: string }> = [
    { id: "all", label: "All" },
    { id: "tracks", label: "Songs" },
    { id: "artists", label: "Artists" },
    { id: "albums", label: "Albums" },
    { id: "playlists", label: "Playlists" },
    { id: "shows", label: "Podcasts" },
  ];

  const handlePlayTrack = async (track: (typeof tracks)[0]) => {
    const isCurrent = String(currentTrack.id) === String(track.id);
    if (isCurrent) {
      await togglePlay();
      return;
    }
    const formatted: PlaybackTrack = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration: track.durationMs ? formatTime(track.durationMs / 1000) : "3:30",
      art: track.art,
      audio: track.audio,
      accent: track.accent || "#f5ba42",
      badge: "SEARCH",
      storeUrl: track.storeUrl,
      durationMs: track.durationMs,
      source: track.source,
    };
    const queueFormatted: PlaybackTrack[] = tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: t.album,
      duration: t.durationMs ? formatTime(t.durationMs / 1000) : "3:30",
      art: t.art,
      audio: t.audio,
      accent: t.accent || "#f5ba42",
      badge: "SEARCH",
      storeUrl: t.storeUrl,
      durationMs: t.durationMs,
      source: t.source,
    }));
    await playTrack(formatted, queueFormatted);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Search Input Bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-[#8c7b68] pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, artists, albums, podcasts, or playlists..."
            className="w-full pl-12 pr-10 py-3.5 sm:py-4 rounded-2xl bg-white/[0.05] border border-white/10 text-white placeholder-[#8c7b68] text-sm sm:text-base focus:outline-none focus:border-[#f5ba42]/50 focus:ring-2 focus:ring-[#f5ba42]/10 transition shadow-inner"
            autoFocus
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setDebouncedQuery("");
              }}
              className="absolute right-3.5 p-1 rounded-full text-[#8c7b68] hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isActive = category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? "bg-[#f5ba42] text-black shadow-md shadow-[#f5ba42]/20"
                  : "bg-white/[0.04] text-[#b2a28f] hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {searchQuery.isLoading && (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#f5ba42] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#8c7b68]">Searching the global catalog...</p>
        </div>
      )}

      {/* Search Results Display */}
      {debouncedQuery && !searchQuery.isLoading && (
        <div className="space-y-8">
          {/* Top Result Banner (if in "all" category and top result exists) */}
          {category === "all" && topResult && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8c7b68]">
                Top Result
              </h2>

              <div className="p-5 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] hover:border-[#f5ba42]/40 transition group">
                {topResult.type === "artist" && (
                  <div
                    onClick={() => onSelectArtist(topResult.item.id)}
                    className="cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={
                          topResult.item.images?.[0]?.url ||
                          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80"
                        }
                        alt={topResult.item.name}
                        className="w-20 h-20 rounded-full object-cover shadow-lg border border-white/10"
                      />
                      <div className="space-y-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#f5ba42]/20 text-[#f5ba42] font-semibold">
                          Artist
                        </span>
                        <h3 className="text-xl font-bold text-white group-hover:text-[#f5ba42] transition">
                          {topResult.item.name}
                        </h3>
                        <p className="text-xs text-[#8c7b68]">
                          {(topResult.item.followers || 0).toLocaleString()} followers
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-full bg-[#f5ba42] text-black shadow-lg">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                )}

                {topResult.type === "track" && (
                  <div
                    onClick={() => handlePlayTrack(topResult.item)}
                    className="cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={topResult.item.art}
                        alt={topResult.item.title}
                        className="w-20 h-20 rounded-2xl object-cover shadow-lg border border-white/10"
                      />
                      <div className="space-y-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#f5ba42]/20 text-[#f5ba42] font-semibold">
                          Song
                        </span>
                        <h3 className="text-xl font-bold text-white group-hover:text-[#f5ba42] transition">
                          {topResult.item.title}
                        </h3>
                        <p className="text-xs text-[#8c7b68]">
                          {topResult.item.artist} • {topResult.item.album}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-full bg-[#f5ba42] text-black shadow-lg transform group-hover:scale-110 transition">
                      {isPlaying && String(currentTrack.id) === String(topResult.item.id) ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </div>
                  </div>
                )}

                {topResult.type === "show" && (
                  <div
                    onClick={() => onSelectShow(topResult.item.id)}
                    className="cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={topResult.item.images?.[0]?.url}
                        alt={topResult.item.name}
                        className="w-20 h-20 rounded-2xl object-cover shadow-lg border border-white/10"
                      />
                      <div className="space-y-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#f5ba42]/20 text-[#f5ba42] font-semibold">
                          Podcast
                        </span>
                        <h3 className="text-xl font-bold text-white group-hover:text-[#f5ba42] transition">
                          {topResult.item.name}
                        </h3>
                        <p className="text-xs text-[#8c7b68]">
                          {topResult.item.publisher} • {topResult.item.totalEpisodes} episodes
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-full bg-[#f5ba42] text-black shadow-lg">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Songs Section */}
          {(category === "all" || category === "tracks") && tracks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8c7b68]">
                Songs
              </h2>

              <div className="space-y-1">
                {tracks.slice(0, category === "all" ? 5 : 20).map((track) => {
                  const isTrackPlaying =
                    isPlaying && String(currentTrack.id) === String(track.id);

                  return (
                    <div
                      key={track.id}
                      onClick={() => handlePlayTrack(track)}
                      className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition ${
                        isTrackPlaying
                          ? "bg-[#f5ba42]/10 text-white"
                          : "hover:bg-white/[0.04] text-[#d6c7b2]"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-sm shrink-0 bg-[#18130e]">
                          <img
                            src={track.art}
                            alt={track.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            {isTrackPlaying ? (
                              <Pause className="w-4 h-4 fill-white text-white" />
                            ) : (
                              <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                            )}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <p
                            className={`text-sm font-semibold truncate ${
                              isTrackPlaying ? "text-[#f5ba42]" : "text-white"
                            }`}
                          >
                            {track.title}
                          </p>
                          <p className="text-xs text-[#8c7b68] truncate">
                            {track.artist} • {track.album}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToQueue({
                              id: track.id,
                              title: track.title,
                              artist: track.artist,
                              album: track.album,
                              duration: track.durationMs ? formatTime(track.durationMs / 1000) : "3:30",
                              art: track.art,
                              audio: track.audio,
                              accent: track.accent || "#f5ba42",
                              badge: "SEARCH",
                              storeUrl: track.storeUrl,
                              durationMs: track.durationMs,
                              source: track.source,
                            });
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-white/10 transition text-[#8c7b68] hover:text-white"
                          title="Add to queue"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-mono text-[#8c7b68]">
                          {track.durationMs ? formatTime(track.durationMs / 1000) : "3:30"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Artists Section */}
          {(category === "all" || category === "artists") && artists.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8c7b68]">
                Artists
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {artists.slice(0, category === "all" ? 6 : 24).map((artist) => (
                  <div
                    key={artist.id}
                    onClick={() => onSelectArtist(artist.id)}
                    className="group cursor-pointer p-4 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#f5ba42]/30 transition text-center space-y-3 flex flex-col items-center"
                  >
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden shadow-lg border-2 border-white/10 group-hover:border-[#f5ba42] transition duration-300">
                      <img
                        src={
                          artist.images?.[0]?.url ||
                          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80"
                        }
                        alt={artist.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-[#f5ba42] transition">
                        {artist.name}
                      </h3>
                      <p className="text-[11px] text-[#8c7b68]">
                        Artist
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Albums Section */}
          {(category === "all" || category === "albums") && albums.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8c7b68]">
                Albums
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {albums.slice(0, category === "all" ? 6 : 24).map((album) => (
                  <div
                    key={album.id}
                    onClick={() => onSelectAlbum(album.id)}
                    className="group cursor-pointer p-3.5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#f5ba42]/30 transition flex flex-col space-y-2.5"
                  >
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#18130e] shadow-md">
                      <img
                        src={
                          album.images?.[0]?.url ||
                          "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80"
                        }
                        alt={album.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <div className="p-3 rounded-full bg-[#f5ba42] text-black shadow-lg">
                          <Disc3 className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-[#f5ba42] transition">
                        {album.name}
                      </h4>
                      <p className="text-xs text-[#8c7b68] line-clamp-1">
                        {album.artists?.[0]?.name || "Album"} • {album.releaseDate ? album.releaseDate.slice(0, 4) : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Podcasts Section */}
          {(category === "all" || category === "shows") && shows.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8c7b68]">
                Podcasts & Shows
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {shows.slice(0, category === "all" ? 6 : 24).map((show) => (
                  <div
                    key={show.id}
                    onClick={() => onSelectShow(show.id)}
                    className="group cursor-pointer p-3.5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#f5ba42]/30 transition flex flex-col space-y-2.5"
                  >
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#18130e] shadow-md">
                      <img
                        src={show.images?.[0]?.url}
                        alt={show.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <div className="p-3 rounded-full bg-[#f5ba42] text-black shadow-lg">
                          <Mic className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-[#f5ba42] transition">
                        {show.name}
                      </h4>
                      <p className="text-xs text-[#8c7b68] line-clamp-1">
                        {show.publisher}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No results message */}
          {tracks.length === 0 &&
            artists.length === 0 &&
            albums.length === 0 &&
            shows.length === 0 && (
              <div className="py-20 text-center text-[#8c7b68] space-y-2">
                <p className="text-base font-semibold text-white">No results found for "{debouncedQuery}"</p>
                <p className="text-xs">
                  Please make sure words are spelled correctly or try searching with different keywords.
                </p>
              </div>
            )}
        </div>
      )}

      {/* Default Discovery State when query is empty */}
      {!debouncedQuery && (
        <div className="py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#f5ba42]/10 border border-[#f5ba42]/20 text-[#f5ba42] flex items-center justify-center mx-auto">
            <Search className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-bold text-lg text-white">Discover anything on Musivo</h3>
            <p className="text-xs text-[#8c7b68] leading-relaxed">
              Search millions of songs, albums, verified artists, and video podcast series across the Spotify catalog.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
