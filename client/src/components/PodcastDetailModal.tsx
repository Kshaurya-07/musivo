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
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { usePlayback, type PlaybackTrack } from "@/contexts/PlaybackContext";
import { formatTime } from "@/lib/musivo";
import { toast } from "sonner";

interface PodcastDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  showId: string | null;
  initialEpisodeId?: string | null;
}

export function PodcastDetailModal({
  isOpen,
  onClose,
  showId,
  initialEpisodeId,
}: PodcastDetailModalProps) {
  const {
    playTrack,
    currentTrack,
    isPlaying,
    togglePlay,
    videoMode,
    setVideoMode,
    isSpotifyConnected,
  } = usePlayback();

  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(
    initialEpisodeId || null
  );

  const trpcUtils = trpc.useUtils();

  const showQuery = trpc.music.getShow.useQuery(
    { showId: showId || "" },
    { enabled: Boolean(isOpen && showId) }
  );

  const savedShowsQuery = trpc.spotify.savedShows.useQuery(undefined, {
    enabled: Boolean(isOpen && isSpotifyConnected),
  });

  const toggleSaveMutation = trpc.spotify.toggleSaveShow.useMutation({
    onSuccess: (_, variables) => {
      toast.success(variables.save ? "Show saved to Library" : "Show removed from Library");
      void trpcUtils.spotify.savedShows.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update library");
    },
  });

  if (!isOpen || !showId) return null;

  const show = showQuery.data;
  const isShowSaved =
    savedShowsQuery.data?.items?.some((item) => item.id === showId) ?? false;

  const activeEpisode =
    show?.episodes?.find((e) => e.id === (selectedEpisodeId || show.episodes[0]?.id)) ||
    show?.episodes?.[0];

  const handlePlayEpisode = async (episode: NonNullable<typeof show>["episodes"][0]) => {
    setSelectedEpisodeId(episode.id);

    const isCurrentEpisode =
      String(currentTrack.id) === `spotify-${episode.id}` ||
      currentTrack.episodeId === episode.id;

    if (isCurrentEpisode) {
      await togglePlay();
      return;
    }

    const episodeTrack: PlaybackTrack = {
      id: `spotify-${episode.id}`,
      title: episode.name,
      artist: show?.publisher || "Podcast",
      album: show?.name || "Podcast Show",
      duration: formatTime(episode.durationMs / 1000),
      art: episode.images?.[0]?.url || show?.images?.[0]?.url || "",
      audio: "",
      accent: "#f5ba42",
      badge: "PODCAST",
      durationMs: episode.durationMs,
      source: "Spotify",
      isEpisode: true,
      episodeId: episode.id,
      showName: show?.name,
      resumePositionMs: episode.resumePositionMs || 0,
    };

    const upcomingQueue: PlaybackTrack[] = (show?.episodes || []).map((ep) => ({
      id: `spotify-${ep.id}`,
      title: ep.name,
      artist: show?.publisher || "Podcast",
      album: show?.name || "Podcast Show",
      duration: formatTime(ep.durationMs / 1000),
      art: ep.images?.[0]?.url || show?.images?.[0]?.url || "",
      audio: "",
      accent: "#f5ba42",
      badge: "PODCAST",
      durationMs: ep.durationMs,
      source: "Spotify",
      isEpisode: true,
      episodeId: ep.id,
      showName: show?.name,
      resumePositionMs: ep.resumePositionMs || 0,
    }));

    await playTrack(episodeTrack, upcomingQueue);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-white/10 bg-[#0f0c09] shadow-2xl backdrop-blur-2xl text-[#faf5ee] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient background glow */}
        <div
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] h-[300px] opacity-25 blur-[120px] rounded-full"
          style={{ background: "#f5ba42" }}
        />

        {/* Modal Top Bar */}
        <div className="relative z-10 flex items-center justify-between p-5 border-b border-white/5 bg-[#0f0c09]/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#f5ba42]/10 text-[#f5ba42] border border-[#f5ba42]/20 font-semibold">
              Podcast Series
            </span>
            {show && (
              <span className="text-xs text-[#8c7b68]">
                {show.totalEpisodes} episodes
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Audio / Video Toggle */}
            <div className="flex items-center rounded-xl bg-white/[0.06] p-1 border border-white/5">
              <button
                onClick={() => setVideoMode(false)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
                  !videoMode
                    ? "bg-[#f5ba42] text-black font-semibold shadow-sm"
                    : "text-[#8c7b68] hover:text-white"
                }`}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Audio</span>
              </button>
              <button
                onClick={() => setVideoMode(true)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
                  videoMode
                    ? "bg-[#f5ba42] text-black font-semibold shadow-sm"
                    : "text-[#8c7b68] hover:text-white"
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Video</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-[#8c7b68] hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-5 sm:p-7 space-y-6">
          {showQuery.isLoading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-10 h-10 border-2 border-[#f5ba42] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-[#8c7b68]">Loading podcast series...</p>
            </div>
          ) : show ? (
            <>
              {/* Show Header Information */}
              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                <img
                  src={show.images?.[0]?.url || "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=500&q=80"}
                  alt={show.name}
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover shadow-xl border border-white/10 shrink-0"
                />

                <div className="space-y-2 flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
                    {show.name}
                  </h2>
                  <p className="text-sm font-medium text-[#f5ba42]">
                    {show.publisher}
                  </p>
                  <p className="text-xs text-[#b2a28f] line-clamp-3 leading-relaxed">
                    {show.description}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    {show.episodes?.[0] && (
                      <button
                        onClick={() => handlePlayEpisode(show.episodes[0])}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#f5ba42] text-black font-semibold text-sm hover:bg-[#ffc857] transition shadow-lg shadow-[#f5ba42]/20 active:scale-95"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Latest Episode</span>
                      </button>
                    )}

                    {isSpotifyConnected && (
                      <button
                        onClick={() =>
                          toggleSaveMutation.mutate({
                            showId,
                            save: !isShowSaved,
                          })
                        }
                        disabled={toggleSaveMutation.isPending}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition ${
                          isShowSaved
                            ? "bg-white/10 text-white border-white/20"
                            : "bg-white/[0.04] text-[#d6c7b2] border-white/10 hover:bg-white/[0.08] hover:text-white"
                        }`}
                      >
                        {isShowSaved ? (
                          <>
                            <BookmarkCheck className="w-4 h-4 text-[#f5ba42]" />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-4 h-4" />
                            <span>Follow Show</span>
                          </>
                        )}
                      </button>
                    )}

                    {show.externalUrls?.spotify && (
                      <a
                        href={show.externalUrls.spotify}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-full text-[#8c7b68] hover:text-white hover:bg-white/10 transition"
                        title="View on Spotify"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Video Player Presentation (Official Spotify Embed) */}
              {videoMode && activeEpisode && (
                <div className="rounded-3xl border border-white/10 bg-black/40 p-4 space-y-3 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[#f5ba42] font-semibold">
                      <Video className="w-4 h-4" />
                      <span>Official Spotify Video Player</span>
                    </div>
                    <span className="text-[11px] text-[#8c7b68]">
                      {activeEpisode.name}
                    </span>
                  </div>

                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black/80 border border-white/10 shadow-2xl">
                    <iframe
                      src={`https://open.spotify.com/embed/episode/${activeEpisode.id}?utm_source=generator&theme=0`}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
                </div>
              )}

              {/* Episodes List Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8c7b68]">
                    Episodes ({show.episodes.length})
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {show.episodes.map((ep) => {
                    const isEpisodePlaying =
                      isPlaying &&
                      (String(currentTrack.id) === `spotify-${ep.id}` ||
                        currentTrack.episodeId === ep.id);
                    const isSelected = selectedEpisodeId === ep.id;

                    return (
                      <div
                        key={ep.id}
                        className={`group p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isEpisodePlaying || isSelected
                            ? "bg-[#f5ba42]/10 border-[#f5ba42]/30"
                            : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10"
                        }`}
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              className={`text-sm font-semibold line-clamp-1 ${
                                isEpisodePlaying ? "text-[#f5ba42]" : "text-white"
                              }`}
                            >
                              {ep.name}
                            </h4>

                            {ep.resumePositionMs && ep.resumePositionMs > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#f5ba42]/20 text-[#f5ba42]">
                                Resume {formatTime(ep.resumePositionMs / 1000)}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-[#8c7b68] line-clamp-2 leading-relaxed">
                            {ep.description}
                          </p>

                          <div className="flex items-center gap-3 text-[11px] text-[#6e5f50]">
                            {ep.releaseDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {ep.releaseDate}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(ep.durationMs / 1000)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => handlePlayEpisode(ep)}
                            className={`p-3 rounded-full transition active:scale-90 shadow-md ${
                              isEpisodePlaying
                                ? "bg-[#f5ba42] text-black"
                                : "bg-white/[0.08] text-white hover:bg-[#f5ba42] hover:text-black"
                            }`}
                            title={isEpisodePlaying ? "Pause" : "Play Episode"}
                          >
                            {isEpisodePlaying ? (
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
          ) : (
            <div className="py-24 text-center text-[#8c7b68] text-sm">
              Show could not be found or loaded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
