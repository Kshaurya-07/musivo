import React, { useRef } from "react";
import { Sparkles, ChevronRight } from "lucide-react";

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
  { id: "search", label: "Top Artists" },
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
  const filterScrollRef = useRef<HTMLDivElement>(null);

  const scrollFiltersRight = () => {
    if (filterScrollRef.current) {
      filterScrollRef.current.scrollBy({ left: 160, behavior: "smooth" });
    }
  };

  return (
    <div className={`space-y-3.5 mb-7 sm:mb-9 ${className}`}>
      {/* Top Tab Strip with Surprise Me Button */}
      <div className="flex items-center justify-between gap-3 border-b border-[#e0e0e0] dark:border-[#292929] pb-1 overflow-x-auto hide-scrollbar">
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
                    ? "text-[#111111] dark:text-[#ffffff]"
                    : "text-[#777777] dark:text-[#888888] hover:text-[#111111] dark:hover:text-[#ffffff]"
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 inset-x-0 h-[2.5px] bg-[#000000] dark:bg-[#ffffff] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Minimal Monochrome "Surprise Me" Button */}
        {onSurpriseMe && (
          <button
            type="button"
            onClick={onSurpriseMe}
            className="flex items-center gap-1.5 shrink-0 rounded-full bg-[#000000] dark:bg-[#ffffff] hover:bg-[#222222] dark:hover:bg-[#eaeaea] px-4 py-1.5 text-xs font-bold text-[#ffffff] dark:text-[#000000] shadow-sm hover:scale-105 active:scale-95 transition-all"
            title="Play a surprise track from catalog"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Surprise Me</span>
          </button>
        )}
      </div>

      {/* Secondary Horizontal Pill Scroller (Genre/Vibe Filters) */}
      <div className="relative flex items-center">
        <div
          ref={filterScrollRef}
          className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar flex-1"
        >
          {GENRE_FILTERS.map((filter) => {
            const isSelected = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => onSelectFilter(filter.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold shrink-0 transition-all duration-200 ${
                  isSelected
                    ? "bg-[#000000] dark:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] shadow-sm"
                    : "bg-[#ffffff] dark:bg-[#181818] border border-[#e0e0e0] dark:border-[#242424] text-[#555555] dark:text-[#b8b8b8] hover:border-[#b0b0b0] dark:hover:border-[#363636] hover:text-[#111111] dark:hover:text-white"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={scrollFiltersRight}
          className="hidden sm:flex items-center justify-center h-7 w-7 rounded-full bg-[#ffffff] dark:bg-[#181818] border border-[#e0e0e0] dark:border-[#242424] text-[#777777] dark:text-[#b8b8b8] hover:text-black dark:hover:text-white transition ml-1.5 shrink-0"
          title="Scroll more filters"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
