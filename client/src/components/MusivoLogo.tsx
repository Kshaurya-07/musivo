import React from "react";

interface MusivoLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  glow?: boolean;
  alt?: string;
}

export function MusivoLogo({
  className = "",
  size = "md",
  showTagline = false,
  glow = true,
  alt = "Musivo Logo",
}: MusivoLogoProps) {
  const sizeMap = {
    sm: "h-7 w-7",
    md: "h-10 w-10",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  };

  const imgClass = `${sizeMap[size] || ""} ${
    glow ? "drop-shadow-[0_0_20px_rgba(245,186,66,0.3)]" : ""
  } object-contain transition-transform duration-300 hover:scale-105 ${className}`;

  if (!showTagline) {
    return (
      <img
        src="/musivo-logo-transparent.png"
        alt={alt}
        className={imgClass}
      />
    );
  }

  return (
    <div className="flex flex-col items-center text-center">
      <img
        src="/musivo-logo-transparent.png"
        alt={alt}
        className={imgClass}
      />
      <span className="mt-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#faf5ee]">
        Music, Reimagined
      </span>
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#8c7b68]">
        Since 2026
      </span>
    </div>
  );
}

/**
 * Clean inline brand badge pairing the logo emblem with the brand wordmark
 */
export function MusivoBrandBadge({
  className = "",
  showTagline = true,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#f5ba42]/30 bg-[#16100a] shadow-[0_0_20px_rgba(245,186,66,0.2)]">
        <img
          src="/musivo-logo-transparent.png"
          alt="Musivo"
          className="h-8 w-8 object-contain"
        />
      </div>
      <div>
        <span className="block font-display text-[22px] font-bold leading-none tracking-[-0.05em] text-[#faf5ee]">
          musivo<span className="text-[#f5ba42]">.</span>
        </span>
        {showTagline && (
          <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.2em] text-[#8c7b68]">
            Music, Reimagined
          </span>
        )}
      </div>
    </div>
  );
}

export default MusivoLogo;
