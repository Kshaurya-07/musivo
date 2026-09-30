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
    glow ? "drop-shadow-[0_0_14px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_0_16px_rgba(255,255,255,0.2)]" : ""
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
      <span className="mt-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#111111] dark:text-[#ffffff]">
        Music, Reimagined
      </span>
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#777777] dark:text-[#888888]">
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
      <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#e0e0e0] dark:border-[#292929] bg-[#ffffff] dark:bg-[#151515] shadow-sm">
        <img
          src="/musivo-logo-transparent.png"
          alt="Musivo"
          className="h-7 w-7 object-contain"
        />
      </div>
      <div>
        <span className="block font-display text-[22px] font-bold leading-none tracking-[-0.05em] text-[#111111] dark:text-[#ffffff]">
          musivo<span className="text-[#888888] dark:text-[#ffffff]">.</span>
        </span>
        {showTagline && (
          <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.2em] text-[#777777] dark:text-[#888888]">
            Music, Reimagined
          </span>
        )}
      </div>
    </div>
  );
}

export default MusivoLogo;
