import React from "react";
import {
  X,
  Play,
  Pause,
  Plus,
  Clock,
  ExternalLink,
  Disc,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { usePlayback, type PlaybackTrack } from "@/contexts/PlaybackContext";
import { formatTime } from "@/lib/musivo";
import { toast } from "sonner";

interface AlbumDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  albumId: string | null;
  onSelectArtist?: (artistId: string) => void;
}

export function AlbumDetailModal({
  isOpen,
  onClose,
  albumId,
  onSelectArtist,
}: AlbumDetailModalProps) {
  const { playTrack, currentTrack, isPlaying, togglePlay, addToQueue } = usePlayback();

  const albumQuery = trpc.music.getAlbumDetails.useQuery(
    { albumId: albumId || "" },
    { enabled: Boolean(isOpen && albumId) }
  );

  if (!isOpen || !albumId) return null;

  const album = albumQuery.data;
  const tracks = album?.tracks || [];

  const totalDurationSec = tracks.reduce((acc, t) => acc + (t.durationMs ? t.durationMs / 1000 : 0), 0);

  const handlePlayAlbum = async () => {
    if (tracks.length === 0) return;
    const formatted: PlaybackTrack[] = tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: album?.name || t.album,
      duration: t.durationMs ? formatTime(t.durationMs / 1000) : "3:30",
      art: album?.images?.[0]?.url || t.art,
      audio: t.audio,
      accent: t.accent || "#f5ba42",
      badge: "ALBUM",
      storeUrl: t.storeUrl,
      durationMs: t.durationMs,
      source: t.source,
    }));
    await playTrack(formatted[0], formatted);
  };

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
      album: album?.name || track.album,
      duration: track.durationMs ? formatTime(track.durationMs / 1000) : "3:30",
      art: album?.images?.[0]?.url || track.art,
      audio: track.audio,
      accent: track.accent || "#f5ba42",
      badge: "ALBUM",
      storeUrl: track.storeUrl,
      durationMs: track.durationMs,
      source: track.source,
    };
    const queueFormatted: PlaybackTrack[] = tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: album?.name || t.album,
      duration: t.durationMs ? formatTime(t.durationMs / 1000) : "3:30",
      art: album?.images?.[0]?.url || t.art,
      audio: t.audio,
      accent: t.accent || "#f5ba42",
      badge: "ALBUM",
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
        {/* Top Header Controls */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#0f0c09]/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#f5ba42]/10 text-[#f5ba42] border border-[#f5ba42]/20 font-semibold">
              Album
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8c7b68] hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          {albumQuery.isLoading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-10 h-10 border-2 border-[#f5ba42] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-[#8c7b68]">Loading album tracks...</p>
            </div>
          ) : album ? (
            <>
              {/* Album Hero Header */}
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <img
                  src={
                    album.images?.[0]?.url ||
                    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=500&q=80"
                  }
                  alt={album.name}
                  className="w-32 h-32 sm:w-44 sm:h-44 rounded-2xl object-cover shadow-2xl border border-white/10 shrink-0"
                />

                <div className="space-y-2 flex-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {album.name}
                  </h1>

                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {album.artists.map((artist, idx) => (
                      <span
                        key={artist.id}
                        onClick={() => {
                          if (onSelectArtist && artist.id) {
                            onSelectArtist(artist.id);
                          }
                        }}
                        className={`text-[#f5ba42] hover:underline cursor-pointer ${
                          idx > 0 ? "before:content-[',_'] before:text-[#8c7b68]" : ""
                        }`}
                      >
                        {artist.name}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-[#8c7b68]">
                    {album.releaseDate ? album.releaseDate.slice(0, 4) : "Release"} • {tracks.length} tracks •{" "}
                    {formatTime(totalDurationSec)}
                  </p>

                  <div className="pt-3 flex flex-wrap items-center gap-3">
                    <button
                      onClick={handlePlayAlbum}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#f5ba42] text-black font-semibold text-sm hover:bg-[#ffc857] transition shadow-lg shadow-[#f5ba42]/20 active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Play Album</span>
                    </button>

                    <button
                      onClick={() => {
                        tracks.forEach((t) => {
                          addToQueue({
                            id: t.id,
                            title: t.title,
                            artist: t.artist,
                            album: album.name,
                            duration: t.durationMs ? formatTime(t.durationMs / 1000) : "3:30",
                            art: album.images?.[0]?.url || t.art,
                            audio: t.audio,
                            accent: t.accent || "#f5ba42",
                            badge: "ALBUM",
                            storeUrl: t.storeUrl,
                            durationMs: t.durationMs,
                            source: t.source,
                          });
                        });
                        toast.success(`Added ${tracks.length} tracks to queue`);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/[0.06] text-white font-medium text-xs hover:bg-white/[0.12] transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add All to Queue</span>
                    </button>

                    {album.externalUrls?.spotify && (
                      <a
                        href={album.externalUrls.spotify}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-full text-[#8c7b68] hover:text-white hover:bg-white/10 transition"
                        title="Open on Spotify"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Tracklist Section */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between pb-2 border-b border-white/5 text-xs font-mono uppercase tracking-wider text-[#8c7b68]">
                  <div className="flex items-center gap-4">
                    <span className="w-6 text-center">#</span>
                    <span>Title</span>
                  </div>
                  <Clock className="w-3.5 h-3.5" />
                </div>

                <div className="space-y-1">
                  {tracks.map((track, idx) => {
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
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="w-6 text-center text-xs font-mono text-[#8c7b68] group-hover:hidden">
                            {idx + 1}
                          </span>
                          <div className="hidden group-hover:block w-6 text-center text-white">
                            {isTrackPlaying ? (
                              <Pause className="w-3.5 h-3.5 fill-current mx-auto" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current mx-auto" />
                            )}
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
                              {track.artist}
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
                                album: album.name,
                                duration: track.durationMs ? formatTime(track.durationMs / 1000) : "3:30",
                                art: album.images?.[0]?.url || track.art,
                                audio: track.audio,
                                accent: track.accent || "#f5ba42",
                                badge: "ALBUM",
                                storeUrl: track.storeUrl,
                                durationMs: track.durationMs,
                                source: track.source,
                              });
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-white/10 transition text-[#8c7b68] hover:text-white"
                            title="Add to queue"
                          >
                            <Plus className="w-3.5 h-3.5" />
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
            </>
          ) : (
            <div className="py-24 text-center text-[#8c7b68] text-sm">
              Album details could not be found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
