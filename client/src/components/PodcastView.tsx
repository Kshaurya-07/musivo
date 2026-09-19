import React, { useState } from "react";
import {
  Podcast,
  Sparkles,
  Search,
  Bookmark,
  Play,
  Clock,
  Layers,
  Flame,
  Radio,
  ExternalLink,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { usePlayback } from "@/contexts/PlaybackContext";
import { PodcastDetailModal } from "./PodcastDetailModal";

const PODCAST_CATEGORIES = [
  { id: "all", label: "All Podcasts", query: "podcast" },
  { id: "tech", label: "Tech & AI", query: "artificial intelligence tech podcast" },
  { id: "mindset", label: "Mindset & Science", query: "huberman neuro science podcast" },
  { id: "news", label: "News & Society", query: "daily news world podcast" },
  { id: "culture", label: "Comedy & Culture", query: "comedy pop culture podcast" },
  { id: "business", label: "Business & Startups", query: "business investing startup podcast" },
];

export function PodcastView() {
  const { isSpotifyConnected } = usePlayback();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);

  const currentCategory =
    PODCAST_CATEGORIES.find((c) => c.id === activeCategory) || PODCAST_CATEGORIES[0];
  const activeSearch = searchQuery.trim() || currentCategory.query;

  const catalogQuery = trpc.music.universalSearch.useQuery(
    {
      query: activeSearch,
      types: ["show"],
      limit: 10,
    },
    {
      staleTime: 60000,
    }
  );

  const savedShowsQuery = trpc.spotify.savedShows.useQuery(
    { limit: 10 },
    { enabled: isSpotifyConnected }
  );

  const shows = catalogQuery.data?.shows || [];
  const savedShows = savedShowsQuery.data?.items || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-purple-950/40 via-black/50 to-indigo-950/30 border border-white/10 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold tracking-wide uppercase">
            <Radio className="w-3.5 h-3.5" />
            <span>Spoken Word & Thought Leadership</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Podcasts & Episodes
          </h1>
          <p className="text-sm text-white/60">
            Stream full discussions, video conversations, and curated series from Spotify's global
            roster with resume position tracking and sleep timer controls.
          </p>

          {/* Search Input Bar */}
          <div className="relative max-w-md pt-2">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-5" />
            <input
              type="text"
              placeholder="Search shows, hosts, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-white placeholder-white/40 text-sm focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {PODCAST_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id && !searchQuery;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setSearchQuery("");
              }}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-purple-500 text-black shadow-lg shadow-purple-500/20"
                  : "bg-white/5 border border-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Saved Shows (if connected) */}
      {isSpotifyConnected && savedShows.length > 0 && !searchQuery && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-purple-400" />
              <span>Your Followed Shows</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {savedShows.map((show) => (
              <div
                key={show.id}
                onClick={() => setSelectedShowId(show.id)}
                className="group p-3.5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 transition-all cursor-pointer space-y-3"
              >
                <div className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/40 relative shadow-md">
                  <img
                    src={
                      show.images?.[0]?.url ||
                      "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=500&q=80"
                    }
                    alt={show.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="p-3 rounded-full bg-purple-500 text-black shadow-lg">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                    {show.name}
                  </h3>
                  <p className="text-[11px] text-white/50 truncate mt-0.5">{show.publisher}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Curated / Search Results */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <Flame className="w-4 h-4 text-purple-400" />
          <span>{searchQuery ? `Shows for "${searchQuery}"` : currentCategory.label}</span>
        </h2>

        {catalogQuery.isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-white/40">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            <span className="text-sm font-medium">Fetching podcast directory...</span>
          </div>
        ) : shows.length === 0 ? (
          <div className="py-16 rounded-2xl border border-white/5 bg-white/[0.02] text-center text-white/40">
            <p>No podcast shows found matching this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {shows.map((show) => (
              <div
                key={show.id}
                onClick={() => setSelectedShowId(show.id)}
                className="group p-3.5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 transition-all cursor-pointer space-y-3"
              >
                <div className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/40 relative shadow-md">
                  <img
                    src={
                      show.images?.[0]?.url ||
                      "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=500&q=80"
                    }
                    alt={show.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="p-3 rounded-full bg-purple-500 text-black shadow-lg">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                    {show.name}
                  </h3>
                  <p className="text-[11px] text-white/50 truncate mt-0.5">{show.publisher}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Podcast Detail Modal */}
      <PodcastDetailModal
        showId={selectedShowId}
        isOpen={Boolean(selectedShowId)}
        onClose={() => setSelectedShowId(null)}
      />
    </div>
  );
}
