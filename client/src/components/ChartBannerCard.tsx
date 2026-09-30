import React from "react";
import { Play, Pause, Disc3, TrendingUp } from "lucide-react";

interface ChartBannerCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  image?: string;
  gradient?: string;
  isCurrent?: boolean;
  isPlaying?: boolean;
  onClick: () => void;
  onPlay?: (e: React.MouseEvent) => void;
  className?: string;
}

export function ChartBannerCard({
  title,
  subtitle,
  badge = "TOP 50",
  image,
  gradient = "from-[#352010] via-[#22160d] to-[#120d08]",
  isCurrent = false,
  isPlaying = false,
  onClick,
  onPlay,
  className = "",
}: ChartBannerCardProps) {
  const isCurrentlyPlaying = isCurrent && isPlaying;

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col cursor-pointer transition-transform duration-300 hover:-translate-y-1 ${className}`}
    >
      {/* 16:9 Rectangular Banner Artwork Container */}
      <div className={`relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-gradient-to-br ${gradient} shadow-[0_4px_16px_rgba(0,0,0,0.4)] group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-all duration-300 ${
        isCurrent ? "ring-2 ring-[#f5ba42]/60" : ""
      }`}>
        {image ? (
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover opacity-80 group-hover:opacity-95 group-hover:scale-105 transition-all duration-500"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center opacity-40">
            <Disc3 className="h-16 w-16 text-[#f5ba42] animate-[spin_12s_linear_infinite]" />
          </div>
        )}

        {/* Ambient Dark Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        {/* Center Circular Chart Badge (JioSaavn Top Music Charts style) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative flex flex-col items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-[#ffd064] via-[#f5ba42] to-[#c88719] text-[#140f07] shadow-[0_8px_24px_rgba(245,186,66,0.35)] ring-4 ring-black/50 group-hover:scale-110 transition-transform duration-300">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mb-0.5 stroke-[2.5]" />
            <span className="font-display font-black text-[9px] sm:text-[10px] uppercase tracking-tighter leading-none">
              {badge}
            </span>
          </div>
        </div>

        {/* Play Button Overlay (Bottom Right) */}
        {onPlay && (
          <button
            type="button"
            aria-label={isCurrentlyPlaying ? `Pause ${title}` : `Play ${title}`}
            onClick={(e) => {
              e.stopPropagation();
              onPlay(e);
            }}
            className={`absolute bottom-2.5 right-2.5 h-10 w-10 rounded-full bg-[#f5ba42] hover:bg-[#ffd064] text-[#140f07] shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-10 ${
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
        )}
      </div>

      {/* Metadata */}
      <div className="mt-2 space-y-0.5 px-0.5">
        <p
          className={`font-semibold text-xs sm:text-[13px] leading-tight truncate transition-colors ${
            isCurrent ? "text-[#f5ba42]" : "text-[#faf5ee] group-hover:text-[#f5ba42]"
          }`}
          title={title}
        >
          {title}
        </p>
        <p className="text-[11px] sm:text-xs text-[#8c7b68] truncate group-hover:text-[#bcaea0]">
          {subtitle || "Musivo Charts"}
        </p>
      </div>
    </div>
  );
}
