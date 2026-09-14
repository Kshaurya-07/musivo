import React, { useEffect } from "react";
import { X, Download, Smartphone, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Content */}
      <div className="relative flex w-full max-w-[320px] flex-col bg-[#120d08] border-r border-[#f5ba42]/20 shadow-2xl p-6 text-[#faf5ee] animate-in slide-in-from-left duration-250 z-10 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#f5ba42]/30 bg-[#1e150d] shadow-[0_0_20px_rgba(245,186,66,0.25)]">
              <img
                src="/musivo-logo-transparent.png"
                alt="Musivo"
                className="h-7 w-7 object-contain"
              />
            </div>
            <div>
              <span className="block font-display text-[20px] font-bold leading-none tracking-[-0.05em] text-[#faf5ee]">
                musivo<span className="text-[#f5ba42]">.</span>
              </span>
              <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.18em] text-[#8c7b68]">
                Music, Reimagined
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-[#a89885] hover:bg-white/[0.08] hover:text-white"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* PWA Install Banner */}
        {canInstallPwa && (
          <div className="my-5 rounded-2xl border border-[#f5ba42]/30 bg-gradient-to-br from-[#f5ba42]/15 to-[#c88719]/10 p-4">
            <div className="flex items-center gap-2.5 text-[#f5ba42]">
              <Smartphone className="h-4 w-4" />
              <span className="font-display text-xs font-bold uppercase tracking-wider">
                Install Mobile App
              </span>
            </div>
            <p className="mt-1 text-xs text-[#d6c8b6] leading-relaxed">
              Install Musivo for instant home-screen launch and continuous background streaming.
            </p>
            <button
              onClick={() => {
                onInstallPwa?.();
                onClose();
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f5ba42] py-2.5 text-xs font-bold text-[#140f07] shadow-[0_4px_16px_rgba(245,186,66,0.3)] hover:opacity-95 active:scale-[0.98] transition"
            >
              <Download className="h-3.5 w-3.5" /> Install App
            </button>
          </div>
        )}

        {/* Listen Navigation */}
        <div className="mt-6">
          <p className="mb-2 px-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8c7b68]">
            Listen
          </p>
          <nav className="space-y-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  onSelectView(id);
                  onClose();
                }}
                className={`flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-left text-sm font-medium transition-all ${
                  activeView === id
                    ? "bg-[#f5ba42] font-semibold text-[#140f07] shadow-[0_2px_12px_rgba(245,186,66,0.25)]"
                    : "text-[#b2a28f] hover:bg-white/[0.06] hover:text-[#faf5ee]"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Library Navigation */}
        <div className="mt-6">
          <p className="mb-2 px-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8c7b68]">
            Your Library
          </p>
          <nav className="space-y-1">
            {libraryItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  onSelectView(id);
                  onClose();
                }}
                className={`flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-left text-sm font-medium transition-all ${
                  activeView === id
                    ? "bg-white/[0.09] text-[#f5ba42] font-semibold"
                    : "text-[#b2a28f] hover:bg-white/[0.06] hover:text-[#faf5ee]"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Engine Status Card */}
        <div className="mt-auto pt-6">
          <div className="rounded-2xl border border-white/[0.08] bg-[#1a130c] p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#382614] text-[#f5ba42]">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#968572]">
                Engine
              </span>
            </div>
            <p className="text-xs font-semibold text-[#faf5ee]">
              {isSpotifyConnected ? "Spotify Web Playback" : "Musivo Engine"}
            </p>
            <p className="mt-1 text-[11px] leading-4 text-[#9c8c79]">
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
