import React, { useState } from "react";
import {
  ChevronDown,
  Heart,
  Pause,
  Play,
  Repeat1,
  Repeat2,
  Shuffle,
  SkipBack,
  SkipForward,
  ListMusic,
  Sparkles,
  Moon,
  Radio,
  RotateCcw,
  RotateCw,
  Video,
  Gauge,
} from "lucide-react";
import { formatTime } from "@/lib/musivo";
import { usePlayback, PlaybackTrack, PlaybackMode, RepeatMode } from "@/contexts/PlaybackContext";
import { SleepTimerModal } from "./SleepTimerModal";
import { DeviceSelectorModal } from "./DeviceSelectorModal";

interface NowPlayingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: PlaybackTrack;
  isPlaying: boolean;
  progress: number;
  duration: number;
  playbackMode: PlaybackMode;
  repeatMode: RepeatMode;
  isLiked: boolean;
  onTogglePlay: () => void;
  onSkip: (direction: 1 | -1) => void;
  onSeek: (seconds: number) => void;
  onToggleLike: () => void;
  onToggleRepeat: () => void;
  onShuffle: () => void;
  onOpenQueue: () => void;
}

const SPEED_PRESETS = [1.0, 1.2, 1.5, 2.0, 0.8];

export function NowPlayingModal({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  progress,
  duration,
  playbackMode,
  repeatMode,
  isLiked,
  onTogglePlay,
  onSkip,
  onSeek,
  onToggleLike,
  onToggleRepeat,
  onShuffle,
  onOpenQueue,
}: NowPlayingModalProps) {
  const {
    sleepTimer,
    sleepTimerRemainingSec,
    playbackSpeed,
    setPlaybackSpeed,
    seekRelative,
    videoMode,
    setVideoMode,
    activeEpisodeId,
  } = usePlayback();

  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);

  if (!isOpen) return null;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  const isPodcast =
    currentTrack.source === "spotify-episode" ||
    currentTrack.badge === "PODCAST EPISODE" ||
    String(currentTrack.id).includes("episode");

  const cycleSpeed = () => {
    const currentIdx = SPEED_PRESETS.indexOf(playbackSpeed);
    const nextIdx = (currentIdx + 1) % SPEED_PRESETS.length;
    setPlaybackSpeed(SPEED_PRESETS[nextIdx]);
  };

  const episodeRawId = activeEpisodeId || String(currentTrack.id).replace(/^spotify-(episode-)?/, "");

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col justify-between bg-[#0d0a07] px-5 py-5 sm:px-10 sm:py-8 text-[#faf5ee] animate-in slide-in-from-bottom duration-300 safe-area-pt safe-area-pb">
        {/* Ambient background glows */}
        <div
          className="pointer-events-none absolute inset-0 opacity-25 blur-[100px]"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${currentTrack.accent || "#f5ba42"} 0%, transparent 60%)`,
          }}
        />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <button
            onClick={onClose}
            aria-label="Minimize player"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.06] text-[#b2a28f] hover:bg-white/[0.12] hover:text-white transition"
          >
            <ChevronDown className="h-6 w-6" />
          </button>

          <div className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8c7b68]">
              {isPodcast ? "Playing Podcast" : "Playing from"}
            </p>
            <p className="text-xs font-semibold text-[#faf5ee] truncate max-w-[200px]">
              {currentTrack.album || "Musivo Catalog"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Sleep Timer button */}
            <button
              onClick={() => setIsSleepModalOpen(true)}
              aria-label="Sleep timer"
              className={`grid h-10 w-10 place-items-center rounded-full transition ${
                sleepTimer
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-md"
                  : "bg-white/[0.06] text-[#b2a28f] hover:bg-white/[0.12] hover:text-white"
              }`}
              title={
                sleepTimer
                  ? `Sleep timer active (${sleepTimerRemainingSec !== null ? formatTime(sleepTimerRemainingSec) : "on"})`
                  : "Set sleep timer"
              }
            >
              <Moon className="h-4 w-4" />
            </button>

            {/* Spotify Connect Devices button */}
            <button
              onClick={() => setIsDeviceModalOpen(true)}
              aria-label="Select device"
              className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.06] text-[#b2a28f] hover:bg-white/[0.12] hover:text-white transition"
              title="Connect a device"
            >
              <Radio className="h-4 w-4" />
            </button>

            {/* Queue button */}
            <button
              onClick={() => {
                onOpenQueue();
                onClose();
              }}
              aria-label="View Queue"
              className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.06] text-[#b2a28f] hover:bg-white/[0.12] hover:text-white transition"
            >
              <ListMusic className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Center Artwork / Video Embed & Controls Container */}
        <div className="relative z-10 mx-auto my-auto flex w-full max-w-4xl flex-col items-center justify-center gap-5 py-2 landscape:flex-row landscape:items-center landscape:justify-center landscape:gap-8 sm:gap-7">
          {/* Center Visual: Artwork or Official Spotify Embed Video */}
          <div className="relative w-full max-w-[240px] xs:max-w-[280px] sm:max-w-[340px] md:max-w-[380px] landscape:max-w-[210px] aspect-square shrink-0">
            {videoMode && isPodcast ? (
              <div className="relative h-full w-full overflow-hidden rounded-3xl border border-purple-500/30 bg-black shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
                <iframe
                  src={`https://open.spotify.com/embed/episode/${episodeRawId}?utm_source=generator&theme=0`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="w-full h-full"
                />
              </div>
            ) : (
              <div className="relative h-full w-full overflow-hidden rounded-3xl border border-[#f5ba42]/20 bg-[#16100a] shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
                <img
                  src={currentTrack.art}
                  alt={currentTrack.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>
            )}
          </div>

          {/* Track Info & Controls */}
          <div className="w-full max-w-md space-y-4 sm:space-y-5">
            {/* Title & Artist & Like Button */}
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-display text-xl sm:text-2xl font-bold tracking-tight text-[#faf5ee]">
                  {currentTrack.title}
                </h2>
                <p className="truncate text-sm sm:text-base text-[#a89885] mt-0.5">
                  {currentTrack.artist}
                </p>
              </div>
              <button
                onClick={onToggleLike}
                aria-label="Like song"
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-full transition ${
                  isLiked
                    ? "text-[#f5ba42] drop-shadow-[0_0_12px_rgba(245,186,66,0.5)]"
                    : "text-[#8c7b68] hover:text-white"
                }`}
              >
                <Heart className="h-6 w-6" fill={isLiked ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Scrubbable Seek Bar */}
            <div>
              <div
                className="group relative flex h-6 w-full cursor-pointer items-center"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                  onSeek(Math.floor(ratio * (duration || 0)));
                }}
              >
                <div className="h-1.5 w-full rounded-full bg-white/[0.12] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#ffd064] via-[#f5ba42] to-[#e09b26] transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div
                  className="absolute h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between font-mono text-xs text-[#8c7b68]">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Podcast Specific Controls: Speed, ±15s, and Video presentation toggle */}
            {isPodcast && (
              <div className="flex items-center justify-center gap-5 py-1 text-xs font-semibold text-white/70">
                <button
                  onClick={cycleSpeed}
                  className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-purple-300 flex items-center gap-1 transition-colors"
                  title="Playback Speed"
                >
                  <Gauge className="w-3.5 h-3.5" />
                  <span>{playbackSpeed}x</span>
                </button>

                <button
                  onClick={() => seekRelative(-15)}
                  className="p-1.5 hover:text-white transition-colors"
                  title="Rewind 15 seconds"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => seekRelative(15)}
                  className="p-1.5 hover:text-white transition-colors"
                  title="Forward 15 seconds"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setVideoMode(!videoMode)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    videoMode
                      ? "bg-purple-500 text-black shadow-md"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                  title="Toggle Video Presentation (Official Spotify Embed)"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>{videoMode ? "Video Mode" : "Audio Mode"}</span>
                </button>
              </div>
            )}

            {/* Action Controls */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={onShuffle}
                aria-label="Shuffle"
                className="p-2 text-[#8c7b68] hover:text-[#f5ba42] transition"
              >
                <Shuffle className="h-5 w-5" />
              </button>

              <button
                onClick={() => onSkip(-1)}
                aria-label="Previous"
                className="p-2 text-[#faf5ee] hover:text-[#f5ba42] transition"
              >
                <SkipBack className="h-7 w-7 fill-current" />
              </button>

              <button
                onClick={onTogglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-tr from-[#f5ba42] to-[#ffd064] text-[#140f07] shadow-[0_8px_30px_rgba(245,186,66,0.35)] transition-transform hover:scale-105 active:scale-95"
              >
                {isPlaying ? (
                  <Pause className="h-7 w-7 fill-current" />
                ) : (
                  <Play className="ml-0.5 h-7 w-7 fill-current" />
                )}
              </button>

              <button
                onClick={() => onSkip(1)}
                aria-label="Next"
                className="p-2 text-[#faf5ee] hover:text-[#f5ba42] transition"
              >
                <SkipForward className="h-7 w-7 fill-current" />
              </button>

              <button
                onClick={onToggleRepeat}
                aria-label={`Repeat: ${repeatMode}`}
                className={`p-2 transition ${
                  repeatMode !== "off" ? "text-[#f5ba42]" : "text-[#8c7b68] hover:text-white"
                }`}
              >
                {repeatMode === "one" ? (
                  <Repeat1 className="h-5 w-5" />
                ) : (
                  <Repeat2 className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Engine Badge */}
            <div className="flex justify-center pt-2">
              <span className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1 text-[11px] font-medium text-[#b2a28f]">
                <Sparkles className="h-3 w-3 text-[#f5ba42]" />
                {playbackMode === "spotify"
                  ? "Spotify Web Playback Engine"
                  : "High-Fidelity Musivo Stream"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Modals */}
      <SleepTimerModal
        isOpen={isSleepModalOpen}
        onClose={() => setIsSleepModalOpen(false)}
      />

      <DeviceSelectorModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
      />
    </>
  );
}

export default NowPlayingModal;
