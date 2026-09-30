import React from "react";
import { Play, Users } from "lucide-react";

interface ArtistCardProps {
  id?: string;
  name: string;
  image?: string;
  category?: string;
  onClick: () => void;
  className?: string;
}

export function ArtistCard({
  name,
  image,
  category = "Artist",
  onClick,
  className = "",
}: ArtistCardProps) {
  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col items-center text-center cursor-pointer transition-transform duration-300 hover:-translate-y-1 ${className}`}
    >
      {/* Circular Avatar Container with Ring Glow */}
      <div className="relative aspect-square w-24 sm:w-28 md:w-32 rounded-full overflow-hidden mb-2 bg-[#24170c] ring-2 ring-white/10 group-hover:ring-[#f5ba42] transition-all duration-300 shadow-lg group-hover:shadow-[0_8px_24px_rgba(245,186,66,0.3)]">
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#2a1d10] to-[#140f07] text-[#f5ba42]">
            <Users className="h-10 w-10 opacity-70" />
          </div>
        )}

        {/* Play Overlay on Hover */}
        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="h-10 w-10 rounded-full bg-[#f5ba42] text-[#140f07] flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="h-4 w-4 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Artist Name & Tag */}
      <p className="font-semibold text-xs sm:text-[13px] leading-tight text-[#faf5ee] group-hover:text-[#f5ba42] transition-colors truncate w-full px-1">
        {name}
      </p>
      <p className="text-[11px] text-[#8c7b68] truncate mt-0.5">
        {category}
      </p>
    </div>
  );
}
