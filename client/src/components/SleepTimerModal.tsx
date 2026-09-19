import React from "react";
import { Moon, Check, X, Clock } from "lucide-react";
import { usePlayback } from "@/contexts/PlaybackContext";
import { formatTime } from "@/lib/musivo";

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIMER_PRESETS = [
  { minutes: 15, label: "15 minutes" },
  { minutes: 30, label: "30 minutes" },
  { minutes: 45, label: "45 minutes" },
  { minutes: 60, label: "1 hour" },
];

export function SleepTimerModal({ isOpen, onClose }: SleepTimerModalProps) {
  const { sleepTimer, sleepTimerRemainingSec, setSleepTimer } = usePlayback();

  if (!isOpen) return null;

  const handleSelect = (minutes: number) => {
    setSleepTimer(minutes);
    onClose();
  };

  const handleEndOfTrack = () => {
    setSleepTimer(0, true);
    onClose();
  };

  const handleTurnOff = () => {
    setSleepTimer(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[#141416] border border-white/10 p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Sleep Timer</h3>
              <p className="text-xs text-white/50">Fade out & pause automatically</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sleepTimer && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-300 text-sm font-medium">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>
                {sleepTimer.mode === "track_end"
                  ? "Stopping at end of current track"
                  : `Active: ${sleepTimerRemainingSec !== null ? formatTime(sleepTimerRemainingSec) : `${sleepTimer.minutes}m`} left`}
              </span>
            </div>
            <button
              onClick={handleTurnOff}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 hover:underline"
            >
              Turn off
            </button>
          </div>
        )}

        <div className="space-y-1.5">
          {TIMER_PRESETS.map((preset) => {
            const isSelected =
              sleepTimer?.mode === "minutes" && sleepTimer.minutes === preset.minutes;
            return (
              <button
                key={preset.minutes}
                onClick={() => handleSelect(preset.minutes)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isSelected
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "text-white/80 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>{preset.label}</span>
                {isSelected && <Check className="w-4 h-4 text-purple-400" />}
              </button>
            );
          })}

          <button
            onClick={handleEndOfTrack}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              sleepTimer?.mode === "track_end"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "text-white/80 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span>End of track</span>
            {sleepTimer?.mode === "track_end" && <Check className="w-4 h-4 text-purple-400" />}
          </button>

          {sleepTimer && (
            <button
              onClick={handleTurnOff}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-rose-400/90 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
            >
              <span>Turn off timer</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
