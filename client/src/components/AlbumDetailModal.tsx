import React from "react";
import {
  X,
  Play,
  Pause,
  Clock,
  Disc3,
  Calendar,
  ExternalLink,
  Loader2,
  Plus,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { usePlayback, PlaybackTrack } from "@/contexts/PlaybackContext";
import { formatTime } from "@/lib/musivo";

interface AlbumDetailModalProps {
  albumId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AlbumDetailModal({ albumId, isOpen, onClose }: AlbumDetailModalProps) {
  const { currentTrack, isPlaying, playTrack, togglePlay, addToQueue } = usePlayback();

  const albumQuery = trpc.music.getAlbumDetails.useQuery(
    { albumId: albumId || "" },
    { enabled: isOpen && Boolean(albumId) }
  );

  if (!isOpen || !albumId) return null;

  const album = albumQuery.data;
  const tracks = album?.tracks || [];

  const handlePlayAlbum = () => {
    if (tracks.length === 0) return;
    const playbackTracks: PlaybackTrack[] = tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: album?.name || t.album,
      duration: formatTime((t.durationMs || 180000) / 1000),
      durationMs: t.durationMs,
      art: t.art || album?.images?.[0]?.url || "",
      audio: t.audio,
      accent: "#ffffff",
      source: "Spotify",
      storeUrl: t.storeUrl,
    }));
    void playTrack(playbackTracks[0], playbackTracks);
  };

  const handlePlaySingle = (t: any) => {
    const track: PlaybackTrack = {
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: album?.name || t.album,
      duration: formatTime((t.durationMs || 180000) / 1000),
      durationMs: t.durationMs,
      art: t.art || album?.images?.[0]?.url || "",
      audio: t.audio,
      accent: "#ffffff",
      source: "Spotify",
      storeUrl: t.storeUrl,
    };
    void playTrack(track);
  };

  const totalDurationMinutes = Math.round(
    tracks.reduce((acc, t) => acc + (t.durationMs || 0), 0) / 60000
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#121214] border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-white/10 bg-[#f8f8f8] dark:bg-[#17171a] shrink-0">
          <div className="text-xs font-semibold text-black dark:text-white tracking-wide uppercase">
            <span>Album Details</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#777777] dark:text-white/50 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {albumQuery.isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-[#777777] dark:text-white/40">
              <Loader2 className="w-8 h-8 animate-spin text-black dark:text-white" />
              <span>Loading album tracks...</span>
            </div>
          ) : !album ? (
            <div className="py-20 text-center text-[#777777] dark:text-white/40">
              <p>Unable to load album details.</p>
            </div>
          ) : (
            <>
              {/* Album Hero Card */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <img
                  src={
                    album.images?.[0]?.url ||
                    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=500&q=80"
                  }
                  alt={album.name}
                  className="w-36 h-36 sm:w-44 sm:h-44 rounded-xl object-cover shadow-xl border border-black/10 dark:border-white/10 shrink-0"
                />

                <div className="flex-1 text-center sm:text-left space-y-3">
                  <div>
                    <span className="text-[11px] font-bold text-[#666666] dark:text-[#a0a0a0] uppercase tracking-widest">
                      {album.albumType}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111111] dark:text-white tracking-tight leading-snug">
                      {album.name}
                    </h2>
                    <p className="text-sm font-semibold text-[#444444] dark:text-white/80 mt-1">
                      {album.artists.map((a) => a.name).join(", ")}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-[#777777] dark:text-white/50">
                    {album.releaseDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {album.releaseDate.slice(0, 4)}
                      </span>
                    )}
                    <span>• {album.totalTracks} songs</span>
                    {totalDurationMinutes > 0 && <span>• {totalDurationMinutes} min</span>}
                  </div>

                  <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
                    <button
                      onClick={handlePlayAlbum}
                      className="px-5 py-2.5 rounded-full bg-black dark:bg-white hover:bg-black/90 dark:hover:bg-white/90 text-white dark:text-black font-bold text-xs flex items-center gap-2 transition-transform hover:scale-105 shadow-md"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                      <span>Play Album</span>
                    </button>

                    {album.externalUrls?.spotify && (
                      <a
                        href={album.externalUrls.spotify}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-full border border-black/10 dark:border-white/10 text-[#777777] dark:text-white/50 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        title="Open on Spotify"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Track List */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#777777] dark:text-white/40 px-3 pb-2 border-b border-black/5 dark:border-white/5 uppercase tracking-wider">
                  <span className="w-8">#</span>
                  <span className="flex-1">Title</span>
                  <span className="flex items-center gap-1 mr-8">
                    <Clock className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div className="space-y-1">
                  {tracks.map((track, idx) => {
                    const isCurrent = String(currentTrack.id) === String(track.id);
                    const isCurrentPlaying = isCurrent && isPlaying;

                    return (
                      <div
                        key={track.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isCurrent
                            ? "bg-black/5 dark:bg-white/10 border-black/20 dark:border-white/20 text-[#111111] dark:text-white"
                            : "border-transparent hover:border-black/5 dark:hover:border-white/5 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] text-[#333333] dark:text-white/80"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="w-6 text-center text-xs font-semibold text-[#777777] dark:text-white/40">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm font-semibold truncate ${
                                isCurrent ? "text-black dark:text-white font-bold" : "text-[#111111] dark:text-white"
                              }`}
                            >
                              {track.title}
                            </p>
                            <p className="text-xs text-[#666666] dark:text-white/50 truncate">{track.artist}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-[#777777] dark:text-white/40 font-mono">
                            {formatTime((track.durationMs || 180000) / 1000)}
                          </span>
                          <button
                            onClick={() =>
                              addToQueue({
                                id: track.id,
                                title: track.title,
                                artist: track.artist,
                                album: album.name,
                                duration: formatTime((track.durationMs || 180000) / 1000),
                                durationMs: track.durationMs,
                                art: album.images?.[0]?.url || track.art,
                                audio: track.audio,
                                accent: "#ffffff",
                                source: "Spotify",
                              })
                            }
                            className="p-2 text-[#777777] dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                            title="Add to queue"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              isCurrent ? togglePlay() : handlePlaySingle(track)
                            }
                            className={`p-2.5 rounded-full transition-colors ${
                              isCurrentPlaying
                                ? "bg-black dark:bg-white text-white dark:text-black"
                                : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[#111111] dark:text-white"
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
