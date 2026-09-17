import React from "react";
import { Home, Search, Compass, Podcast, Library } from "lucide-react";

interface BottomNavBarProps {
  activeView: string;
  onSelectView: (viewId: string) => void;
  likedCount?: number;
}

export function BottomNavBar({
  activeView,
  onSelectView,
  likedCount = 0,
}: BottomNavBarProps) {
  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "search", label: "Search", icon: Search },
    { id: "podcasts", label: "Podcasts", icon: Podcast },
    { id: "discover", label: "Discover", icon: Compass },
    { id: "library", label: "Library", icon: Library, badge: likedCount > 0 ? String(likedCount) : undefined },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#0d0a07]/95 px-3 pt-1.5 backdrop-blur-2xl lg:hidden safe-area-pb"
      style={{ minHeight: "var(--bottom-nav-height)" }}
    >
      <div className="mx-auto flex max-w-md items-center justify-around">
        {tabs.map(({ id, label, icon: Icon, badge }) => {
          const isActive = activeView === id;
          return (
            <button
              key={id}
              onClick={() => onSelectView(id)}
              className={`group relative flex flex-1 flex-col items-center justify-center min-h-[44px] py-1 transition-all ${
                isActive
                  ? "text-[#f5ba42]"
                  : "text-[#8c7b68] hover:text-[#d6c8b6]"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`h-5 w-5 transition-transform duration-200 ${
                    isActive ? "scale-110 drop-shadow-[0_0_10px_rgba(245,186,66,0.4)]" : "group-hover:scale-105"
                  }`}
                />
                {badge && (
                  <span className="absolute -right-2 -top-1 grid h-3.5 min-w-[14px] place-items-center rounded-full bg-[#f5ba42] px-1 text-[9px] font-bold text-[#140f07]">
                    {badge}
                  </span>
                )}
              </div>
              <span
                className={`mt-1 text-[10px] font-medium tracking-tight transition-colors ${
                  isActive ? "font-semibold text-[#faf5ee]" : ""
                }`}
              >
                {label}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 h-0.5 w-4 rounded-full bg-[#f5ba42] shadow-[0_0_8px_rgba(245,186,66,0.6)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNavBar;
