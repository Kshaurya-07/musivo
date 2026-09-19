import React, { useState } from "react";
import {
  X,
  Play,
  Pause,
  Clock,
  Calendar,
  Bookmark,
  BookmarkCheck,
  Video,
  Headphones,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { usePlayback, PlaybackTrack } from "@/contexts/PlaybackContext";
import { formatTime } from "@/lib/musivo";
import { toast } from "sonner";

interface PodcastDetailModalProps {
  showId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PodcastDetailModal({ showId, isOpen, onClose }: PodcastDetailModalProps) {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
    isSpotifyConnected,
    connectSpotify,
  } = usePlayback();

  const [expandedDesc, setExpandedDesc] = useState(false);
  const [videoEpisodeId, setVideoEpisodeId] = useState<string | null>(null);

  const showQuery = trpc.music.getShow.useQuery(
    { showId: showId || "" },
    { enabled: isOpen && Boolean(showId) }
  );

  const toggleSaveMutation = trpc.spotify.toggleSaveShow.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.save ? "Saved to your library" : "Removed from your library");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update library");
    },
  });

  if (!isOpen || !showId) return null;

  const show = showQuery.data;

  const handlePlayEpisode = async (ep: any) => {
    const track: PlaybackTrack = {
      id: `spotify-episode-${ep.id}`,
      title: ep.name,
      artist: show?.name || show?.publisher || "Podcast",
      album: show?.name || "Podcast Show",
      duration: formatTime((ep.durationMs || 0) / 1000),
      durationMs: ep.durationMs,
      art:
        ep.images?.[0]?.url ||
        show?.images?.[0]?.url ||
        "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80",
      audio: "",
      accent: "#a855f7",
      source: "spotify-episode",
      badge: "PODCAST EPISODE",
      storeUrl: ep.externalUrls?.spotify || `https://open.spotify.com/episode/${ep.id}`,
    };

    await playTrack(track);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-[#121214] border border-white/10 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#17171a] shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 tracking-wide uppercase">
            <span>Podcast Series</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {showQuery.isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-white/40">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              <span>Loading podcast details...</span>
            </div>
          ) : !show ? (
            <div className="py-20 text-center text-white/40">
              <p>Unable to load podcast metadata.</p>
            </div>
          ) : (
            <>
              {/* Show Header Card */}
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <img
                  src={
                    show.images?.[0]?.url ||
                    "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80"
                  }
                  alt={show.name}
                  className="w-36 h-36 sm:w-44 sm:h-44 rounded-xl object-cover shadow-2xl shrink-0 border border-white/10"
                />

                <div className="flex-1 min-w-0 space-y-3">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                      {show.name}
                    </h2>
                    <p className="text-sm font-medium text-purple-300 mt-1">{show.publisher}</p>
                  </div>

                  <div className="text-xs text-white/60 relative">
                    <p className={expandedDesc ? "" : "line-clamp-2"}>{show.description}</p>
                    {show.description && show.description.length > 140 && (
                      <button
                        onClick={() => setExpandedDesc(!expandedDesc)}
                        className="text-purple-400 hover:text-purple-300 font-semibold text-[11px] mt-1 inline-flex items-center gap-1"
                      >
                        <span>{expandedDesc ? "Show less" : "Read more"}</span>
                        {expandedDesc ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
                      {show.totalEpisodes} episodes
                    </span>

                    {isSpotifyConnected ? (
                      <button
                        onClick={() =>
                          toggleSaveMutation.mutate({ showId: show.id, save: true })
                        }
                        disabled={toggleSaveMutation.isPending}
                        className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>Follow show</span>
                      </button>
                    ) : (
                      <button
                        onClick={connectSpotify}
                        className="px-3.5 py-1.5 rounded-full bg-purple-500 hover:bg-purple-400 text-black text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <span>Connect to follow</span>
                      </button>
                    )}

                    {show.externalUrls?.spotify && (
                      <a
                        href={show.externalUrls.spotify}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                        title="Open on Spotify"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Embedded Video Experience Section (Official Spotify Embed) */}
              {videoEpisodeId && (
                <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider">
                      <Video className="w-4 h-4 text-purple-400" />
                      <span>Official Spotify Video & Audio Player</span>
                    </div>
                    <button
                      onClick={() => setVideoEpisodeId(null)}
                      className="text-xs text-white/50 hover:text-white font-medium"
                    >
                      Close Player
                    </button>
                  </div>
                  <div className="w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-black">
                    <iframe
                      src={`https://open.spotify.com/embed/episode/${videoEpisodeId}?utm_source=generator&theme=0`}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="w-full h-full"
                    />
                  </div>
                </div>
              )}

              {/* Episodes List */}
              <div className="space-y-3 pt-2">
                <h3 className="text-base font-bold text-white tracking-tight">All Episodes</h3>

                <div className="space-y-2">
                  {(show.episodes || []).map((ep) => {
                    const isCurrent =
                      String(currentTrack.id).includes(ep.id) ||
                      currentTrack.title.toLowerCase() === ep.name.toLowerCase();
                    const isCurrentPlaying = isCurrent && isPlaying;
                    const durationMinutes = Math.round(ep.durationMs / 60000);
                    const resumePercent =
                      typeof ep.resumePositionMs === "number" && ep.durationMs > 0
                        ? Math.min(100, Math.round((ep.resumePositionMs / ep.durationMs) * 100))
                        : null;

                    return (
                      <div
                        key={ep.id}
                        className={`group relative rounded-xl border p-4 transition-all ${
                          isCurrent
                            ? "bg-purple-500/10 border-purple-500/30 text-white"
                            : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] text-white/80"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center gap-2 text-xs text-white/40">
                              {ep.releaseDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" /> {ep.releaseDate}
                                </span>
                              )}
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {durationMinutes} min
                              </span>
                            </div>

                            <h4
                              className={`text-sm font-semibold leading-snug line-clamp-2 ${
                                isCurrent ? "text-purple-300" : "text-white"
                              }`}
                            >
                              {ep.name}
                            </h4>

                            <p className="text-xs text-white/50 line-clamp-2">{ep.description}</p>

                            {/* Resume progress bar */}
                            {resumePercent !== null && resumePercent > 0 && (
                              <div className="w-36 h-1 rounded-full bg-white/10 overflow-hidden mt-2">
                                <div
                                  className="h-full bg-purple-400 rounded-full"
                                  style={{ width: `${resumePercent}%` }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0 self-center">
                            <button
                              onClick={() => setVideoEpisodeId(ep.id)}
                              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                              title="Watch / Video Embed"
                            >
                              <Video className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() =>
                                isCurrent ? togglePlay() : handlePlayEpisode(ep)
                              }
                              className={`p-3 rounded-full transition-transform hover:scale-105 shadow-md ${
                                isCurrentPlaying
                                  ? "bg-purple-500 text-black"
                                  : "bg-white text-black hover:bg-white/90"
                              }`}
                              title={isCurrentPlaying ? "Pause" : "Play Episode"}
                            >
                              {isCurrentPlaying ? (
                                <Pause className="w-4 h-4 fill-current" />
                              ) : (
                                <Play className="w-4 h-4 fill-current ml-0.5" />
                              )}
                            </button>
                          </div>
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
