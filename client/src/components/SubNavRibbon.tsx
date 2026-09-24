import React from "react";
import { Sparkles, Dices, ChevronRight } from "lucide-react";

interface SubNavRibbonProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  activeFilter: string;
  onSelectFilter: (filterId: string) => void;
  onSurpriseMe?: () => void;
  className?: string;
}

export const SUB_NAV_TABS = [
  { id: "home", label: "For You" },
  { id: "releases", label: "New Releases" },
  { id: "discover", label: "Charts" },
  { id: "playlists", label: "Top Playlists" },
  { id: "podcasts", label: "Podcasts" },
  { id: "aimix", label: "AI Mix" },
];

export const GENRE_FILTERS = [
  { id: "all", label: "All" },
  { id: "pop", label: "Pop Hits" },
  { id: "lofi", label: "Lo-Fi & Chill" },
  { id: "electronic", label: "Electronic & Dance" },
  { id: "indie", label: "Indie & Alternative" },
  { id: "rock", label: "Rock Anthems" },
  { id: "acoustic", label: "Acoustic & Folk" },
  { id: "focus", label: "Focus & Flow" },
  { id: "ambient", label: "Ambient Sleep" },
];

export function SubNavRibbon({
  activeTab,
  onSelectTab,
  activeFilter,
  onSelectFilter,
  onSurpriseMe,
  className = "",
}: SubNavRibbonProps) {
  return (
    <div className={`space-y-3.5 mb-7 sm:mb-9 ${className}`}>
      {/* Top Tab Strip with Surprise Me Button */}
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-1 overflow-x-auto hide-scrollbar">
        <nav className="flex items-center gap-6 sm:gap-8 min-w-max">
          {SUB_NAV_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`relative pb-3 text-xs sm:text-sm font-semibold transition-colors duration-200 ${
                  isActive
                    ? "text-[#faf5ee]"
                    : "text-[#8c7b68] hover:text-[#d6c8b6]"
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 inset-x-0 h-[2.5px] bg-[#f5ba42] rounded-full shadow-[0_0_12px_rgba(245,186,66,0.6)]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* JioSaavn-style "Surprise Me" Button */}
        {onSurpriseMe && (
          <button
            type="button"
            onClick={onSurpriseMe}
            className="flex items-center gap-1.5 shrink-0 rounded-full bg-gradient-to-r from-[#f5ba42] to-[#ffd064] hover:opacity-95 px-3.5 py-1.5 text-xs font-bold text-[#140f07] shadow-md shadow-[#f5ba42]/20 hover:scale-105 active:scale-95 transition-all"
            title="Play a surprise track from catalog"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Surprise Me</span>
          </button>
        )}
      </div>

      {/* Secondary Horizontal Pill Scroller (Genre/Vibe Filters) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {GENRE_FILTERS.map((filter) => {
          const isSelected = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onSelectFilter(filter.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold shrink-0 transition-all duration-200 ${
                isSelected
                  ? "bg-[#f5ba42] text-[#140f07] shadow-md shadow-[#f5ba42]/20"
                  : "bg-white/[0.05] text-[#bdafa0] hover:bg-white/[0.1] hover:text-white"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
