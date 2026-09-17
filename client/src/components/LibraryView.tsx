import React, { useState } from "react";
import {
  Library,
  Heart,
  ListMusic,
  Mic,
  Plus,
  Play,
  Pause,
  Disc3,
  Clock,
  Sparkles,
  Radio,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { usePlayback, type PlaybackTrack } from "@/contexts/PlaybackContext";
import { formatTime } from "@/lib/musivo";
import { toast } from "sonner";

interface LibraryViewProps {
  onSelectShow: (showId: string) => void;
  onSelectPlaylist?: (playlistId: number | string) => void;
  onCreatePlaylist?: () => void;
}

type LibraryTab = "playlists" | "liked" | "podcasts";

export function LibraryView({
  onSelectShow,
  onSelectPlaylist,
  onCreatePlaylist,
}: LibraryViewProps) {
  const [activeTab, setActiveTab] = useState<LibraryTab>("playlists");
  const { playTrack, currentTrack, isPlaying, togglePlay, isSpotifyConnected } = usePlayback();

  const userPlaylistsQuery = trpc.playlists.list.useQuery();
  const spotifyPlaylistsQuery = trpc.spotify.playlists.useQuery(undefined, {
    enabled: isSpotifyConnected,
  });
  const likedTracksQuery = trpc.likes.list.useQuery();
  const savedShowsQuery = trpc.spotify.savedShows.useQuery(undefined, {
    enabled: isSpotifyConnected,
  });

  const likedTracks = likedTracksQuery.data || [];
  const localPlaylists = userPlaylistsQuery.data || [];
  const spotifyPlaylists = spotifyPlaylistsQuery.data || [];
  const savedShows = savedShowsQuery.data?.items || [];

  const handlePlayLikedSongs = async () => {
    if (likedTracks.length === 0) return;
    const formatted: PlaybackTrack[] = likedTracks.map((t) => ({
      id: t.externalId,
      title: t.title,
      artist: t.artist,
      album: t.album || "Liked Songs",
      duration: t.durationMs ? formatTime(t.durationMs / 1000) : "3:30",
      art: t.artworkUrl || "",
      audio: t.previewUrl || "",
      accent: "#f5ba42",
      badge: "LIKED",
      storeUrl: t.storeUrl || undefined,
      durationMs: t.durationMs,
      source: "Spotify",
    }));
    await playTrack(formatted[0], formatted);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header with Title & Action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Your Library
          </h1>
          <p className="text-xs sm:text-sm text-[#8c7b68]">
            Playlists, favorites, and saved podcast series
          </p>
        </div>

        {onCreatePlaylist && (
          <button
            onClick={onCreatePlaylist}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f5ba42] text-black font-semibold text-xs sm:text-sm hover:bg-[#ffc857] transition shadow-md shadow-[#f5ba42]/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Playlist</span>
          </button>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        <button
          onClick={() => setActiveTab("playlists")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "playlists"
              ? "bg-[#f5ba42] text-black"
              : "text-[#b2a28f] hover:text-white hover:bg-white/5"
          }`}
        >
          <ListMusic className="w-4 h-4" />
          <span>Playlists ({localPlaylists.length + spotifyPlaylists.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("liked")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "liked"
              ? "bg-[#f5ba42] text-black"
              : "text-[#b2a28f] hover:text-white hover:bg-white/5"
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Liked Songs ({likedTracks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("podcasts")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "podcasts"
              ? "bg-[#f5ba42] text-black"
              : "text-[#b2a28f] hover:text-white hover:bg-white/5"
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>Podcasts ({savedShows.length})</span>
        </button>
      </div>

      {/* Tab: Playlists */}
      {activeTab === "playlists" && (
        <div className="space-y-6">
          {/* Liked Songs Special Card */}
          {likedTracks.length > 0 && (
            <div
              onClick={handlePlayLikedSongs}
              className="group cursor-pointer rounded-3xl p-6 bg-gradient-to-br from-[#f5ba42]/20 via-[#1a140d] to-[#0d0a07] border border-[#f5ba42]/30 hover:border-[#f5ba42]/60 transition flex items-center justify-between shadow-xl"
            >
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f5ba42] to-[#b3831b] flex items-center justify-center text-black shadow-lg">
                  <Heart className="w-8 h-8 fill-black" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white group-hover:text-[#f5ba42] transition">
                    Liked Songs
                  </h3>
                  <p className="text-xs text-[#b2a28f]">
                    {likedTracks.length} favorite songs
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-full bg-[#f5ba42] text-black shadow-lg transform group-hover:scale-110 transition">
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </div>
            </div>
          )}

          {/* User Playlists Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {localPlaylists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => onSelectPlaylist?.(pl.id)}
                className="group cursor-pointer p-3.5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#f5ba42]/30 transition flex flex-col space-y-2.5"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#18130e] flex items-center justify-center shadow-md">
                  <ListMusic className="w-10 h-10 text-[#f5ba42]" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <div className="p-3 rounded-full bg-[#f5ba42] text-black shadow-lg">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-[#f5ba42] transition">
                    {pl.name}
                  </h4>
                  <p className="text-xs text-[#8c7b68]">Custom Playlist</p>
                </div>
              </div>
            ))}

            {spotifyPlaylists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => onSelectPlaylist?.(pl.externalId || pl.id)}
                className="group cursor-pointer p-3.5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#f5ba42]/30 transition flex flex-col space-y-2.5"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#18130e] shadow-md">
                  <img
                    src={
                      pl.imageUrl ||
                      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80"
                    }
                    alt={pl.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <div className="p-3 rounded-full bg-[#f5ba42] text-black shadow-lg">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-[#f5ba42] transition">
                    {pl.name}
                  </h4>
                  <p className="text-xs text-[#8c7b68] line-clamp-1">
                    Spotify • {pl.trackCount ?? 0} tracks
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Liked Songs */}
      {activeTab === "liked" && (
        <div className="space-y-4">
          {likedTracks.length > 0 ? (
            <div className="space-y-1">
              {likedTracks.map((track, idx) => {
                const isCurrent =
                  isPlaying && String(currentTrack.id) === String(track.externalId);

                return (
                  <div
                    key={track.id}
                    onClick={() => {
                      const formatted: PlaybackTrack = {
                        id: track.externalId,
                        title: track.title,
                        artist: track.artist,
                        album: track.album || "Liked Songs",
                        duration: track.durationMs ? formatTime(track.durationMs / 1000) : "3:30",
                        art: track.artworkUrl || "",
                        audio: track.previewUrl || "",
                        accent: "#f5ba42",
                        badge: "LIKED",
                        storeUrl: track.storeUrl || undefined,
                        durationMs: track.durationMs,
                        source: "Spotify",
                      };
                      void playTrack(formatted);
                    }}
                    className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition ${
                      isCurrent
                        ? "bg-[#f5ba42]/10 text-white"
                        : "hover:bg-white/[0.04] text-[#d6c7b2]"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="w-4 text-center text-xs font-mono text-[#8c7b68]">
                        {idx + 1}
                      </span>
                      {track.artworkUrl && (
                        <img
                          src={track.artworkUrl}
                          alt={track.title}
                          className="w-11 h-11 rounded-xl object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-semibold truncate ${
                            isCurrent ? "text-[#f5ba42]" : "text-white"
                          }`}
                        >
                          {track.title}
                        </p>
                        <p className="text-xs text-[#8c7b68] truncate">
                          {track.artist}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-mono text-[#8c7b68]">
                      {track.durationMs ? formatTime(track.durationMs / 1000) : "3:30"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center text-[#8c7b68] space-y-2">
              <Heart className="w-8 h-8 mx-auto text-[#f5ba42]" />
              <p className="font-semibold text-white">No liked songs yet</p>
              <p className="text-xs">Tap the heart icon on any song to save it here.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Podcasts */}
      {activeTab === "podcasts" && (
        <div className="space-y-4">
          {savedShows.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {savedShows.map((show) => (
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
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <div className="p-3 rounded-full bg-[#f5ba42] text-black shadow-lg">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
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
          ) : (
            <div className="py-20 text-center text-[#8c7b68] space-y-2">
              <Mic className="w-8 h-8 mx-auto text-[#f5ba42]" />
              <p className="font-semibold text-white">No followed podcasts yet</p>
              <p className="text-xs">Follow podcasts to easily find their newest episodes here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
