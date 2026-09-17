import React from "react";
import {
  X,
  Play,
  Pause,
  CheckCircle2,
  Users,
  Disc3,
  Clock,
  ExternalLink,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { usePlayback, type PlaybackTrack } from "@/contexts/PlaybackContext";
import { formatTime } from "@/lib/musivo";

interface ArtistDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  artistId: string | null;
  onSelectAlbum: (albumId: string) => void;
}

export function ArtistDetailModal({
  isOpen,
  onClose,
  artistId,
  onSelectAlbum,
}: ArtistDetailModalProps) {
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayback();

  const artistQuery = trpc.music.getArtistDetails.useQuery(
    { artistId: artistId || "" },
    { enabled: Boolean(isOpen && artistId) }
  );

  if (!isOpen || !artistId) return null;

  const data = artistQuery.data;
  const artist = data?.artist;
  const topTracks = data?.topTracks || [];
  const albums = data?.albums || [];

  const handlePlayTopTracks = async () => {
    if (topTracks.length === 0) return;
    const formatted: PlaybackTrack[] = topTracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: t.album,
      duration: t.durationMs ? formatTime(t.durationMs / 1000) : "3:30",
      art: t.art,
      audio: t.audio,
      accent: t.accent || "#f5ba42",
      badge: "TOP TRACK",
      storeUrl: t.storeUrl,
      durationMs: t.durationMs,
      source: t.source,
    }));
    await playTrack(formatted[0], formatted);
  };

  const handlePlaySingleTrack = async (track: (typeof topTracks)[0]) => {
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
      badge: "ARTIST",
      storeUrl: track.storeUrl,
      durationMs: track.durationMs,
      source: track.source,
    };
    const queueFormatted: PlaybackTrack[] = topTracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: t.album,
      duration: t.durationMs ? formatTime(t.durationMs / 1000) : "3:30",
      art: t.art,
      audio: t.audio,
      accent: t.accent || "#f5ba42",
      badge: "ARTIST",
      storeUrl: t.storeUrl,
      durationMs: t.durationMs,
      source: t.source,
    }));
    await playTrack(formatted, queueFormatted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-white/10 bg-[#0f0c09] shadow-2xl backdrop-blur-2xl text-[#faf5ee] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 text-[#8c7b68] hover:text-white hover:bg-black/70 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto">
          {artistQuery.isLoading ? (
            <div className="py-32 text-center space-y-3">
              <div className="w-10 h-10 border-2 border-[#f5ba42] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-[#8c7b68]">Loading artist details...</p>
            </div>
          ) : artist ? (
            <>
              {/* Hero Banner with Artist Image */}
              <div className="relative h-64 sm:h-80 w-full overflow-hidden flex items-end p-6 sm:p-8 bg-[#18130e]">
                <img
                  src={
                    artist.images?.[0]?.url ||
                    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80"
                  }
                  alt={artist.name}
                  className="absolute inset-0 w-full h-full object-cover object-center filter brightness-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0c09] via-[#0f0c09]/40 to-transparent" />

                <div className="relative z-10 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#f5ba42]">
                    <CheckCircle2 className="w-4 h-4 fill-[#f5ba42] text-black" />
                    <span className="uppercase tracking-wider">Verified Artist</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                    {artist.name}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#b2a28f] pt-1">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {(artist.followers || 0).toLocaleString()} followers
                    </span>
                    {artist.genres?.length > 0 && (
                      <span className="capitalize">
                        • {artist.genres.slice(0, 3).join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-6 sm:px-8 py-4 flex items-center justify-between border-b border-white/5 bg-[#0f0c09]/90">
                <button
                  onClick={handlePlayTopTracks}
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#f5ba42] text-black font-bold text-sm hover:bg-[#ffc857] transition shadow-lg shadow-[#f5ba42]/20 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play Top Tracks</span>
                </button>

                {artist.externalUrls?.spotify && (
                  <a
                    href={artist.externalUrls.spotify}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-full text-[#8c7b68] hover:text-white hover:bg-white/10 transition"
                    title="Open on Spotify"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              <div className="p-6 sm:p-8 space-y-8">
                {/* Popular Tracks Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8c7b68]">
                    Popular Tracks
                  </h3>

                  <div className="space-y-1.5">
                    {topTracks.slice(0, 5).map((track, index) => {
                      const isTrackPlaying =
                        isPlaying && String(currentTrack.id) === String(track.id);

                      return (
                        <div
                          key={track.id}
                          onClick={() => handlePlaySingleTrack(track)}
                          className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition ${
                            isTrackPlaying
                              ? "bg-[#f5ba42]/10 text-white"
                              : "hover:bg-white/[0.05] text-[#d6c7b2]"
                          }`}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <span className="w-4 text-center text-xs font-mono text-[#8c7b68] group-hover:hidden">
                              {index + 1}
                            </span>
                            <div className="hidden group-hover:block w-4 text-center text-white">
                              {isTrackPlaying ? (
                                <Pause className="w-3.5 h-3.5 fill-current mx-auto" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-current mx-auto" />
                              )}
                            </div>

                            <img
                              src={track.art}
                              alt={track.title}
                              className="w-10 h-10 rounded-xl object-cover shadow-sm shrink-0"
                            />

                            <div className="min-w-0">
                              <p
                                className={`text-sm font-semibold truncate ${
                                  isTrackPlaying ? "text-[#f5ba42]" : "text-white"
                                }`}
                              >
                                {track.title}
                              </p>
                              <p className="text-xs text-[#8c7b68] truncate">
                                {track.album}
                              </p>
                            </div>
                          </div>

                          <span className="text-xs font-mono text-[#8c7b68] shrink-0">
                            {track.durationMs
                              ? formatTime(track.durationMs / 1000)
                              : "3:30"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Discography Section */}
                {albums.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8c7b68]">
                      Discography & Releases
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {albums.map((album) => (
                        <div
                          key={album.id}
                          onClick={() => {
                            onSelectAlbum(album.id);
                          }}
                          className="group cursor-pointer rounded-2xl p-3 border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#f5ba42]/30 transition flex flex-col space-y-2.5"
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
                            <p className="text-xs text-[#8c7b68]">
                              {album.releaseDate ? album.releaseDate.slice(0, 4) : "Album"}{" "}
                              • {album.totalTracks} tracks
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-32 text-center text-[#8c7b68] text-sm">
              Artist details could not be found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
