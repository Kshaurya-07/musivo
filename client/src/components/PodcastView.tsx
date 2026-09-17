import React, { useState } from "react";
import {
  Mic,
  Sparkles,
  TrendingUp,
  Cpu,
  ShieldAlert,
  Smile,
  Newspaper,
  Briefcase,
  Play,
  Bookmark,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { usePlayback } from "@/contexts/PlaybackContext";

interface PodcastViewProps {
  onSelectShow: (showId: string) => void;
}

const PODCAST_CATEGORIES = [
  { id: "all", label: "All Podcasts", query: "podcast top" },
  { id: "tech", label: "Tech & AI", query: "technology artificial intelligence podcast" },
  { id: "crime", label: "True Crime", query: "true crime podcast" },
  { id: "comedy", label: "Comedy", query: "comedy talk show podcast" },
  { id: "news", label: "News & Daily", query: "daily news podcast" },
  { id: "business", label: "Business", query: "business startup leadership podcast" },
];

export function PodcastView({ onSelectShow }: PodcastViewProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const { isSpotifyConnected } = usePlayback();

  const currentQuery =
    PODCAST_CATEGORIES.find((c) => c.id === activeCategory)?.query || "podcast top";

  const podcastSearchQuery = trpc.music.universalSearch.useQuery(
    { query: currentQuery, types: ["show"], limit: 24 },
    { staleTime: 1000 * 60 * 5 }
  );

  const savedShowsQuery = trpc.spotify.savedShows.useQuery(undefined, {
    enabled: isSpotifyConnected,
  });

  const shows = podcastSearchQuery.data?.shows || [];
  const savedShows = savedShowsQuery.data?.items || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#241a10] via-[#14100c] to-[#0d0a07] p-6 sm:p-10 shadow-2xl">
        <div
          className="pointer-events-none absolute -right-20 -bottom-20 w-96 h-96 opacity-20 blur-[100px] rounded-full"
          style={{ background: "#f5ba42" }}
        />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#f5ba42]/10 text-[#f5ba42] border border-[#f5ba42]/20">
            <Mic className="w-3.5 h-3.5" />
            <span>Spoken Audio & Shows</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Podcasts & Stories
          </h1>

          <p className="text-sm sm:text-base text-[#b2a28f] leading-relaxed">
            Discover deep-dive interviews, cutting-edge tech debates, captivating true crime, and audio experiences from the world's best creators.
          </p>
        </div>
      </div>

      {/* Saved Shows Section (if user has any saved) */}
      {isSpotifyConnected && savedShows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[#f5ba42]" />
              <span>Your Followed Shows</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {savedShows.map((show) => (
              <div
                key={show.id}
                onClick={() => onSelectShow(show.id)}
                className="group cursor-pointer rounded-2xl p-3 border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#f5ba42]/30 transition duration-200 flex flex-col space-y-2.5"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#18130e] shadow-md">
                  <img
                    src={
                      show.images?.[0]?.url ||
                      "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=300&q=80"
                    }
                    alt={show.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <div className="p-3 rounded-full bg-[#f5ba42] text-black shadow-lg transform group-hover:scale-110 transition">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-[#f5ba42] transition">
                    {show.name}
                  </h3>
                  <p className="text-xs text-[#8c7b68] line-clamp-1">
                    {show.publisher}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {PODCAST_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? "bg-[#f5ba42] text-black shadow-md shadow-[#f5ba42]/20"
                  : "bg-white/[0.05] text-[#b2a28f] hover:bg-white/[0.09] hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Shows Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          {PODCAST_CATEGORIES.find((c) => c.id === activeCategory)?.label || "Trending Shows"}
        </h2>

        {podcastSearchQuery.isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-3 border border-white/5 bg-white/[0.02] animate-pulse space-y-3">
                <div className="aspect-square w-full rounded-xl bg-white/5" />
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : shows.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {shows.map((show) => (
              <div
                key={show.id}
                onClick={() => onSelectShow(show.id)}
                className="group cursor-pointer rounded-2xl p-3.5 border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#f5ba42]/30 transition duration-200 flex flex-col space-y-3"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#18130e] shadow-md">
                  <img
                    src={
                      show.images?.[0]?.url ||
                      "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=300&q=80"
                    }
                    alt={show.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <div className="p-3 rounded-full bg-[#f5ba42] text-black shadow-lg transform group-hover:scale-110 transition">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1 flex-1">
                  <h3 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-[#f5ba42] transition">
                    {show.name}
                  </h3>
                  <p className="text-xs text-[#8c7b68] line-clamp-1">
                    {show.publisher}
                  </p>
                  <p className="text-[11px] text-[#6e5f50] line-clamp-2 leading-relaxed pt-0.5">
                    {show.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-[#8c7b68] text-sm">
            No podcasts found in this category right now.
          </div>
        )}
      </div>
    </div>
  );
}
