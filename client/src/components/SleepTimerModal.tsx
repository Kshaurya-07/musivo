import React from "react";
import { Moon, Clock, X, Check, PowerOff } from "lucide-react";
import { usePlayback } from "@/contexts/PlaybackContext";
import { formatTime } from "@/lib/musivo";

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SleepTimerModal({ isOpen, onClose }: SleepTimerModalProps) {
  const {
    sleepTimerMinutes,
    sleepTimerMode,
    sleepTimerRemainingSec,
    startSleepTimer,
    stopSleepTimer,
  } = usePlayback();

  if (!isOpen) return null;

  const presets = [
    { label: "5 minutes", value: 5 },
    { label: "10 minutes", value: 10 },
    { label: "15 minutes", value: 15 },
    { label: "30 minutes", value: 30 },
    { label: "45 minutes", value: 45 },
    { label: "60 minutes", value: 60 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#120e0b]/95 p-6 shadow-2xl backdrop-blur-xl text-[#faf5ee] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#f5ba42]/10 text-[#f5ba42]">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-white">Sleep Timer</h3>
              <p className="text-xs text-[#8c7b68]">Fade out audio as you sleep</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8c7b68] hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Timer Status */}
        {sleepTimerMode && (
          <div className="mt-4 p-3.5 rounded-2xl bg-[#f5ba42]/10 border border-[#f5ba42]/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-[#f5ba42]">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>
                {sleepTimerMode === "end_of_track"
                  ? "Pauses at end of current track"
                  : `${formatTime(sleepTimerRemainingSec || 0)} remaining`}
              </span>
            </div>
            <button
              onClick={() => {
                stopSleepTimer();
              }}
              className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[#f5ba42]/20 text-[#f5ba42] hover:bg-[#f5ba42]/30 transition"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Preset Options */}
        <div className="mt-4 space-y-2">
          {presets.map((preset) => {
            const isSelected =
              sleepTimerMode === "time" && sleepTimerMinutes === preset.value;
            return (
              <button
                key={preset.value}
                onClick={() => {
                  startSleepTimer(preset.value);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition ${
                  isSelected
                    ? "bg-[#f5ba42] text-black font-semibold shadow-md shadow-[#f5ba42]/20"
                    : "bg-white/[0.04] text-[#d6c7b2] hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                <span>{preset.label}</span>
                {isSelected && <Check className="w-4 h-4" />}
              </button>
            );
          })}

          {/* End of Track Option */}
          <button
            onClick={() => {
              startSleepTimer("end_of_track");
              onClose();
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition ${
              sleepTimerMode === "end_of_track"
                ? "bg-[#f5ba42] text-black font-semibold shadow-md shadow-[#f5ba42]/20"
                : "bg-white/[0.04] text-[#d6c7b2] hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            <span>End of this track / episode</span>
            {sleepTimerMode === "end_of_track" && <Check className="w-4 h-4" />}
          </button>
        </div>

        {/* Turn Off Button */}
        {sleepTimerMode && (
          <div className="mt-5 pt-3 border-t border-white/5">
            <button
              onClick={() => {
                stopSleepTimer();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium text-red-400/90 bg-red-500/10 hover:bg-red-500/15 transition"
            >
              <PowerOff className="w-4 h-4" />
              Turn off timer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
