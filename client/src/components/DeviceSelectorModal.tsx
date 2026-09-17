import React from "react";
import {
  Laptop,
  Smartphone,
  Speaker,
  Tv,
  X,
  Check,
  RefreshCw,
  Radio,
  Volume2,
  ExternalLink,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { usePlayback } from "@/contexts/PlaybackContext";
import { toast } from "sonner";

interface DeviceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeviceSelectorModal({ isOpen, onClose }: DeviceSelectorModalProps) {
  const { deviceId: currentSdkDeviceId, isSpotifyConnected, connectSpotify } = usePlayback();
  const trpcUtils = trpc.useUtils();

  const devicesQuery = trpc.spotify.getDevices.useQuery(undefined, {
    enabled: isOpen && isSpotifyConnected,
    refetchInterval: isOpen ? 5000 : false,
  });

  const transferMutation = trpc.spotify.transferPlayback.useMutation({
    onSuccess: () => {
      toast.success("Playback transferred successfully");
      void trpcUtils.spotify.getDevices.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to transfer playback");
    },
  });

  if (!isOpen) return null;

  const devices = devicesQuery.data || [];

  const getDeviceIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("smartphone") || t.includes("phone")) {
      return <Smartphone className="w-5 h-5" />;
    }
    if (t.includes("computer") || t.includes("laptop")) {
      return <Laptop className="w-5 h-5" />;
    }
    if (t.includes("tv") || t.includes("cast")) {
      return <Tv className="w-5 h-5" />;
    }
    return <Speaker className="w-5 h-5" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#120e0b]/95 p-6 shadow-2xl backdrop-blur-xl text-[#faf5ee] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#f5ba42]/10 text-[#f5ba42]">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-white">Connect to a Device</h3>
              <p className="text-xs text-[#8c7b68]">Stream audio via Spotify Connect</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => void devicesQuery.refetch()}
              disabled={devicesQuery.isFetching}
              className="p-1.5 rounded-full text-[#8c7b68] hover:text-white hover:bg-white/10 transition disabled:opacity-50"
              title="Refresh devices"
            >
              <RefreshCw className={`w-4 h-4 ${devicesQuery.isFetching ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[#8c7b68] hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Not connected to Spotify banner */}
        {!isSpotifyConnected ? (
          <div className="mt-5 p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-3">
            <p className="text-sm text-[#d6c7b2]">
              Connect your Spotify Premium account to control and switch playback between your phone, computer, and smart speakers.
            </p>
            <button
              onClick={() => {
                connectSpotify();
                onClose();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f5ba42] text-black font-semibold text-sm hover:bg-[#ffc857] transition shadow-md shadow-[#f5ba42]/20"
            >
              <ExternalLink className="w-4 h-4" />
              Connect Spotify
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-2 max-h-80 overflow-y-auto pr-1">
            {/* Current Web Player Device (if registered) */}
            <div
              className={`p-4 rounded-2xl border transition flex items-center justify-between ${
                currentSdkDeviceId && devices.some((d) => d.id === currentSdkDeviceId && d.isActive)
                  ? "bg-[#f5ba42]/10 border-[#f5ba42]/30 text-white"
                  : "bg-white/[0.03] border-white/5 text-[#d6c7b2]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/[0.06] text-[#f5ba42]">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">Musivo Web Player</span>
                    {currentSdkDeviceId && devices.some((d) => d.id === currentSdkDeviceId && d.isActive) && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#f5ba42] text-black">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#8c7b68]">This browser tab</p>
                </div>
              </div>
              {currentSdkDeviceId && devices.some((d) => d.id === currentSdkDeviceId && d.isActive) && (
                <div className="flex items-center gap-1.5 text-[#f5ba42]">
                  <Volume2 className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* List of Available Spotify Connect Devices */}
            {devices.map((device) => {
              if (device.id === currentSdkDeviceId) return null; // Already rendered above
              const isSelected = device.isActive;

              return (
                <button
                  key={device.id || device.name}
                  onClick={() => {
                    if (device.id && !isSelected) {
                      transferMutation.mutate({ deviceId: device.id, play: true });
                    }
                  }}
                  disabled={transferMutation.isPending}
                  className={`w-full text-left p-4 rounded-2xl border transition flex items-center justify-between group ${
                    isSelected
                      ? "bg-[#f5ba42]/10 border-[#f5ba42]/30 text-white"
                      : "bg-white/[0.03] border-white/5 text-[#d6c7b2] hover:bg-white/[0.06] hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl transition ${
                        isSelected
                          ? "bg-[#f5ba42] text-black"
                          : "bg-white/[0.06] text-[#8c7b68] group-hover:text-white"
                      }`}
                    >
                      {getDeviceIcon(device.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{device.name}</span>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#f5ba42] text-black">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8c7b68]">
                        {device.type} {device.volumePercent !== null ? `• ${device.volumePercent}% vol` : ""}
                      </p>
                    </div>
                  </div>

                  {isSelected ? (
                    <Check className="w-4 h-4 text-[#f5ba42]" />
                  ) : (
                    <span className="text-xs text-[#8c7b68] opacity-0 group-hover:opacity-100 transition">
                      Tap to play here
                    </span>
                  )}
                </button>
              );
            })}

            {devices.length === 0 && !devicesQuery.isLoading && (
              <div className="py-8 text-center text-[#8c7b68] text-sm space-y-1">
                <p>No external Spotify Connect devices found nearby.</p>
                <p className="text-xs text-[#6e5f50]">
                  Open Spotify on your phone, smart speaker, or computer to stream seamlessly.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-[#8c7b68]">
          <span>Official Spotify Connect protocol</span>
          <span>Zero latency sync</span>
        </div>
      </div>
    </div>
  );
}
