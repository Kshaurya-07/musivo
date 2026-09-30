import React from "react";
import { Play, Pause, Heart, ListPlus } from "lucide-react";
import { PlaybackTrack } from "@/contexts/PlaybackContext";

interface MusicCardProps {
  track: PlaybackTrack;
  isCurrent?: boolean;
  isPlaying?: boolean;
  isLiked?: boolean;
  rank?: number;
  badge?: string;
  onPlay: (track: PlaybackTrack) => void;
  onLike?: (track: PlaybackTrack) => void;
  onAddToQueue?: (track: PlaybackTrack) => void;
  className?: string;
}

export function MusicCard({
  track,
  isCurrent = false,
  isPlaying = false,
  isLiked = false,
  rank,
  badge,
  onPlay,
  onLike,
  onAddToQueue,
  className = "",
}: MusicCardProps) {
  const isCurrentlyPlaying = isCurrent && isPlaying;

  return (
    <div
      onClick={() => onPlay(track)}
      className={`group relative flex flex-col cursor-pointer transition-transform duration-300 hover:-translate-y-1 ${className}`}
    >
      {/* Artwork Container */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-2 bg-[#1b140c] shadow-[0_4px_16px_rgba(0,0,0,0.4)] group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-all duration-300">
        <img
          src={track.art}
          alt={track.title}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            isCurrentlyPlaying ? "scale-105" : ""
          }`}
          loading="lazy"
        />

        {/* Ambient Dark Gradient at Bottom of Artwork */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Optional Rank Badge (JioSaavn Top Charts style) */}
        {rank !== undefined && (
          <div className="absolute top-2 left-2 flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-md bg-gradient-to-r from-[#ffd064] to-[#f5ba42] text-[#140f07] font-display font-extrabold text-[11px] shadow-lg z-10">
            #{rank}
          </div>
        )}

        {/* Optional Custom Badge (e.g. NEW, MADE FOR YOU) */}
        {badge && !rank && (
          <span className="absolute top-2 left-2 rounded-md bg-[#f5ba42] px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#140f07] shadow-md uppercase tracking-wider z-10">
            {badge}
          </span>
        )}

        {/* Current Playing Waveform Indicator */}
        {isCurrentlyPlaying && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/75 backdrop-blur-md px-2 py-0.5 border border-[#f5ba42]/40 z-10">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f5ba42] animate-ping" />
            <span className="font-mono text-[9px] font-bold text-[#f5ba42]">PLAYING</span>
          </div>
        )}

        {/* Quick Actions (Like & Queue) Overlay on Top-Right of Artwork */}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          {onLike && !isCurrentlyPlaying && (
            <button
              type="button"
              title={isLiked ? "Remove from Liked" : "Save to Liked"}
              onClick={(e) => {
                e.stopPropagation();
                onLike(track);
              }}
              className={`h-7 w-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
                isLiked ? "text-[#f5ba42]" : "text-white/80 hover:text-white"
              }`}
            >
              <Heart className="h-3.5 w-3.5" fill={isLiked ? "currentColor" : "none"} />
            </button>
          )}
          {onAddToQueue && !isCurrentlyPlaying && (
            <button
              type="button"
              title="Add to queue"
              onClick={(e) => {
                e.stopPropagation();
                onAddToQueue(track);
              }}
              className="h-7 w-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-[#f5ba42] transition-all hover:scale-110 active:scale-95"
            >
              <ListPlus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Center/Bottom Play Button (JioSaavn style floating circle overlay) */}
        <button
          type="button"
          aria-label={isCurrentlyPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
          onClick={(e) => {
            e.stopPropagation();
            onPlay(track);
          }}
          className={`absolute bottom-2.5 right-2.5 h-10 w-10 rounded-full bg-[#f5ba42] hover:bg-[#ffd064] text-[#140f07] shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-20 ${
            isCurrentlyPlaying
              ? "opacity-100 scale-100 ring-4 ring-[#f5ba42]/30"
              : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
          }`}
        >
          {isCurrentlyPlaying ? (
            <Pause className="h-4 w-4 fill-current" />
          ) : (
            <Play className="h-4 w-4 fill-current ml-0.5" />
          )}
        </button>
      </div>

      {/* Metadata (Clean 2-line streaming style) */}
      <div className="min-w-0 space-y-0.5 px-0.5">
        <p
          className={`font-semibold text-xs sm:text-[13px] leading-tight truncate transition-colors ${
            isCurrent ? "text-[#f5ba42]" : "text-[#faf5ee] group-hover:text-[#f5ba42]"
          }`}
          title={track.title}
        >
          {track.title}
        </p>
        <p
          className="text-[11px] sm:text-xs text-[#8c7b68] truncate transition-colors group-hover:text-[#bda995]"
          title={track.artist}
        >
          {track.artist}
        </p>
      </div>
    </div>
  );
}
