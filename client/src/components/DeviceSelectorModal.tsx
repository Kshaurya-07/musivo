import React, { useState } from "react";
import {
  Laptop,
  Smartphone,
  Speaker,
  Tv,
  RefreshCw,
  X,
  Volume2,
  CheckCircle2,
  Radio,
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
  const { isSpotifyConnected, connectSpotify, deviceId: currentWebDeviceId } = usePlayback();
  const trpcUtils = trpc.useUtils();

  const devicesQuery = trpc.spotify.getDevices.useQuery(undefined, {
    enabled: isOpen && isSpotifyConnected,
    refetchInterval: isOpen ? 5000 : false,
  });

  const transferMutation = trpc.spotify.transferPlayback.useMutation({
    onSuccess: () => {
      toast.success("Playback transferred");
      void devicesQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to switch playback device");
    },
  });

  if (!isOpen) return null;

  const getDeviceIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("computer")) return <Laptop className="w-5 h-5 text-emerald-400" />;
    if (t.includes("phone") || t.includes("smartphone"))
      return <Smartphone className="w-5 h-5 text-emerald-400" />;
    if (t.includes("tv")) return <Tv className="w-5 h-5 text-emerald-400" />;
    return <Speaker className="w-5 h-5 text-emerald-400" />;
  };

  const handleTransfer = async (deviceId: string) => {
    if (!deviceId) return;
    await transferMutation.mutateAsync({ deviceId, play: true });
  };

  const devices = devicesQuery.data || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#141416] border border-white/10 p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Connect a device</h3>
              <p className="text-xs text-white/50">Listen anywhere via Spotify Connect</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isSpotifyConnected && (
              <button
                onClick={() => void devicesQuery.refetch()}
                disabled={devicesQuery.isFetching}
                className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors disabled:opacity-40"
                title="Refresh devices"
              >
                <RefreshCw
                  className={`w-4 h-4 ${devicesQuery.isFetching ? "animate-spin" : ""}`}
                />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isSpotifyConnected ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 text-center space-y-3">
            <p className="text-sm text-white/70">
              Connect your Spotify account to cast and manage playback across your phones, speakers,
              and laptops.
            </p>
            <button
              onClick={connectSpotify}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-full text-xs transition-colors inline-flex items-center gap-2"
            >
              <span>Connect Spotify</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : devicesQuery.isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-white/40 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
            <span>Searching for available devices...</span>
          </div>
        ) : devices.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center space-y-2">
            <Speaker className="w-8 h-8 text-white/30 mx-auto" />
            <h4 className="text-sm font-semibold text-white/80">No active devices found</h4>
            <p className="text-xs text-white/50">
              Open Spotify on your phone, tablet, or smart speaker on the same network to listen
              seamlessly.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {devices.map((device) => {
              const isCurrent = Boolean(device.isActive);
              const isWebSdk = device.id === currentWebDeviceId;

              return (
                <button
                  key={device.id || device.name}
                  onClick={() => device.id && handleTransfer(device.id)}
                  disabled={transferMutation.isPending || isCurrent}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                    isCurrent
                      ? "bg-emerald-500/15 border-emerald-500/30 text-white"
                      : "border-white/5 bg-white/[0.02] hover:bg-white/[0.06] text-white/80 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-black/40 border border-white/5 shrink-0">
                      {getDeviceIcon(device.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{device.name}</span>
                        {isWebSdk && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                            Web Player
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <span>{device.type}</span>
                        {typeof device.volumePercent === "number" && (
                          <span className="flex items-center gap-1">
                            • <Volume2 className="w-3 h-3" /> {device.volumePercent}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isCurrent ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Listening on</span>
                    </div>
                  ) : (
                    <span className="text-xs text-white/40 group-hover:text-white/80 shrink-0">
                      Tap to switch
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="text-[11px] text-white/40 text-center">
          Spotify Connect streams directly to your hardware speakers and devices with lossless quality.
        </div>
      </div>
    </div>
  );
}
