import React from "react";
import {
  User,
  Radio,
  ExternalLink,
  Flame,
  CheckCircle2,
  Sliders,
  LogOut,
  Sparkles,
  ShieldCheck,
  Disc3,
  Moon,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { usePlayback, type PlaybackTrack } from "@/contexts/PlaybackContext";
import { formatTime } from "@/lib/musivo";
import { toast } from "sonner";

interface ProfileViewProps {
  onSelectArtist: (artistId: string) => void;
  onOpenSleepTimer: () => void;
}

export function ProfileView({ onSelectArtist, onOpenSleepTimer }: ProfileViewProps) {
  const { user, logout } = useAuth();
  const {
    isSpotifyConnected,
    connectSpotify,
    autoContinueQueue,
    setAutoContinueQueue,
    playTrack,
  } = usePlayback();

  const trpcUtils = trpc.useUtils();

  const spotifyStatus = trpc.spotify.status.useQuery(undefined, {
    enabled: Boolean(user),
  });

  const disconnectMutation = trpc.spotify.disconnect.useMutation({
    onSuccess: () => {
      toast.success("Spotify disconnected successfully");
      void trpcUtils.spotify.status.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to disconnect Spotify");
    },
  });

  const topTracksQuery = trpc.spotify.userTopTracks.useQuery(
    { timeRange: "medium_term", limit: 6 },
    { enabled: isSpotifyConnected }
  );

  const topArtistsQuery = trpc.spotify.userTopArtists.useQuery(
    { timeRange: "medium_term", limit: 6 },
    { enabled: isSpotifyConnected }
  );

  const topTracks = topTracksQuery.data || [];
  const topArtists = topArtistsQuery.data || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Profile Card */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#241a10] via-[#14100c] to-[#0d0a07] p-6 sm:p-8 shadow-2xl">
        <div
          className="pointer-events-none absolute -right-20 -top-20 w-80 h-80 opacity-20 blur-[100px] rounded-full"
          style={{ background: "#f5ba42" }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden shadow-2xl border-2 border-[#f5ba42]/40 bg-[#18130e] shrink-0">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/5 text-[#f5ba42]">
                <User className="w-12 h-12" />
              </div>
            )}
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {user?.name || "Musivo Listener"}
              </h1>
              {user?.role === "admin" && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#f5ba42] text-black font-bold">
                  Admin
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-[#8c7b68]">
              {user?.email || "Signed in with personal account"}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              {isSpotifyConnected ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Spotify Connected: {spotifyStatus.data?.displayName || "Active"}</span>
                </div>
              ) : (
                <button
                  onClick={connectSpotify}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-[#f5ba42] text-black hover:bg-[#ffc857] transition shadow-md shadow-[#f5ba42]/20"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Link Spotify Account</span>
                </button>
              )}

              {isSpotifyConnected && (
                <button
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                  className="px-3 py-1 rounded-full text-xs text-[#8c7b68] hover:text-red-400 hover:bg-red-500/10 transition"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-xl bg-white/[0.04] text-[#8c7b68] hover:text-white hover:bg-white/[0.08] transition text-xs flex items-center gap-1.5 self-center sm:self-start"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Preferences & Playback Settings */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8c7b68] flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#f5ba42]" />
          <span>Playback & Audio Settings</span>
        </h2>

        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
          {/* Smart Queue Continuation Toggle */}
          <div className="flex items-center justify-between py-1">
            <div className="space-y-0.5 max-w-md">
              <h3 className="text-sm font-semibold text-white">Smart Queue Auto-Continuation</h3>
              <p className="text-xs text-[#8c7b68]">
                Automatically discovers and adds fresh, unheard tracks when your queue ends so music never stops.
              </p>
            </div>
            <button
              onClick={() => {
                setAutoContinueQueue(!autoContinueQueue);
                toast.success(
                  !autoContinueQueue
                    ? "Smart Queue auto-continuation enabled"
                    : "Smart Queue auto-continuation disabled"
                );
              }}
              className="text-[#f5ba42] p-1"
            >
              {autoContinueQueue ? (
                <ToggleRight className="w-8 h-8" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-[#8c7b68]" />
              )}
            </button>
          </div>

          <div className="border-t border-white/5 pt-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-white">Audio Streaming Quality</h3>
              <p className="text-xs text-[#8c7b68]">High fidelity 320 kbps AAC stream</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#f5ba42]/10 text-[#f5ba42] border border-[#f5ba42]/20">
              HIGH FIDELITY
            </span>
          </div>

          <div className="border-t border-white/5 pt-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-white">Sleep Timer</h3>
              <p className="text-xs text-[#8c7b68]">Configure automatic playback pause</p>
            </div>
            <button
              onClick={onOpenSleepTimer}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.06] text-white text-xs font-medium hover:bg-white/[0.12] transition"
            >
              <Moon className="w-3.5 h-3.5 text-[#f5ba42]" />
              <span>Configure Timer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Tracks of the Month (Spotify Insights) */}
      {isSpotifyConnected && topTracks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8c7b68] flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#f5ba42]" />
            <span>Your Top Tracks This Month</span>
          </h2>

          <div className="space-y-1.5">
            {topTracks.map((track, idx) => (
              <div
                key={track.id}
                onClick={() => {
                  const formatted: PlaybackTrack = {
                    id: track.id,
                    title: track.title,
                    artist: track.artist,
                    album: track.album,
                    duration: track.durationMs ? formatTime(track.durationMs / 1000) : "3:30",
                    art: track.art,
                    audio: track.audio,
                    accent: track.accent || "#f5ba42",
                    badge: "TOP TRACK",
                    storeUrl: track.storeUrl,
                    durationMs: track.durationMs,
                    source: track.source,
                  };
                  void playTrack(formatted);
                }}
                className="group flex items-center justify-between p-3 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer transition"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="w-4 text-center text-xs font-mono text-[#8c7b68]">
                    {idx + 1}
                  </span>
                  <img
                    src={track.art}
                    alt={track.title}
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-[#f5ba42] transition">
                      {track.title}
                    </p>
                    <p className="text-xs text-[#8c7b68] truncate">{track.artist}</p>
                  </div>
                </div>

                <span className="text-xs font-mono text-[#8c7b68]">
                  {track.durationMs ? formatTime(track.durationMs / 1000) : "3:30"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Artists of the Month */}
      {isSpotifyConnected && topArtists.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8c7b68] flex items-center gap-2">
            <Disc3 className="w-4 h-4 text-[#f5ba42]" />
            <span>Your Top Artists</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {topArtists.map((artist) => (
              <div
                key={artist.id}
                onClick={() => onSelectArtist(artist.id)}
                className="group cursor-pointer p-3.5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#f5ba42]/30 transition text-center space-y-2.5 flex flex-col items-center"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg border border-white/10 group-hover:border-[#f5ba42] transition">
                  <img
                    src={
                      artist.images?.[0]?.url ||
                      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80"
                    }
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xs font-semibold text-white line-clamp-1 group-hover:text-[#f5ba42] transition">
                  {artist.name}
                </h3>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
