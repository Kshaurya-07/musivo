import React, { useState } from "react";
import {
  Compass,
  Sparkles,
  Radio,
  Play,
  Plus,
  Flame,
  Zap,
  Wand2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { usePlayback, type PlaybackTrack } from "@/contexts/PlaybackContext";
import { formatTime } from "@/lib/musivo";
import { toast } from "sonner";

interface DiscoveryViewProps {
  onSelectArtist: (artistId: string) => void;
  onSelectAlbum: (albumId: string) => void;
}

const DISCOVERY_GENRES = [
  { name: "Electronic & Ambient", query: "electronic ambient music" },
  { name: "Indie Chill", query: "indie chill bedroom pop" },
  { name: "Deep Lo-Fi", query: "lofi hip hop study beats" },
  { name: "Modern R&B", query: "alternative r&b neo soul" },
  { name: "Cinematic Neo-Classical", query: "cinematic neoclassical piano" },
];

export function DiscoveryView({ onSelectArtist, onSelectAlbum }: DiscoveryViewProps) {
  const { playTrack, addToQueue } = usePlayback();
  const [activeMood, setActiveMood] = useState("Electronic & Ambient");

  const discoveryQuery = trpc.music.universalSearch.useQuery(
    { query: activeMood, types: ["track", "album"], limit: 16 },
    { staleTime: 1000 * 60 * 5 }
  );

  const aiMixMutation = trpc.music.createAiMix.useMutation({
    onSuccess: (data) => {
      if (data?.recommendations && data.recommendations.length > 0) {
        const formatted: PlaybackTrack[] = data.recommendations.map((t) => ({
          id: t.id.startsWith("spotify-") ? t.id : `spotify-${t.id}`,
          title: t.title,
          artist: t.artist,
          album: t.album || "AI Discovery",
          duration: t.duration || "3:30",
          art: t.art || "",
          audio: t.audio || "",
          accent: "#f5ba42",
          badge: "AI DISCOVERY",
          storeUrl: t.storeUrl,
          durationMs: t.durationMs ?? 210000,
          source: "spotify",
        }));
        void playTrack(formatted[0], formatted);
        toast.success(`Generated AI Mix with ${formatted.length} tracks!`);
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to generate AI Mix");
    },
  });

  const tracks = discoveryQuery.data?.tracks || [];
  const albums = discoveryQuery.data?.albums || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Header with AI Mix Trigger */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#241a10] via-[#14100c] to-[#0d0a07] p-6 sm:p-10 shadow-2xl">
        <div
          className="pointer-events-none absolute -right-20 -top-20 w-96 h-96 opacity-20 blur-[100px] rounded-full"
          style={{ background: "#f5ba42" }}
        />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#f5ba42]/10 text-[#f5ba42] border border-[#f5ba42]/20">
            <Compass className="w-3.5 h-3.5" />
            <span>Radar & Discovery</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Discover Your Next Obsession
          </h1>

          <p className="text-sm sm:text-base text-[#b2a28f] leading-relaxed">
            Smart algorithmic exploration tuned to your taste. Explore emerging genres, fresh releases, and endless discovery mixes.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                aiMixMutation.mutate({ mood: "Discovery & Chill", count: 10 });
              }}
              disabled={aiMixMutation.isPending}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#f5ba42] text-black font-bold text-sm hover:bg-[#ffc857] transition shadow-lg shadow-[#f5ba42]/20 active:scale-95 disabled:opacity-50"
            >
              <Wand2 className={`w-4 h-4 ${aiMixMutation.isPending ? "animate-spin" : ""}`} />
              <span>{aiMixMutation.isPending ? "Brewing AI Mix..." : "Brew New AI Discovery Mix"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Genre Exploration Chips */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8c7b68]">
          Genre Channels
        </h2>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {DISCOVERY_GENRES.map((g) => {
            const isActive = activeMood === g.name;
            return (
              <button
                key={g.name}
                onClick={() => setActiveMood(g.name)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? "bg-[#f5ba42] text-black shadow-md shadow-[#f5ba42]/20"
                    : "bg-white/[0.04] text-[#b2a28f] hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {g.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Discovery Tracks Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#f5ba42]" />
          <span>Trending in {activeMood}</span>
        </h2>

        {discoveryQuery.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/5" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tracks.map((track) => (
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
                    badge: "DISCOVERY",
                    storeUrl: track.storeUrl,
                    durationMs: track.durationMs,
                    source: track.source,
                  };
                  void playTrack(formatted);
                }}
                className="group flex items-center justify-between p-3 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#f5ba42]/30 transition cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={track.art}
                    alt={track.title}
                    className="w-12 h-12 rounded-xl object-cover shadow-sm shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-[#f5ba42] transition">
                      {track.title}
                    </p>
                    <p className="text-xs text-[#8c7b68] truncate">{track.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToQueue({
                        id: track.id,
                        title: track.title,
                        artist: track.artist,
                        album: track.album,
                        duration: track.durationMs ? formatTime(track.durationMs / 1000) : "3:30",
                        art: track.art,
                        audio: track.audio,
                        accent: track.accent || "#f5ba42",
                        badge: "DISCOVERY",
                        storeUrl: track.storeUrl,
                        durationMs: track.durationMs,
                        source: track.source,
                      });
                    }}
                    className="p-1.5 rounded-full hover:bg-white/10 transition text-[#8c7b68] hover:text-white"
                    title="Add to queue"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <div className="p-2 rounded-full bg-white/[0.06] text-white group-hover:bg-[#f5ba42] group-hover:text-black transition">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Featured Albums Carousel/Grid */}
      {albums.length > 0 && (
        <div className="space-y-4 pt-2">
          <h2 className="text-lg font-bold text-white">Recommended Releases</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {albums.slice(0, 4).map((album) => (
              <div
                key={album.id}
                onClick={() => onSelectAlbum(album.id)}
                className="group cursor-pointer p-3.5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#f5ba42]/30 transition flex flex-col space-y-2.5"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#18130e] shadow-md">
                  <img
                    src={album.images?.[0]?.url}
                    alt={album.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <div className="p-3 rounded-full bg-[#f5ba42] text-black shadow-lg">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-[#f5ba42] transition">
                    {album.name}
                  </h4>
                  <p className="text-xs text-[#8c7b68] line-clamp-1">
                    {album.artists?.[0]?.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
