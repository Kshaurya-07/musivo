import React, { useEffect } from "react";
import { X, Download, Smartphone, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: string;
  onSelectView: (viewId: string) => void;
  navItems: { id: string; label: string; icon: LucideIcon }[];
  libraryItems: { id: string; label: string; icon: LucideIcon }[];
  isSpotifyConnected: boolean;
  canInstallPwa?: boolean;
  onInstallPwa?: () => void;
}

export function MobileNavDrawer({
  isOpen,
  onClose,
  activeView,
  onSelectView,
  navItems,
  libraryItems,
  isSpotifyConnected,
  canInstallPwa = false,
  onInstallPwa,
}: MobileNavDrawerProps) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Content */}
      <div className="relative flex w-full max-w-[320px] flex-col bg-[#fafafa] dark:bg-[#050505] border-r border-[#e0e0e0] dark:border-[#292929] shadow-2xl p-6 text-[#111111] dark:text-[#ffffff] animate-in slide-in-from-left duration-250 z-10 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-[#e0e0e0] dark:border-[#242424]">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-[#e0e0e0] dark:border-[#292929] bg-[#ffffff] dark:bg-[#151515] shadow-sm">
              <img
                src="/musivo-logo-transparent.png"
                alt="Musivo"
                className="h-6 w-6 object-contain"
              />
            </div>
            <div>
              <span className="block font-display text-[20px] font-bold leading-none tracking-[-0.05em] text-[#111111] dark:text-[#ffffff]">
                musivo<span className="text-[#888888] dark:text-[#ffffff]">.</span>
              </span>
              <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.18em] text-[#777777] dark:text-[#8c8c8c]">
                Monochrome Studio
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl border border-[#e0e0e0] dark:border-[#292929] text-[#555555] dark:text-[#b0b0b0] hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PWA Install Banner */}
        {canInstallPwa && (
          <div className="my-5 rounded-2xl border border-[#e0e0e0] dark:border-[#292929] bg-[#ffffff] dark:bg-[#151515] p-4 shadow-sm">
            <div className="flex items-center gap-2.5 text-[#111111] dark:text-[#ffffff]">
              <Smartphone className="h-4 w-4" />
              <span className="font-display text-xs font-bold uppercase tracking-wider">
                Install Mobile App
              </span>
            </div>
            <p className="mt-1 text-xs text-[#555555] dark:text-[#999999] leading-relaxed">
              Install Musivo for instant home-screen launch and continuous background streaming.
            </p>
            <button
              onClick={() => {
                onInstallPwa?.();
                onClose();
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#000000] dark:bg-[#ffffff] py-2.5 text-xs font-bold text-[#ffffff] dark:text-[#000000] shadow-sm hover:opacity-90 active:scale-[0.98] transition"
            >
              <Download className="h-3.5 w-3.5" /> Install App
            </button>
          </div>
        )}

        {/* Listen Navigation */}
        <div className="mt-6">
          <p className="mb-2 px-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#777777] dark:text-[#888888] font-bold">
            Browse
          </p>
          <nav className="space-y-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  onSelectView(id);
                  onClose();
                }}
                className={`flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-left text-xs sm:text-sm font-medium transition-all ${
                  activeView === id
                    ? "bg-[#000000] dark:bg-[#ffffff] font-semibold text-[#ffffff] dark:text-[#000000] shadow-sm"
                    : "text-[#555555] dark:text-[#b8b8b8] hover:bg-black/5 dark:hover:bg-white/[0.06] hover:text-[#111111] dark:hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Library Navigation */}
        <div className="mt-6">
          <p className="mb-2 px-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#777777] dark:text-[#888888] font-bold">
            Library
          </p>
          <nav className="space-y-1">
            {libraryItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  onSelectView(id);
                  onClose();
                }}
                className={`flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-left text-xs sm:text-sm font-medium transition-all ${
                  activeView === id
                    ? "bg-[#000000] dark:bg-[#ffffff] font-semibold text-[#ffffff] dark:text-[#000000] shadow-sm"
                    : "text-[#555555] dark:text-[#b8b8b8] hover:bg-black/5 dark:hover:bg-white/[0.06] hover:text-[#111111] dark:hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Engine Status Card */}
        <div className="mt-auto pt-6">
          <div className="rounded-2xl border border-[#e0e0e0] dark:border-[#242424] bg-[#ffffff] dark:bg-[#111111] p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#f0f0f0] dark:bg-[#1a1a1a] text-[#111111] dark:text-[#ffffff]">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#777777] dark:text-[#999999]">
                Engine
              </span>
            </div>
            <p className="text-xs font-semibold text-[#111111] dark:text-[#ffffff]">
              {isSpotifyConnected ? "Spotify Web Playback" : "Musivo Engine"}
            </p>
            <p className="mt-1 text-[11px] leading-4 text-[#555555] dark:text-[#888888]">
              {isSpotifyConnected
                ? "Streaming live via Spotify Web SDK with background audio."
                : "Full-length streaming enabled with background playback."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MobileNavDrawer;
