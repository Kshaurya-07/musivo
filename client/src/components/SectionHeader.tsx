import React from "react";
import { ChevronRight } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
  children?: React.ReactNode;
}

export function SectionHeader({
  title,
  eyebrow,
  subtitle,
  action,
  onAction,
  children,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 mb-4">
      <div className="min-w-0 text-left">
        {eyebrow && (
          <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-[#777777] dark:text-[#9a9a9a] font-semibold mb-1">
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-xl sm:text-2xl lg:text-[26px] font-bold text-[#111111] dark:text-[#ffffff] tracking-tight truncate">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-[#555555] dark:text-[#b8b8b8] mt-0.5 truncate max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
        {children}
        {action && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="group inline-flex items-center gap-1 text-xs font-bold text-[#555555] dark:text-[#c2c2c2] hover:text-[#000000] dark:hover:text-[#ffffff] transition-colors py-1 px-2.5 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
          >
            <span>{action}</span>
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 text-[#777777] dark:text-[#9a9a9a] group-hover:text-black dark:group-hover:text-white" />
          </button>
        )}
      </div>
    </div>
  );
}
