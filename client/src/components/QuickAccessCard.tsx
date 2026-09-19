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
  gradient = "from-[#ffd064] via-[#f5ba42] to-[#c88719]",
  isActive = false,
  onClick,
  onPlay,
  className = "",
}: QuickAccessCardProps) {
  return (
    <div
      onClick={onClick}
      className={`group relative flex items-center gap-3 h-14 sm:h-16 rounded-xl overflow-hidden bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.05] hover:border-[#f5ba42]/30 transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl ${
        isActive ? "border-[#f5ba42]/50 bg-[#f5ba42]/[0.08]" : ""
      } ${className}`}
    >
      {/* Visual Thumbnail (Image or Gradient Icon) */}
      <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 relative overflow-hidden bg-[#1e150d]">
        {art ? (
          <img
            src={art}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            className={`h-full w-full bg-gradient-to-br ${gradient} flex items-center justify-center text-[#140f07] shadow-inner`}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1 pr-2">
        <p className="font-semibold text-xs sm:text-sm text-[#faf5ee] truncate group-hover:text-[#f5ba42] transition-colors">
          {title}
        </p>
        {subtitle && (
          <p className="text-[11px] text-[#9a8976] truncate mt-0.5">
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
          className="mr-3 h-9 w-9 rounded-full bg-[#f5ba42] text-[#140f07] shadow-xl flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-90 transition-all duration-200 hover:scale-110 active:scale-95 shrink-0"
        >
          <Play className="h-4 w-4 fill-current ml-0.5" />
        </button>
      )}
    </div>
  );
}
