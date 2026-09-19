import React from "react";
import { Play, Pause, Heart, ListPlus, Volume2 } from "lucide-react";
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
      className={`group relative flex flex-col p-3 rounded-2xl bg-white/[0.035] hover:bg-white/[0.075] border border-white/[0.06] hover:border-[#f5ba42]/30 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:translate-y-[-2px] ${
        isCurrent ? "border-[#f5ba42]/40 bg-[#f5ba42]/[0.06]" : ""
      } ${className}`}
    >
      {/* Artwork Container */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-[#1e150d] shadow-md">
        <img
          src={track.art}
          alt={track.title}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            isCurrentlyPlaying ? "scale-105" : ""
          }`}
          loading="lazy"
        />

        {/* Ambient Dark Gradient at Bottom of Artwork */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Optional Rank Badge (JioSaavn Top Charts style) */}
        {rank !== undefined && (
          <div className="absolute top-2 left-2 flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-md bg-gradient-to-r from-[#ffd064] to-[#f5ba42] text-[#140f07] font-display font-extrabold text-[11px] shadow-lg">
            #{rank}
          </div>
        )}

        {/* Optional Custom Badge (e.g. NEW, MADE FOR YOU) */}
        {badge && !rank && (
          <span className="absolute top-2 left-2 rounded-md bg-[#f5ba42] px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#140f07] shadow-md uppercase tracking-wider">
            {badge}
          </span>
        )}

        {/* Current Playing Waveform Indicator */}
        {isCurrentlyPlaying && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 border border-[#f5ba42]/40">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f5ba42] animate-ping" />
            <span className="font-mono text-[9px] font-bold text-[#f5ba42]">PLAYING</span>
          </div>
        )}

        {/* Center/Bottom Play Button (JioSaavn / Spotify style overlay) */}
        <button
          type="button"
          aria-label={isCurrentlyPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
          onClick={(e) => {
            e.stopPropagation();
            onPlay(track);
          }}
          className={`absolute bottom-2.5 right-2.5 h-10 w-10 rounded-full bg-[#f5ba42] hover:bg-[#ffd064] text-[#140f07] shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
            isCurrentlyPlaying
              ? "opacity-100 translate-y-0 scale-100 ring-4 ring-[#f5ba42]/20"
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

      {/* Metadata */}
      <div className="min-w-0 flex-1 space-y-0.5">
        <p
          className={`font-semibold text-xs sm:text-sm truncate transition-colors ${
            isCurrent ? "text-[#f5ba42]" : "text-[#faf5ee] group-hover:text-white"
          }`}
          title={track.title}
        >
          {track.title}
        </p>
        <p
          className="text-[11px] sm:text-xs text-[#9a8976] truncate transition-colors group-hover:text-[#bda995]"
          title={track.artist}
        >
          {track.artist}
        </p>
      </div>

      {/* Footer / Micro-Actions */}
      <div className="mt-2.5 flex items-center justify-between pt-1.5 border-t border-white/[0.05]">
        <span className="font-mono text-[10px] text-[#7d6e5d]">
          {track.duration || "Single"}
        </span>

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {onAddToQueue && (
            <button
              type="button"
              title="Add to queue"
              onClick={(e) => {
                e.stopPropagation();
                onAddToQueue(track);
              }}
              className="p-1 rounded-md text-[#8c7b68] hover:text-[#f5ba42] hover:bg-white/[0.06] transition"
            >
              <ListPlus className="h-3.5 w-3.5" />
            </button>
          )}
          {onLike && (
            <button
              type="button"
              title={isLiked ? "Remove from Liked Songs" : "Save to Liked Songs"}
              onClick={(e) => {
                e.stopPropagation();
                onLike(track);
              }}
              className={`p-1 rounded-md transition hover:bg-white/[0.06] ${
                isLiked ? "text-[#f5ba42]" : "text-[#8c7b68] hover:text-white"
              }`}
            >
              <Heart className="h-3.5 w-3.5" fill={isLiked ? "currentColor" : "none"} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
