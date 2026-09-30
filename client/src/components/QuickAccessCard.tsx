import React from "react";
import { Play } from "lucide-react";

interface QuickAccessCardProps {
  title: string;
  subtitle?: string;
  art?: string;
  icon?: React.ReactNode;
  gradient?: string;
  isActive?: boolean;
  onClick: () => void;
  onPlay?: (e: React.MouseEvent) => void;
  className?: string;
}

export function QuickAccessCard({
  title,
  subtitle,
  art,
  icon,
  gradient = "from-[#e0e0e0] to-[#c2c2c2] dark:from-[#2a2a2a] dark:to-[#151515]",
  isActive = false,
  onClick,
  onPlay,
  className = "",
}: QuickAccessCardProps) {
  return (
    <div
      onClick={onClick}
      className={`group relative flex items-center gap-3 h-14 sm:h-16 rounded-xl overflow-hidden bg-[#ffffff] dark:bg-[#151515] hover:bg-[#f1f1f1] dark:hover:bg-[#202020] border border-[#e0e0e0] dark:border-[#242424] hover:border-[#b0b0b0] dark:hover:border-[#363636] transition-all duration-200 cursor-pointer shadow-sm dark:shadow-md ${
        isActive
          ? "border-black dark:border-white bg-[#eaeaea] dark:bg-[#222222]"
          : ""
      } ${className}`}
    >
      {/* Visual Thumbnail (Image or Monochrome Gradient Icon) */}
      <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 relative overflow-hidden bg-[#e0e0e0] dark:bg-[#1f1f1f]">
        {art ? (
          <img
            src={art}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            className={`h-full w-full bg-gradient-to-br ${gradient} flex items-center justify-center text-black dark:text-white shadow-inner`}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1 pr-2 text-left">
        <p className="font-semibold text-xs sm:text-sm text-[#111111] dark:text-[#ffffff] truncate group-hover:underline underline-offset-2 transition-colors">
          {title}
        </p>
        {subtitle && (
          <p className="text-[11px] text-[#777777] dark:text-[#999999] truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Play Button on Hover */}
      {onPlay && (
        <button
          type="button"
          aria-label={`Play ${title}`}
          onClick={(e) => {
            e.stopPropagation();
            onPlay(e);
          }}
          className="mr-3 h-9 w-9 rounded-full bg-[#000000] dark:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-90 transition-all duration-200 hover:scale-110 active:scale-95 shrink-0"
        >
          <Play className="h-4 w-4 fill-current ml-0.5" />
        </button>
      )}
    </div>
  );
}
