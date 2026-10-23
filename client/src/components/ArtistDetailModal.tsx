import React from "react";
import {
  X,
  Play,
  Pause,
  Clock,
  Disc3,
  Users,
  ExternalLink,
  Loader2,
  Heart,
  Plus,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { usePlayback, PlaybackTrack } from "@/contexts/PlaybackContext";
import { formatTime } from "@/lib/musivo";
import { toast } from "sonner";

interface ArtistDetailModalProps {
  artistId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectAlbum?: (albumId: string) => void;
}

export function ArtistDetailModal({
  artistId,
  isOpen,
  onClose,
  onSelectAlbum,
}: ArtistDetailModalProps) {
  const { currentTrack, isPlaying, playTrack, togglePlay, addToQueue } = usePlayback();

  const artistQuery = trpc.music.getArtistDetails.useQuery(
    { artistId: artistId || "" },
    { enabled: isOpen && Boolean(artistId) }
  );

  if (!isOpen || !artistId) return null;

  const data = artistQuery.data;
  const artist = data?.artist;
  const topTracks = data?.topTracks || [];
  const albums = data?.albums || [];

  const handlePlayAll = () => {
    if (topTracks.length === 0) return;
    const tracks: PlaybackTrack[] = topTracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: t.album,
      duration: formatTime((t.durationMs || 180000) / 1000),
      durationMs: t.durationMs,
      art: t.art,
      audio: t.audio,
      accent: t.accent || "#ffffff",
      source: "Spotify",
      storeUrl: t.storeUrl,
    }));
    void playTrack(tracks[0], tracks);
  };

  const handlePlaySingle = (t: any) => {
    const track: PlaybackTrack = {
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: t.album,
      duration: formatTime((t.durationMs || 180000) / 1000),
      durationMs: t.durationMs,
      art: t.art,
      audio: t.audio,
      accent: t.accent || "#ffffff",
      source: "Spotify",
      storeUrl: t.storeUrl,
    };
    void playTrack(track);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#121214] border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden text-[#111111] dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-white/10 bg-[#f8f8f8] dark:bg-[#17171a] shrink-0">
          <div className="text-xs font-semibold text-black dark:text-white tracking-wide uppercase">
            <span>Artist Profile</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#777777] dark:text-white/50 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-8">
          {artistQuery.isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-[#777777] dark:text-white/40">
              <Loader2 className="w-8 h-8 animate-spin text-black dark:text-white" />
              <span>Loading artist discography...</span>
            </div>
          ) : !artist ? (
            <div className="py-20 text-center text-[#777777] dark:text-white/40">
              <p>Unable to load artist information.</p>
            </div>
          ) : (
            <>
              {/* Artist Banner */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <img
                  src={
                    artist.images?.[0]?.url ||
                    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80"
                  }
                  alt={artist.name}
                  className="w-36 h-36 sm:w-44 sm:h-44 rounded-full object-cover shadow-xl border-2 border-black/10 dark:border-white/10 shrink-0"
                />

                <div className="flex-1 text-center sm:text-left space-y-3">
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-[#111111] dark:text-white tracking-tight">
                    {artist.name}
                  </h2>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-[#666666] dark:text-white/60">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-black dark:text-white" />
                      {artist.followersCount.toLocaleString()} followers
                    </span>
                    {artist.popularity !== undefined && (
                      <span>• {artist.popularity}% popularity index</span>
                    )}
                  </div>

                  {artist.genres.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                      {artist.genres.slice(0, 4).map((g) => (
                        <span
                          key={g}
                          className="px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[11px] font-medium text-[#555555] dark:text-white/70 capitalize"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
                    <button
                      onClick={handlePlayAll}
                      className="px-5 py-2.5 rounded-full bg-black dark:bg-white hover:bg-black/90 dark:hover:bg-white/90 text-white dark:text-black font-bold text-xs flex items-center gap-2 transition-transform hover:scale-105 shadow-md"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                      <span>Play Artist</span>
                    </button>

                    {artist.externalUrls?.spotify && (
                      <a
                        href={artist.externalUrls.spotify}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-full border border-black/10 dark:border-white/10 text-[#777777] dark:text-white/50 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        title="Open in Spotify"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Top Tracks */}
              {topTracks.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-[#111111] dark:text-white tracking-tight">Popular Works</h3>
                  <div className="space-y-1">
                    {topTracks.map((track, idx) => {
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
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-6 text-center text-xs font-semibold text-[#888888] dark:text-white/40">
                              {idx + 1}
                            </span>
                            <img
                              src={track.art}
                              alt={track.title}
                              className="w-10 h-10 rounded-lg object-cover border border-black/5 dark:border-white/5 shrink-0"
                            />
                            <div className="min-w-0">
                              <p
                                className={`text-sm font-semibold truncate ${
                                  isCurrent ? "text-black dark:text-white font-bold" : "text-[#111111] dark:text-white"
                                }`}
                              >
                                {track.title}
                              </p>
                              <p className="text-xs text-[#777777] dark:text-white/50 truncate">{track.album}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-[#888888] dark:text-white/40 font-mono hidden sm:inline">
                              {formatTime((track.durationMs || 180000) / 1000)}
                            </span>
                            <button
                              onClick={() =>
                                addToQueue({
                                  id: track.id,
                                  title: track.title,
                                  artist: track.artist,
                                  album: track.album,
                                  duration: formatTime((track.durationMs || 180000) / 1000),
                                  durationMs: track.durationMs,
                                  art: track.art,
                                  audio: track.audio,
                                  accent: track.accent || "#111111",
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
              )}

              {/* Albums & Discography */}
              {albums.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-[#111111] dark:text-white tracking-tight">Discography</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {albums.map((album) => (
                      <div
                        key={album.id}
                        onClick={() => onSelectAlbum?.(album.id)}
                        className="group p-3 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] hover:border-black/10 dark:hover:border-white/10 transition-all cursor-pointer space-y-2"
                      >
                        <div className="aspect-square rounded-lg overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/40">
                          <img
                            src={
                              album.images?.[0]?.url ||
                              "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80"
                            }
                            alt={album.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#111111] dark:text-white truncate group-hover:text-black dark:group-hover:text-white transition-colors">
                            {album.name}
                          </h4>
                          <p className="text-[11px] text-[#777777] dark:text-white/50 truncate capitalize">
                            {album.releaseDate?.slice(0, 4)} • {album.albumType}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
