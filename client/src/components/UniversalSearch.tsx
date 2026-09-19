import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  Play,
  Pause,
  Clock,
  Music,
  Users,
  Disc3,
  ListMusic,
  Podcast,
  Plus,
  Heart,
  ChevronRight,
  Sparkles,
  ExternalLink,
  History,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { usePlayback, PlaybackTrack } from "@/contexts/PlaybackContext";
import { formatTime } from "@/lib/musivo";
import { ArtistDetailModal } from "./ArtistDetailModal";
import { AlbumDetailModal } from "./AlbumDetailModal";
import { PodcastDetailModal } from "./PodcastDetailModal";

const SEARCH_TABS = [
  { id: "all", label: "All", types: ["track", "artist", "album", "playlist", "show"] },
  { id: "tracks", label: "Songs", types: ["track"] },
  { id: "artists", label: "Artists", types: ["artist"] },
  { id: "albums", label: "Albums", types: ["album"] },
  { id: "playlists", label: "Playlists", types: ["playlist"] },
  { id: "shows", label: "Podcasts", types: ["show"] },
];

export function UniversalSearch() {
  const { currentTrack, isPlaying, playTrack, togglePlay, addToQueue } = usePlayback();
  const trpcUtils = trpc.useUtils();

  const [inputVal, setInputVal] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [offset, setOffset] = useState(0);

  // Selected modals
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);

  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputVal.trim());
      setOffset(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputVal]);

  // Click outside suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeCategory = SEARCH_TABS.find((t) => t.id === activeTab) || SEARCH_TABS[0];

  // Universal Search Query (strictly <= 10 items per type)
  const searchQuery = trpc.music.universalSearch.useQuery(
    {
      query: debouncedQuery || "top hits",
      types: activeCategory.types,
      limit: 10,
      offset,
    },
    {
      enabled: Boolean(debouncedQuery || activeTab !== "all"),
      staleTime: 30000,
    }
  );

  // Search Autocomplete Suggestions
  const suggestionsQuery = trpc.music.searchSuggestions.useQuery(
    { query: inputVal.trim() },
    {
      enabled: showSuggestions && inputVal.trim().length >= 2,
      staleTime: 15000,
    }
  );

  // Recent Searches
  const recentSearchesQuery = trpc.music.recentSearches.useQuery(undefined, {
    staleTime: 30000,
  });

  const removeSearchMutation = trpc.music.removeRecentSearch.useMutation({
    onSuccess: () => void trpcUtils.music.recentSearches.invalidate(),
  });

  const clearSearchesMutation = trpc.music.clearRecentSearches.useMutation({
    onSuccess: () => void trpcUtils.music.recentSearches.invalidate(),
  });

  const data = searchQuery.data;
  const tracks = data?.tracks || [];
  const artists = data?.artists || [];
  const albums = data?.albums || [];
  const playlists = data?.playlists || [];
  const shows = data?.shows || [];
  const topResult = data?.topResult;
  const recentSearches = recentSearchesQuery.data || [];
  const suggestions = suggestionsQuery.data || [];

  const toPlaybackTrack = (t: any): PlaybackTrack => ({
    id: t.id,
    title: t.title,
    artist: t.artist,
    album: t.album,
    duration: formatTime((t.durationMs || 180000) / 1000),
    durationMs: t.durationMs,
    art: t.art,
    audio: t.audio,
    accent: t.accent || "#10b981",
    source: "Spotify",
    storeUrl: t.storeUrl,
  });

  const handlePlaySingle = (t: any) => {
    void playTrack(toPlaybackTrack(t));
  };

  const handleSelectTopResult = () => {
    if (!topResult) return;
    if (topResult.type === "track") {
      handlePlaySingle(topResult.item);
    } else if (topResult.type === "artist") {
      setSelectedArtistId(topResult.item.id);
    } else if (topResult.type === "album") {
      setSelectedAlbumId(topResult.item.id);
    } else if (topResult.type === "show") {
      setSelectedShowId(topResult.item.id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Search Input Bar & Autocomplete */}
      <div ref={searchContainerRef} className="relative max-w-2xl">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-white/40 absolute left-4" />
          <input
            type="text"
            placeholder="Search songs, artists, albums, or podcasts..."
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="w-full pl-12 pr-12 py-3.5 rounded-full bg-white/[0.06] border border-white/10 text-white placeholder-white/40 text-sm md:text-base focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 shadow-lg transition-all"
          />
          {inputVal && (
            <button
              onClick={() => {
                setInputVal("");
                setDebouncedQuery("");
                setShowSuggestions(false);
              }}
              className="p-1.5 text-white/40 hover:text-white rounded-full absolute right-4 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Autocomplete Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-[#141416] border border-white/10 shadow-2xl overflow-hidden z-40 divide-y divide-white/5">
            {suggestions.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => {
                  setInputVal(item.title);
                  setDebouncedQuery(item.title);
                  setShowSuggestions(false);
                  if (item.type === "artist" && item.id) setSelectedArtistId(item.id);
                  else if (item.type === "album" && item.id) setSelectedAlbumId(item.id);
                  else if (item.type === "show" && item.id) setSelectedShowId(item.id);
                }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors"
              >
                {item.artworkUrl ? (
                  <img
                    src={item.artworkUrl}
                    alt=""
                    className={`w-9 h-9 object-cover border border-white/5 shrink-0 ${
                      item.type === "artist" ? "rounded-full" : "rounded-lg"
                    }`}
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-white/40 shrink-0">
                    <Search className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                  <p className="text-xs text-white/40 truncate capitalize">{item.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Searches Chips */}
      {recentSearches.length > 0 && !debouncedQuery && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-white/40 font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" /> Recent Searches
            </span>
            <button
              onClick={() => clearSearchesMutation.mutate()}
              className="hover:text-white transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((term) => (
              <div
                key={term}
                className="flex items-center gap-2 pl-3.5 pr-2 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs text-white/80 hover:bg-white/10 hover:text-white transition-colors group cursor-pointer"
                onClick={() => {
                  setInputVal(term);
                  setDebouncedQuery(term);
                }}
              >
                <span>{term}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSearchMutation.mutate({ query: term });
                  }}
                  className="p-1 text-white/30 hover:text-white rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {SEARCH_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setOffset(0);
              }}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-white text-black shadow-lg"
                  : "bg-white/5 border border-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Content */}
      {searchQuery.isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-white/40">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <span className="text-sm font-medium">Searching verified Spotify catalog...</span>
        </div>
      ) : debouncedQuery && !topResult && tracks.length === 0 && artists.length === 0 ? (
        <div className="py-16 text-center text-white/40 space-y-2">
          <p className="text-base font-semibold text-white/70">No results found for "{debouncedQuery}"</p>
          <p className="text-xs">Check spelling or try searching a different artist or genre.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Result Card & Featured Tracks Row */}
          {topResult && activeTab === "all" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Spotlight Top Result */}
              <div
                onClick={handleSelectTopResult}
                className="group p-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] hover:bg-white/[0.08] transition-all cursor-pointer space-y-4 relative shadow-xl"
              >
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400">
                  Top Result
                </span>

                <div className="flex items-center gap-4">
                  <img
                    src={
                      topResult.type === "track"
                        ? topResult.item.art
                        : topResult.item.images?.[0]?.url ||
                          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80"
                    }
                    alt=""
                    className={`w-24 h-24 object-cover shadow-2xl border border-white/10 ${
                      topResult.type === "artist" ? "rounded-full" : "rounded-2xl"
                    }`}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-xl font-extrabold text-white truncate group-hover:text-emerald-400 transition-colors">
                      {topResult.type === "track" ? topResult.item.title : topResult.item.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white uppercase">
                        {topResult.type}
                      </span>
                      <p className="text-xs text-white/60 truncate">
                        {topResult.type === "track"
                          ? topResult.item.artist
                          : topResult.type === "show"
                          ? topResult.item.publisher
                          : topResult.type === "album"
                          ? topResult.item.releaseDate?.slice(0, 4)
                          : `${topResult.item.followersCount?.toLocaleString() || 0} followers`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-white/40">Tap to explore</span>
                  <div className="p-3 rounded-full bg-emerald-500 text-black shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Side Popular Tracks */}
              <div className="lg:col-span-2 space-y-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Featured Songs
                </h3>
                <div className="space-y-1">
                  {tracks.slice(0, 4).map((t) => {
                    const isCurrent = String(currentTrack.id) === String(t.id);
                    const isCurrentPlaying = isCurrent && isPlaying;
                    return (
                      <div
                        key={t.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          isCurrent
                            ? "bg-emerald-500/10 border-emerald-500/30 text-white"
                            : "border-transparent hover:border-white/5 hover:bg-white/[0.03] text-white/80"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={t.art}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-white/5 shrink-0"
                          />
                          <div className="min-w-0">
                            <p
                              className={`text-sm font-semibold truncate ${
                                isCurrent ? "text-emerald-400" : "text-white"
                              }`}
                            >
                              {t.title}
                            </p>
                            <p className="text-xs text-white/50 truncate">{t.artist}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-white/40 font-mono hidden sm:inline">
                            {formatTime((t.durationMs || 180000) / 1000)}
                          </span>
                          <button
                            onClick={() => addToQueue(toPlaybackTrack(t))}
                            className="p-2 text-white/40 hover:text-white rounded-full"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => (isCurrent ? togglePlay() : handlePlaySingle(t))}
                            className={`p-2.5 rounded-full transition-colors ${
                              isCurrentPlaying
                                ? "bg-emerald-500 text-black"
                                : "bg-white/10 hover:bg-white/20 text-white"
                            }`}
                          >
                            {isCurrentPlaying ? (
                              <Pause className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tracks Section */}
          {(activeTab === "all" || activeTab === "tracks") && tracks.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Music className="w-4 h-4 text-emerald-400" />
                <span>Songs</span>
              </h3>
              <div className="space-y-1">
                {tracks.map((t, idx) => {
                  const isCurrent = String(currentTrack.id) === String(t.id);
                  const isCurrentPlaying = isCurrent && isPlaying;
                  return (
                    <div
                      key={t.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isCurrent
                          ? "bg-emerald-500/10 border-emerald-500/30 text-white"
                          : "border-transparent hover:border-white/5 hover:bg-white/[0.03] text-white/80"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="w-6 text-center text-xs font-semibold text-white/40">
                          {offset + idx + 1}
                        </span>
                        <img
                          src={t.art}
                          alt=""
                          className="w-11 h-11 rounded-lg object-cover border border-white/5 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-semibold truncate ${
                              isCurrent ? "text-emerald-400" : "text-white"
                            }`}
                          >
                            {t.title}
                          </p>
                          <p className="text-xs text-white/50 truncate">
                            {t.artist} • {t.album}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-white/40 font-mono hidden sm:inline">
                          {formatTime((t.durationMs || 180000) / 1000)}
                        </span>
                        <button
                          onClick={() => addToQueue(toPlaybackTrack(t))}
                          className="p-2 text-white/40 hover:text-white rounded-full transition-colors"
                          title="Add to queue"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => (isCurrent ? togglePlay() : handlePlaySingle(t))}
                          className={`p-2.5 rounded-full transition-colors ${
                            isCurrentPlaying
                              ? "bg-emerald-500 text-black"
                              : "bg-white/10 hover:bg-white/20 text-white"
                          }`}
                        >
                          {isCurrentPlaying ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Artists Section */}
          {(activeTab === "all" || activeTab === "artists") && artists.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Artists</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {artists.map((artist) => (
                  <div
                    key={artist.id}
                    onClick={() => setSelectedArtistId(artist.id)}
                    className="group p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 transition-all cursor-pointer text-center space-y-3"
                  >
                    <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full overflow-hidden border border-white/10 shadow-lg">
                      <img
                        src={
                          artist.images?.[0]?.url ||
                          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80"
                        }
                        alt={artist.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                        {artist.name}
                      </h4>
                      <p className="text-xs text-white/40">Artist</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Albums Section */}
          {(activeTab === "all" || activeTab === "albums") && albums.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Disc3 className="w-4 h-4 text-amber-400" />
                <span>Albums</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {albums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => setSelectedAlbumId(album.id)}
                    className="group p-3.5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 transition-all cursor-pointer space-y-2.5"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden border border-white/10 shadow-md">
                      <img
                        src={album.images?.[0]?.url}
                        alt={album.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                        {album.name}
                      </h4>
                      <p className="text-[11px] text-white/50 truncate">
                        {album.releaseDate?.slice(0, 4)} • {album.artists?.map((a) => a.name).join(", ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Playlists Section */}
          {(activeTab === "all" || activeTab === "playlists") && playlists.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-purple-400" />
                <span>Playlists</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className="group p-3.5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 transition-all cursor-pointer space-y-2.5"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden border border-white/10 shadow-md">
                      <img
                        src={playlist.images?.[0]?.url}
                        alt={playlist.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-purple-400 transition-colors">
                        {playlist.name}
                      </h4>
                      <p className="text-[11px] text-white/50 truncate">By {playlist.ownerName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Podcasts Section */}
          {(activeTab === "all" || activeTab === "shows") && shows.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Podcast className="w-4 h-4 text-purple-400" />
                <span>Podcasts & Shows</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {shows.map((show) => (
                  <div
                    key={show.id}
                    onClick={() => setSelectedShowId(show.id)}
                    className="group p-3.5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 transition-all cursor-pointer space-y-2.5"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden border border-white/10 shadow-md">
                      <img
                        src={show.images?.[0]?.url}
                        alt={show.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-purple-400 transition-colors">
                        {show.name}
                      </h4>
                      <p className="text-[11px] text-white/50 truncate">{show.publisher}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination: Next 10 offset */}
          {activeTab !== "all" && Boolean((data?.pagination?.hasMore as Record<string, boolean> | undefined)?.[activeTab]) && (
            <div className="pt-4 flex justify-center">
              <button
                onClick={() => setOffset((prev) => prev + 10)}
                className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors"
              >
                Load next 10 items
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ArtistDetailModal
        artistId={selectedArtistId}
        isOpen={Boolean(selectedArtistId)}
        onClose={() => setSelectedArtistId(null)}
        onSelectAlbum={(albId) => {
          setSelectedArtistId(null);
          setSelectedAlbumId(albId);
        }}
      />

      <AlbumDetailModal
        albumId={selectedAlbumId}
        isOpen={Boolean(selectedAlbumId)}
        onClose={() => setSelectedAlbumId(null)}
      />

      <PodcastDetailModal
        showId={selectedShowId}
        isOpen={Boolean(selectedShowId)}
        onClose={() => setSelectedShowId(null)}
      />
    </div>
  );
}
