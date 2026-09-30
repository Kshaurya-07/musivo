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
  gradient = "from-[#242424] via-[#1a1a1a] to-[#111111]",
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
      <div
        className={`relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-gradient-to-br ${gradient} border border-[#e0e0e0] dark:border-[#242424] shadow-[0_4px_14px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-all duration-300 ${
          isCurrent ? "ring-2 ring-black dark:ring-white" : ""
        }`}
      >
        {image ? (
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover opacity-80 group-hover:opacity-95 group-hover:scale-105 transition-all duration-500"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center opacity-40">
            <Disc3 className="h-16 w-16 text-[#888888] dark:text-[#cccccc] animate-[spin_12s_linear_infinite]" />
          </div>
        )}

        {/* Ambient Dark Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

        {/* Center Circular Chart Badge (Monochrome Graphite / Black / White) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative flex flex-col items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-[#000000] dark:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] shadow-[0_8px_24px_rgba(0,0,0,0.4)] ring-4 ring-black/40 dark:ring-white/20 group-hover:scale-110 transition-transform duration-300">
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
            className={`absolute bottom-2.5 right-2.5 h-10 w-10 rounded-full bg-[#000000] dark:bg-[#ffffff] hover:bg-[#222222] dark:hover:bg-[#eaeaea] text-[#ffffff] dark:text-[#000000] shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-10 ${
              isCurrentlyPlaying
                ? "opacity-100 scale-100 ring-4 ring-black/25 dark:ring-white/25"
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
      <div className="mt-2 space-y-0.5 px-0.5 text-left">
        <p
          className={`font-semibold text-xs sm:text-[13px] leading-tight truncate transition-colors ${
            isCurrent
              ? "text-[#111111] dark:text-[#ffffff] underline underline-offset-2"
              : "text-[#111111] dark:text-[#ffffff] group-hover:text-black dark:group-hover:text-white"
          }`}
          title={title}
        >
          {title}
        </p>
        <p className="text-[11px] sm:text-xs text-[#777777] dark:text-[#999999] truncate">
          {subtitle || "Musivo Charts"}
        </p>
      </div>
    </div>
  );
}
