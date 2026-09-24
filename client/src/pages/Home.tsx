import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  Album,
  ArrowRight,
  BarChart3,
  Brain,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Loader2,
  Compass,
  Disc3,
  Download,
  Headphones,
  Heart,
  History,
  Home as HomeIcon,
  Layers,
  Laptop,
  ListMusic,
  ListPlus,
  Link2,
  Maximize2,
  Menu,
  Moon,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Podcast,
  Radio,
  Repeat1,
  Repeat2,
  RefreshCw,
  Search,
  Settings2,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
  Trash2,
  Unlink,
  Volume2,
  VolumeX,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { formatTime, matchesTrackQuery } from "@/lib/musivo";
import { MobileNavDrawer } from "@/components/MobileNavDrawer";
import { BottomNavBar } from "@/components/BottomNavBar";
import { NowPlayingModal } from "@/components/NowPlayingModal";
import { UniversalSearch } from "@/components/UniversalSearch";
import { PodcastView } from "@/components/PodcastView";
import { ListeningStatsView } from "@/components/ListeningStatsView";
import { ArtistDetailModal } from "@/components/ArtistDetailModal";
import { AlbumDetailModal } from "@/components/AlbumDetailModal";
import { SleepTimerModal } from "@/components/SleepTimerModal";
import { DeviceSelectorModal } from "@/components/DeviceSelectorModal";
import { SectionHeader } from "@/components/SectionHeader";
import { MusicCard } from "@/components/MusicCard";
import { ArtistCard } from "@/components/ArtistCard";
import { QuickAccessCard } from "@/components/QuickAccessCard";
import { ChartBannerCard } from "@/components/ChartBannerCard";
import { SubNavRibbon } from "@/components/SubNavRibbon";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  usePlayback,
  PlaybackTrack as Track,
  PlaybackMode,
} from "@/contexts/PlaybackContext";
import { SpotifyConnectionState } from "@/hooks/useSpotifyPlayer";

type NavItem = { id: string; label: string; icon: LucideIcon };

const art = {
  neon: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=85",
  purple: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=85",
  sunset: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=85",
  blue: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=85",
  red: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=900&q=85",
  cream: "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=85",
  night: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=85",
};

const fallbackTracks: Track[] = [
  { id: "fallback-1", title: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming", duration: "4:03", art: art.neon, audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", accent: "#f5ba42", badge: "MADE FOR YOU", durationMs: 243000, source: "fallback" },
  { id: "fallback-2", title: "Still Feel.", artist: "half·alive", album: "Now, Not Yet", duration: "2:47", art: art.purple, audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", accent: "#b497ff", badge: "TRENDING", durationMs: 167000, source: "fallback" },
  { id: "fallback-3", title: "Sunset Lover", artist: "Petit Biscuit", album: "Presence", duration: "3:58", art: art.sunset, audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", accent: "#ffb247", badge: "NEW", durationMs: 238000, source: "fallback" },
  { id: "fallback-4", title: "A Moment Apart", artist: "ODESZA", album: "A Moment Apart", duration: "3:54", art: art.blue, audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", accent: "#63c5ff", durationMs: 234000, source: "fallback" },
  { id: "fallback-5", title: "The Less I Know The Better", artist: "Tame Impala", album: "Currents", duration: "3:36", art: art.red, audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", accent: "#ff725d", durationMs: 216000, source: "fallback" },
  { id: "fallback-6", title: "Intro", artist: "The xx", album: "xx", duration: "2:07", art: art.night, audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", accent: "#8ca3ff", durationMs: 127000, source: "fallback" },
  { id: "fallback-7", title: "Good Days", artist: "SZA", album: "Good Days", duration: "4:39", art: art.cream, audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3", accent: "#ecdbad", durationMs: 279000, source: "fallback" },
  { id: "fallback-8", title: "Love Tonight", artist: "Shouse", album: "Open", duration: "4:01", art: art.purple, audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", accent: "#ffd064", durationMs: 241000, source: "fallback" },
];

const mixes = [
  { title: "late night drive", detail: "A little faster, a little further", art: art.neon, gradient: "from-[#2a1a0f] to-[#131c12]" },
  { title: "focus / flow", detail: "No lyrics. No distractions.", art: art.blue, gradient: "from-[#1f1610] to-[#111719]" },
  { title: "soft launch", detail: "New sounds worth sharing", art: art.cream, gradient: "from-[#4a371c] to-[#181612]" },
];

const navItems: NavItem[] = [
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "search", label: "Search Catalog", icon: Search },
  { id: "podcasts", label: "Podcasts & Shows", icon: Podcast },
  { id: "stats", label: "Listening Stats", icon: BarChart3 },
  { id: "aimix", label: "AI Mix Studio", icon: Sparkles },
  { id: "discover", label: "Discover", icon: Compass },
  { id: "releases", label: "New releases", icon: Sparkles },
];

const MOOD_OPTIONS = [
  {
    id: "chill",
    emoji: "🌙",
    name: "Midnight Reverie",
    vibe: "Atmospheric synths, late-night lo-fi & mellow dream pop",
    gradient: "from-[#2b1f3d] to-[#14121a]",
    accent: "#d5b9ff",
  },
  {
    id: "workout",
    emoji: "⚡",
    name: "Neon Cardio",
    vibe: "High-octane electronic, driving basslines & synthwave energy",
    gradient: "from-[#382614] to-[#1a1410]",
    accent: "#ffb247",
  },
  {
    id: "focus",
    emoji: "🎯",
    name: "Deep Flow State",
    vibe: "Minimalist neo-classical, ambient techno & uninterrupted flow",
    gradient: "from-[#221810] to-[#10171d]",
    accent: "#63c5ff",
  },
  {
    id: "party",
    emoji: "🎉",
    name: "Weekend Euphoria",
    vibe: "Infectious dancefloor house, upbeat grooves & uplifting hooks",
    gradient: "from-[#331828] to-[#1a1018]",
    accent: "#ff7bd5",
  },
  {
    id: "nostalgia",
    emoji: "📼",
    name: "Golden Era Rewind",
    vibe: "Timeless 80s synth anthems, 90s alternative & vintage soul",
    gradient: "from-[#332e18] to-[#171610]",
    accent: "#e5cf58",
  },
  {
    id: "acoustic",
    emoji: "☕",
    name: "Sunday Coffeehouse",
    vibe: "Warm fingerpicking, intimate indie folk & tender storytelling",
    gradient: "from-[#2a241c] to-[#141210]",
    accent: "#d8c5a4",
  },
];

const INSPIRATION_TAGS = [
  "Lo-fi beats for rainy study",
  "Cyberpunk night driving",
  "90s French Touch & Disco",
  "Warm acoustic sunset",
  "Melodic techno flow",
  "Indie bedroom pop",
];

const libraryItems: NavItem[] = [
  { id: "liked", label: "Liked songs", icon: Heart },
  { id: "albums", label: "Albums", icon: Album },
  { id: "playlists", label: "Your playlists", icon: ListMusic },
  { id: "spotify", label: "Spotify sync", icon: Link2 },
];

function toUiTrack(item: {
  id: string | number;
  title: string;
  artist: string;
  album?: string | null;
  art?: string | null;
  audio?: string | null;
  accent?: string;
  storeUrl?: string | null;
  durationMs?: number | null;
  source?: string;
}): Track {
  return {
    id: item.id,
    title: item.title,
    artist: item.artist,
    album: item.album ?? "Single",
    duration: item.durationMs ? formatTime(item.durationMs / 1000) : "Preview",
    art: item.art || art.neon,
    audio: item.audio || "",
    accent: item.accent ?? "#f5ba42",
    storeUrl: item.storeUrl ?? undefined,
    durationMs: item.durationMs ?? null,
    source: item.source,
  };
}

function TrackRow({
  track,
  onPlay,
  onSave,
  onLike,
  onAddToQueue,
  active,
  liked,
}: {
  track: Track;
  onPlay: (track: Track) => void;
  onSave: (track: Track) => void;
  onLike: (track: Track) => void;
  onAddToQueue?: (track: Track) => void;
  active: boolean;
  liked: boolean;
}) {
  return (
    <div
      className={`group grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.055] ${
        active ? "bg-white/[0.07]" : ""
      }`}
    >
      <button
        aria-label={`Play ${track.title}`}
        onClick={() => onPlay(track)}
        className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg"
      >
        <img
          src={track.art}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <span className="absolute inset-0 grid place-items-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
          {active ? (
            <Pause className="h-4 w-4 fill-current" />
          ) : (
            <Play className="h-4 w-4 fill-current" />
          )}
        </span>
      </button>
      <button className="min-w-0 text-left" onClick={() => onPlay(track)}>
        <div className="flex min-w-0 items-center gap-2">
          <p
            className={`truncate text-[13px] font-semibold ${
              active ? "text-[#f5ba42]" : "text-[#faf5ee]"
            }`}
          >
            {track.title}
          </p>
          {active && (
            <span className="player-eq shrink-0" aria-label="Currently playing">
              <span />
              <span />
              <span />
            </span>
          )}
        </div>
        <p className="truncate text-xs text-[#8b9389]">
          {track.artist} · {track.album}
        </p>
      </button>
      <div className="flex items-center gap-2.5 text-xs text-[#7f877e]">
        <span className="hidden sm:inline">{track.duration}</span>
        {onAddToQueue && (
          <button
            type="button"
            title="Add to playback queue"
            aria-label={`Add ${track.title} to queue`}
            onClick={() => onAddToQueue(track)}
            className="opacity-0 transition-opacity hover:text-[#f5ba42] group-hover:opacity-100 p-1"
          >
            <ListPlus className="h-4 w-4" />
          </button>
        )}
        <button
          aria-label={`${liked ? "Remove" : "Like"} ${track.title}`}
          onClick={() => onLike(track)}
          className={`${
            liked ? "text-[#f5ba42]" : "opacity-0 group-hover:opacity-100"
          } transition-opacity hover:text-[#f5ba42] p-1`}
        >
          <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
        </button>
        <button
          aria-label={`Add ${track.title} to a playlist`}
          onClick={() => onSave(track)}
          className="opacity-0 transition-opacity hover:text-[#f5ba42] group-hover:opacity-100 p-1"
        >
          <Plus className="h-4 w-4" />
        </button>
        {track.storeUrl && (
          <button
            aria-label={`Spotify attribution for ${track.title}`}
            onClick={() =>
              toast.info("Spotify attribution is available in your connected account.")
            }
            className="opacity-0 transition-opacity hover:text-white group-hover:opacity-100 p-1"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  action,
  onAction,
}: {
  eyebrow?: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#a89885]">
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-xl font-semibold tracking-[-0.03em] text-[#faf5ee] md:text-2xl">
          {title}
        </h2>
      </div>
      {action && (
        <button
          onClick={onAction}
          className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[#ab9b88] transition-colors hover:text-[#f5ba42]"
        >
          {action} <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

type SpotifySyncPlaylist = {
  id: number;
  externalId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  storeUrl: string | null;
  trackCount: number;
};

type SpotifySyncRecent = {
  id: number;
  externalId: string;
  title: string;
  artist: string;
  album: string | null;
  artworkUrl: string | null;
  storeUrl: string | null;
  playedAt: Date | string;
};

type AiRecommendation = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  reason: string;
  art: string | null;
  durationMs?: number | null;
  duration?: string;
  audio?: string;
  storeUrl?: string;
};

function aiRecommendationToTrack(item: AiRecommendation): Track {
  return {
    id: item.id.startsWith("spotify-") ? item.id : `spotify-${item.id}`,
    title: item.title,
    artist: item.artist,
    album: item.album || "AI Mix Discovery",
    duration: item.duration || "3:30",
    art: item.art || art.purple,
    audio: item.audio || "",
    accent: "#c09cff",
    durationMs: item.durationMs ?? 210000,
    storeUrl: item.storeUrl || `https://open.spotify.com/track/${item.id.replace(/^spotify-/, "")}`,
    source: "AI Mix",
  };
}

function SyncSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-label="Loading Spotify data">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#17110a] p-4"
        >
          <div className="h-12 w-12 rounded-xl bg-white/[0.08]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-2/3 rounded bg-white/[0.08]" />
            <div className="h-2 w-1/2 rounded bg-white/[0.06]" />
          </div>
          <div className="h-3 w-12 rounded bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}

function SpotifyPlaylistDetail({
  externalId,
  onBack,
  onPlay,
  onSave,
  onLike,
  likedIds,
  activeTrackId,
  isPlaying,
  onAddToQueue,
}: {
  externalId: string;
  onBack: () => void;
  onPlay: (track: Track) => void;
  onSave: (track: Track) => void;
  onLike: (track: Track) => void;
  onAddToQueue?: (track: Track) => void;
  likedIds: Set<string>;
  activeTrackId: string | number;
  isPlaying: boolean;
}) {
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchDraft.trim()), 280);
    return () => window.clearTimeout(timer);
  }, [searchDraft]);
  const input = useMemo(() => ({ externalId, query: search }), [externalId, search]);
  const detailQuery = trpc.spotify.playlistDetail.useQuery(input, {
    enabled: Boolean(externalId),
    retry: false,
  });
  const playlist = detailQuery.data?.playlist;
  const tracks = (detailQuery.data?.tracks ?? []).map(toUiTrack);
  return (
    <section>
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#b2a28f] hover:text-[#f5ba42]"
      >
        <ArrowRight className="h-4 w-4 rotate-180" />
        Back to Spotify sync
      </button>
      {detailQuery.isLoading ? (
        <SyncSkeleton rows={5} />
      ) : detailQuery.error ? (
        <div className="rounded-2xl border border-dashed border-[#ef6b5e]/30 bg-[#241816] px-6 py-14 text-center">
          <p className="font-display text-lg font-semibold">Could not load this playlist</p>
          <p className="mt-2 text-sm text-[#a99591]">{detailQuery.error.message}</p>
        </div>
      ) : (
        <>
          <div className="mb-8 flex flex-wrap items-end gap-5 rounded-3xl border border-white/[0.08] bg-[#17110a] p-5 md:p-7">
            <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-[#261b11] md:h-40 md:w-40">
              {playlist?.imageUrl && (
                <img src={playlist.imageUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#a2927f]">
                Spotify playlist
              </p>
              <h1 className="truncate font-display text-3xl font-semibold tracking-[-0.06em] text-[#faf5ee] md:text-5xl">
                {playlist?.name}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a2927f]">
                {playlist?.description || "Synced from your Spotify library."}
              </p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#968572]">
                {detailQuery.data?.totalTracks ?? 0} tracks · refreshed{" "}
                {playlist?.syncedAt
                  ? new Date(playlist.syncedAt).toLocaleDateString()
                  : "recently"}
              </p>
            </div>
          </div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <SectionHeading
                eyebrow="Playlist tracks"
                title={search ? `Matches for “${search}”` : "Full track listing"}
              />
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#998875]" />
              <input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Find a song in this playlist"
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-3 text-sm text-[#f5f4ec] placeholder:text-[#887967] outline-none focus:border-[#e6a325]"
              />
            </div>
          </div>
          {detailQuery.isFetching && !detailQuery.isLoading ? (
            <SyncSkeleton rows={4} />
          ) : tracks.length ? (
            <div className="max-w-4xl space-y-1">
              {tracks.map((track) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  onPlay={onPlay}
                  onSave={onSave}
                  onLike={onLike}
                  onAddToQueue={onAddToQueue}
                  active={String(track.id) === String(activeTrackId) && isPlaying}
                  liked={likedIds.has(String(track.id))}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/[0.12] px-6 py-16 text-center">
              <Search className="mx-auto mb-4 h-7 w-7 text-[#8f806e]" />
              <p className="font-display text-lg font-semibold">No songs match</p>
              <p className="mt-1 text-sm text-[#9c8c79]">
                Try a different title, artist, or album.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function QueueDrawer({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  queue,
  repeatMode,
  onToggleRepeat,
  onPlayTrack,
  onRemoveFromQueue,
  onClearQueue,
  onShuffleQueue,
  onLoadAiMixToQueue,
  hasAiMix,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track;
  isPlaying: boolean;
  queue: Track[];
  repeatMode: "off" | "all" | "one";
  onToggleRepeat: () => void;
  onPlayTrack: (track: Track) => void;
  onRemoveFromQueue: (index: number) => void;
  onClearQueue: () => void;
  onShuffleQueue: () => void;
  onLoadAiMixToQueue?: () => void;
  hasAiMix?: boolean;
}) {
  if (!isOpen) return null;

  const curIdx = queue.findIndex((t) => String(t.id) === String(currentTrack.id));
  const upcoming =
    curIdx >= 0
      ? queue.slice(curIdx + 1)
      : queue.filter((t) => String(t.id) !== String(currentTrack.id));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-md transition-all duration-300">
      <div className="relative flex h-full w-full max-w-md flex-col glass-panel border-l border-white/15 bg-[#121413]/95 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Layers className="h-5 w-5 text-[#f5ba42]" />
            <h3 className="font-display text-base font-bold text-white tracking-wide">
              Playback Queue
            </h3>
            <span className="glass-pill px-2 py-0.5 text-[11px] font-mono font-semibold text-[#f5ba42]">
              {queue.length} {queue.length === 1 ? "track" : "tracks"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleRepeat}
              title={`Repeat mode: ${repeatMode}`}
              className={`rounded-full p-2 transition ${
                repeatMode !== "off"
                  ? "bg-[#f5ba42]/20 text-[#f5ba42]"
                  : "text-[#9da59c] hover:bg-white/10 hover:text-white"
              }`}
            >
              {repeatMode === "one" ? <Repeat1 className="h-4 w-4" /> : <Repeat2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onShuffleQueue}
              title="Shuffle upcoming queue"
              className="rounded-full p-2 text-[#9da59c] hover:bg-white/10 hover:text-[#f5ba42] transition"
            >
              <Shuffle className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClearQueue}
              title="Clear queue"
              className="rounded-full p-2 text-[#9da59c] hover:bg-white/10 hover:text-[#ef6b5e] transition"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-[#9da59c] hover:bg-white/10 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* Now Playing section */}
          <div className="space-y-2.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8e978d]">
              Now Playing
            </p>
            <div className="gloss-card flex items-center gap-3.5 rounded-2xl p-3.5 border border-[#f5ba42]/25 shadow-lg">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-black/40">
                <img
                  src={currentTrack.art}
                  alt=""
                  className="h-full w-full object-cover"
                />
                {isPlaying && (
                  <div className="absolute inset-0 grid place-items-center bg-black/35 backdrop-blur-[1px]">
                    <div className="player-eq">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="truncate text-sm font-bold text-[#f5ba42]">
                  {currentTrack.title}
                </p>
                <p className="truncate text-xs text-[#c2b2a0]">
                  {currentTrack.artist}
                </p>
                <div className="flex items-center gap-2 pt-0.5 text-[11px] text-[#8e7f6e]">
                  <span>{currentTrack.duration}</span>
                  <span>·</span>
                  <span className="font-mono text-[10px] uppercase text-[#f7c844]">
                    {currentTrack.source === "Spotify" ? "Spotify Stream" : "Full Length Audio"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Up Next section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8e978d]">
                Up Next ({upcoming.length})
              </p>
              {upcoming.length > 0 && (
                <span className="text-[11px] text-[#998875]">
                  Auto-advances smoothly
                </span>
              )}
            </div>

            {upcoming.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center space-y-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04] text-[#a2927f] mx-auto">
                  <ListMusic className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#d4dcd2]">Queue is empty</p>
                  <p className="text-[11px] text-[#998875] leading-relaxed max-w-[260px] mx-auto">
                    Hover over any song and click "+ Add to Queue", or load your curated AI Mix.
                  </p>
                </div>
                {hasAiMix && onLoadAiMixToQueue && (
                  <button
                    type="button"
                    onClick={onLoadAiMixToQueue}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#d5b9ff]/20 hover:bg-[#d5b9ff]/30 px-3.5 py-1.5 text-xs font-semibold text-[#d5b9ff] transition border border-[#d5b9ff]/30"
                  >
                    <Sparkles className="h-3 w-3" />
                    Load Curated AI Mix into Queue
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                {upcoming.map((track, uIdx) => {
                  const absoluteIdx =
                    curIdx >= 0
                      ? curIdx + 1 + uIdx
                      : queue.findIndex((t) => String(t.id) === String(track.id));
                  return (
                    <div
                      key={`${track.id}-${uIdx}`}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2 hover:border-white/15 hover:bg-white/[0.06] transition"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="w-4 font-mono text-[11px] text-[#8a7a67] text-center shrink-0">
                          {uIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => onPlayTrack(track)}
                          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-black/30"
                        >
                          <img src={track.art} alt="" className="h-full w-full object-cover" />
                          <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                            <Play className="h-3.5 w-3.5 fill-white text-white" />
                          </div>
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-[#f0ede6]">
                            {track.title}
                          </p>
                          <p className="truncate text-[11px] text-[#a0907d]">
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] font-mono text-[#8a7a67] mr-1">
                          {track.duration}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveFromQueue(absoluteIdx)}
                          title="Remove from queue"
                          className="rounded-lg p-1.5 text-[#8a7a67] hover:bg-white/10 hover:text-[#ef6b5e] transition"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick AI Mix Queue Injection Banner */}
          {hasAiMix && onLoadAiMixToQueue && upcoming.length > 0 && (
            <div className="rounded-2xl border border-[#d5b9ff]/20 bg-gradient-to-r from-[#241733]/60 to-[#161220]/60 p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Sparkles className="h-4 w-4 text-[#d5b9ff] shrink-0" />
                <p className="text-xs text-[#d2c2e5] truncate">
                  Append AI Mix to queue?
                </p>
              </div>
              <button
                type="button"
                onClick={onLoadAiMixToQueue}
                className="shrink-0 rounded-full bg-[#d5b9ff] hover:bg-[#e4d2ff] px-3 py-1 text-[11px] font-bold text-[#1f132e] transition shadow"
              >
                Add Mix
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AiMixStudio({
  recommendations,
  meta,
  selectedMood,
  onSelectMood,
  customPrompt,
  onChangePrompt,
  onBuildMix,
  onRefreshMix,
  buildingMix,
  onPlayMix,
  onPlayTrack,
  onSaveToLibrary,
  onExportToSpotify,
  exportingSpotify,
  isSpotifyConnected,
  activeTrackId,
  isPlaying,
  likedIds,
  onLike,
  tasteProfile,
  trainingModel,
  onRetrainModel,
  pastAiPlaylists,
  selectedSeedPlaylistId,
  onSelectSeedPlaylist,
  onAddToQueue,
  onAddAllToQueue,
}: {
  recommendations: AiRecommendation[];
  meta: { title: string; description: string; mood: string } | null;
  selectedMood: string;
  onSelectMood: (mood: string) => void;
  customPrompt: string;
  onChangePrompt: (val: string) => void;
  onBuildMix: () => void;
  onRefreshMix?: () => void;
  buildingMix: boolean;
  onPlayMix: () => void;
  onPlayTrack: (track: Track) => void;
  onSaveToLibrary: () => void;
  onExportToSpotify: () => void;
  exportingSpotify: boolean;
  isSpotifyConnected: boolean;
  activeTrackId: string | number;
  isPlaying: boolean;
  likedIds: Set<string>;
  onLike: (track: Track) => void;
  tasteProfile?: any;
  trainingModel?: boolean;
  onRetrainModel?: () => void;
  pastAiPlaylists?: any[];
  selectedSeedPlaylistId?: string | number | null;
  onSelectSeedPlaylist?: (id: string | number | null) => void;
  onAddToQueue?: (track: Track) => void;
  onAddAllToQueue?: () => void;
}) {
  const currentMoodObj = MOOD_OPTIONS.find((m) => m.id === selectedMood) || MOOD_OPTIONS[0];

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="glass-panel gloss-sheen rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl border border-[#c09cff]/25">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-[#c09cff]/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d5b9ff]/30 bg-[#d5b9ff]/10 px-3 py-1 text-xs font-semibold text-[#d5b9ff]">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>AI MIX STUDIO · NEURAL CURATION</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#f7f1ff]">
            Curate your vibe with intelligence.
          </h1>
          <p className="text-sm sm:text-base text-[#b8a7cc] leading-relaxed">
            Musivo continuously trains on your playback history, liked tracks, and past AI-made playlists to generate perfectly cohesive, full-length listening journeys.
          </p>
        </div>
      </div>

      {/* AI Taste Intelligence & Training Center Card */}
      <div className="glass-panel rounded-3xl p-5 sm:p-7 border border-[#d5b9ff]/20 bg-gradient-to-br from-[#1d1628]/80 via-[#15131c]/80 to-[#101114]/80 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-[#d5b9ff] animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-[#d5b9ff] font-semibold">
                AI Taste Intelligence Engine
              </span>
              <span className="glass-pill px-2 py-0.5 text-[10px] font-mono text-[#f5ba42]">
                Live Profile
              </span>
            </div>
            <p className="text-xs text-[#b3a6c4]">
              {tasteProfile?.learnedVibeSummary ||
                "Model actively learned from your library, history, and AI mix sessions."}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {onRetrainModel && (
              <button
                type="button"
                onClick={onRetrainModel}
                disabled={trainingModel}
                className="flex items-center gap-2 rounded-full border border-[#d5b9ff]/40 bg-[#d5b9ff]/10 hover:bg-[#d5b9ff]/20 px-3.5 py-1.5 text-xs font-semibold text-[#f0e8fc] transition shadow disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-[#d5b9ff] ${trainingModel ? "animate-spin" : ""}`} />
                {trainingModel ? "Training AI Model…" : "Re-train AI Model"}
              </button>
            )}
          </div>
        </div>

        {/* Training Stats & Affinities */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#8b8496]">History Analyzed</p>
            <p className="font-display text-xl font-bold text-white">
              {tasteProfile?.recentTracksCount ?? 0} <span className="text-xs font-normal text-[#9b93a6]">plays</span>
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#8b8496]">Liked Tracks</p>
            <p className="font-display text-xl font-bold text-[#f5ba42]">
              {tasteProfile?.likedTracksCount ?? 0} <span className="text-xs font-normal text-[#9b93a6]">tracks</span>
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#8b8496]">Past AI Playlists</p>
            <p className="font-display text-xl font-bold text-[#d5b9ff]">
              {tasteProfile?.aiPlaylistsCount ?? 0} <span className="text-xs font-normal text-[#9b93a6]">mixes</span>
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#8b8496]">Engine Calibrated</p>
            <p className="font-display text-base font-semibold text-[#ffd064] truncate">
              Continuous Vibe
            </p>
          </div>
        </div>

        {/* Detected Top Affinities Pills */}
        {tasteProfile?.topSeedAffinities && tasteProfile.topSeedAffinities.length > 0 && (
          <div className="space-y-2 pt-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#91879f]">
              Detected Genre & Mood Affinities
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {tasteProfile.topSeedAffinities.map((aff: { name: string; weight: number }) => (
                <div
                  key={aff.name}
                  className="glass-pill flex items-center gap-2 px-3 py-1 text-xs rounded-full"
                >
                  <span className="text-[#eee7f7] font-medium">{aff.name}</span>
                  <span className="font-mono font-bold text-[11px] text-[#f5ba42]">
                    {aff.weight}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past AI Mixes Selector (Seed & Evolve) */}
        {pastAiPlaylists && pastAiPlaylists.length > 0 && onSelectSeedPlaylist && (
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#91879f]">
                Seed From Past AI-Made Playlist
              </p>
              {selectedSeedPlaylistId && (
                <button
                  type="button"
                  onClick={() => onSelectSeedPlaylist(null)}
                  className="text-xs text-[#d5b9ff] hover:underline"
                >
                  Clear Selection
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => onSelectSeedPlaylist(null)}
                className={`rounded-xl border px-3 py-1.5 text-xs transition ${
                  !selectedSeedPlaylistId
                    ? "border-[#f5ba42] bg-[#f5ba42]/15 text-[#f5ba42] font-semibold"
                    : "border-white/10 bg-white/[0.04] text-[#b4a9c2] hover:bg-white/[0.08]"
                }`}
              >
                Pure Fresh Generation
              </button>
              {pastAiPlaylists.map((pl) => {
                const isSelected = String(selectedSeedPlaylistId) === String(pl.id);
                return (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => onSelectSeedPlaylist(isSelected ? null : pl.id)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition ${
                      isSelected
                        ? "border-[#d5b9ff] bg-[#d5b9ff]/20 text-[#f5efff] font-semibold shadow-md ring-1 ring-[#d5b9ff]/40"
                        : "border-white/10 bg-white/[0.04] text-[#b4a9c2] hover:border-white/20 hover:bg-white/[0.08]"
                    }`}
                  >
                    <Sparkles className={`h-3 w-3 ${isSelected ? "text-[#d5b9ff]" : "text-[#8e859a]"}`} />
                    <span className="truncate max-w-[160px]">{pl.name}</span>
                    <span className="font-mono text-[10px] text-[#7f788b]">({pl.trackCount})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Mood Selector Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#8e859a]">
            1. Select a Mood Preset
          </p>
          <span className="text-xs text-[#a79bb5]">Click any to tailor the mix</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MOOD_OPTIONS.map((mood) => {
            const isSelected = selectedMood === mood.id;
            return (
              <button
                key={mood.id}
                type="button"
                onClick={() => onSelectMood(mood.id)}
                className={`group gloss-card flex items-start gap-3.5 rounded-2xl p-4 text-left transition-all ${
                  isSelected
                    ? "border-[#d5b9ff] bg-[#2d1e42] shadow-xl ring-1 ring-[#d5b9ff]/50"
                    : "border-white/[0.08] bg-[#16141a] hover:border-white/[0.22] hover:bg-[#1f1b25]"
                }`}
              >
                <div
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-lg ${
                    isSelected ? "bg-[#d5b9ff]/25" : "bg-white/[0.05]"
                  }`}
                >
                  {mood.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-sm font-semibold ${isSelected ? "text-[#f5efff]" : "text-[#eae3f2]"}`}>
                      {mood.name}
                    </p>
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-[#d5b9ff] animate-ping" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[#9d92a9] leading-relaxed line-clamp-2">
                    {mood.vibe}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Prompt & Generator */}
      <div className="glass-panel rounded-2xl border border-white/[0.12] p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#8e859a]">
            2. Or Describe a Custom Vibe (Optional)
          </p>
          <span className="text-xs text-[#a79bb5]">Type any mood, genre, or scene</span>
        </div>
        <div className="relative">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => onChangePrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !buildingMix) onBuildMix();
            }}
            placeholder={`e.g. ${currentMoodObj.name}: ${currentMoodObj.vibe}...`}
            className="w-full rounded-xl border border-white/[0.12] bg-black/40 px-4 py-3 text-sm text-[#f5f4ec] placeholder:text-[#6e6878] outline-none focus:border-[#d5b9ff] focus:ring-1 focus:ring-[#d5b9ff]/50 backdrop-blur"
          />
        </div>

        {/* Quick Inspiration Tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="font-mono text-[11px] text-[#787183] mr-1">Inspirations:</span>
          {INSPIRATION_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onChangePrompt(tag)}
              className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] text-[#c1b5cf] hover:border-[#d5b9ff]/40 hover:bg-[#d5b9ff]/15 hover:text-white transition"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Generate Button */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="button"
            onClick={onBuildMix}
            disabled={buildingMix}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#d5b9ff] via-[#e4d2ff] to-[#f5ba42] hover:opacity-95 px-6 py-2.5 text-xs font-bold text-[#141217] shadow-xl transition hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className={`h-4 w-4 ${buildingMix ? "animate-spin" : ""}`} />
            {buildingMix ? "Curating your AI Mix…" : "Generate AI Mix"}
          </button>
        </div>
      </div>

      {/* Mix Results Section */}
      {recommendations.length > 0 && (
        <div className="space-y-6 pt-2">
          {/* Hero Mix Banner */}
          <div className="glass-panel gloss-sheen rounded-3xl border border-[#d5b9ff]/30 bg-gradient-to-br from-[#271d37]/90 via-[#1a1523]/90 to-[#121315]/90 p-6 sm:p-7 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-2xl bg-[#322346] shadow-md border border-white/10">
                  {recommendations[0]?.art ? (
                    <img
                      src={recommendations[0].art}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-3xl">
                      {currentMoodObj.emoji}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#d5b9ff]">
                      Curated AI Playlist
                    </span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold text-[#f5ba42]">
                      Full Length Audio
                    </span>
                  </div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-[#f5effe]">
                    {meta?.title || `Musivo AI Mix · ${currentMoodObj.name}`}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#b8a7cc] line-clamp-1 max-w-xl">
                    {meta?.description || currentMoodObj.vibe}
                  </p>
                  <p className="font-mono text-[11px] text-[#8e859a] pt-0.5">
                    {recommendations.length} tracks curated · full stream enabled
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onPlayMix}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full bg-[#f5ba42] hover:bg-[#ffd064] px-5 py-2.5 text-xs font-bold text-[#141812] shadow-md transition hover:scale-[1.02]"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Play Entire Mix
                </button>
                {onRefreshMix && (
                  <button
                    type="button"
                    onClick={onRefreshMix}
                    disabled={buildingMix}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 px-4 py-2.5 text-xs font-semibold text-[#f0eff5] transition"
                    title="Discover new exploratory tracks with a refreshed seed"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${buildingMix ? "animate-spin" : ""}`} />
                    Refresh Mix
                  </button>
                )}
                {onAddAllToQueue && (
                  <button
                    type="button"
                    onClick={onAddAllToQueue}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 px-4 py-2.5 text-xs font-semibold text-[#f0eff5] transition"
                    title="Append all mix tracks to queue"
                  >
                    <ListPlus className="h-3.5 w-3.5" />
                    Add All to Queue
                  </button>
                )}
                <button
                  type="button"
                  onClick={onSaveToLibrary}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-semibold text-[#f0eff5] transition"
                  title="Save to your Musivo Library playlists"
                >
                  <ListMusic className="h-3.5 w-3.5" />
                  Save to Library
                </button>
                {isSpotifyConnected ? (
                  <button
                    type="button"
                    onClick={onExportToSpotify}
                    disabled={exportingSpotify}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-full bg-[#f5ba42] hover:bg-[#ffd064] px-4 py-2.5 text-xs font-bold text-black transition"
                    title="Export playlist to your Spotify account"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    {exportingSpotify ? "Exporting…" : "Export to Spotify"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Track Rows */}
          <div className="space-y-1.5">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#8e859a] px-1 mb-2">
              Curated Tracklist ({recommendations.length})
            </p>
            {recommendations.map((rec, idx) => {
              const track = aiRecommendationToTrack(rec);
              const isCurrentPlaying = String(track.id) === String(activeTrackId) && isPlaying;

              return (
                <div
                  key={rec.id || idx}
                  className={`group gloss-card flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-2.5 transition-colors ${
                    isCurrentPlaying
                      ? "border-[#f5ba42]/50 bg-[#2d1f12]/90 shadow-lg"
                      : "border-white/[0.08] bg-[#151419]/70 hover:border-white/[0.18] hover:bg-[#1d1b22]"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <span className="w-5 text-center font-mono text-xs text-[#716a7d]">
                      {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => onPlayTrack(track)}
                      className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-[#2e233f] group-hover:shadow-md"
                    >
                      {rec.art ? (
                        <img
                          src={rec.art}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-sm">
                          {currentMoodObj.emoji}
                        </div>
                      )}
                      <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                        <Play className="h-4 w-4 fill-white text-white" />
                      </div>
                    </button>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className={`truncate text-sm font-semibold ${isCurrentPlaying ? "text-[#f5ba42]" : "text-[#f2eef8]"}`}>
                        {rec.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-[#9d92a9]">
                        <span className="truncate">{rec.artist}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#cbb0ef] truncate max-w-[280px]">
                          <Sparkles className="h-2.5 w-2.5 shrink-0" />
                          {rec.reason}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onAddToQueue && (
                      <button
                        type="button"
                        title="Add to queue"
                        onClick={() => onAddToQueue(track)}
                        className="rounded-full p-1.5 text-[#8e859a] hover:bg-white/10 hover:text-[#f5ba42] transition"
                      >
                        <ListPlus className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label="Like song"
                      onClick={() => onLike(track)}
                      className={`p-1.5 rounded-full transition ${
                        likedIds.has(String(track.id))
                          ? "text-[#f5ba42]"
                          : "text-[#6f677b] hover:text-white"
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${likedIds.has(String(track.id)) ? "fill-current" : ""}`} />
                    </button>
                    <span className="font-mono text-xs text-[#787183] w-10 text-right">
                      {rec.duration || "3:30"}
                    </span>
                    <button
                      type="button"
                      onClick={() => onPlayTrack(track)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.06] text-[#e0d8eb] hover:bg-[#f5ba42] hover:text-black transition"
                    >
                      <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function SpotifyPanel({
  connected,
  displayName,
  profileImageUrl,
  streamingEnabled,
  playlists,
  recentTracks,
  loading,
  syncing,
  disconnecting,
  onConnect,
  onSync,
  onDisconnect,
  onOpenPlaylist,
  onPlay,
  onCreatePlaylist,
  creatingPlaylist,
  onBuildAiMix,
  buildingAiMix,
  recommendations,
  onOpenAiMixStudio,
  onPlayMix,
  isPremium,
  user,
  savedTracksCount,
  syncStepText,
  connecting,
}: {
  connected: boolean;
  displayName: string | null;
  profileImageUrl: string | null;
  streamingEnabled: boolean;
  playlists: SpotifySyncPlaylist[];
  recentTracks: SpotifySyncRecent[];
  loading: boolean;
  syncing: boolean;
  disconnecting: boolean;
  connecting?: boolean;
  onConnect: () => void;
  onSync: () => void;
  onDisconnect: () => void;
  onOpenPlaylist: (externalId: string) => void;
  onPlay: (track: Track) => void;
  onCreatePlaylist: () => void;
  creatingPlaylist: boolean;
  onBuildAiMix: () => void;
  buildingAiMix: boolean;
  recommendations: AiRecommendation[];
  onOpenAiMixStudio?: () => void;
  onPlayMix?: () => void;
  isPremium: boolean | null;
  user?: any;
  savedTracksCount?: number;
  syncStepText?: string;
}) {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        {user?.hasGoogle ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f5ba42]/25 bg-[#f5ba42]/10 px-3 py-1 font-medium text-[#f5ba42]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f5ba42]" />
            Google connected {user.email ? `(${user.email})` : ""}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-medium text-[#90816f]">
            Google not connected
          </span>
        )}
        {connected ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f5ba42]/25 bg-[#f5ba42]/10 px-3 py-1 font-medium text-[#f5ba42]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f5ba42]" />
            Spotify connected {displayName ? `(${displayName})` : ""}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-medium text-[#90816f]">
            Spotify not connected
          </span>
        )}
      </div>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#a2927f]">
            Personal connection
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.05em] md:text-4xl">
            Spotify sync
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#a2927f]">
            Bring your playlists and listening history into Musivo. Spotify acts as the playback engine while Musivo remains your complete interface.
          </p>
        </div>
        {connected ? (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onSync}
              disabled={syncing}
              className="flex items-center gap-2 rounded-full bg-[#f5ba42] px-4 py-2.5 text-sm font-bold text-[#140f07] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? (syncStepText || "Syncing playlists…") : "Sync now"}
            </button>
            <button
              onClick={onDisconnect}
              disabled={disconnecting}
              className="flex items-center gap-2 rounded-full border border-white/[0.12] px-4 py-2.5 text-sm font-semibold text-[#c8d0c2] hover:border-[#ef6b5e] hover:text-[#ef9c92]"
            >
              <Unlink className="h-4 w-4" />
              Disconnect
            </button>
            {!streamingEnabled && (
              <button
                onClick={onConnect}
                disabled={connecting}
                className="rounded-full border border-[#f5ba42]/30 px-4 py-2.5 text-sm font-semibold text-[#f5ba42] hover:bg-[#f5ba42]/10 disabled:opacity-60 transition"
              >
                {connecting ? "Connecting…" : "Reconnect for playback"}
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={onConnect}
            disabled={connecting}
            className="flex items-center gap-2 rounded-full bg-[#f5ba42] px-4 py-2.5 text-sm font-bold text-[#140f07] hover:bg-[#ffd064] disabled:opacity-60 transition"
          >
            {connecting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Connecting to Spotify…
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4" />
                Connect Spotify
              </>
            )}
          </button>
        )}
      </div>


      {!connected ? (
        <div className="rounded-3xl border border-white/[0.08] bg-[#17110a] p-8">
          <Link2 className="h-8 w-8 text-[#f5ba42]" />
          <h2 className="mt-5 font-display text-2xl font-semibold tracking-[-0.04em]">
            Your listening space, connected.
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#a2927f]">
            Authorize Musivo to stream your music via the Spotify Web Playback SDK and read your playlists. Tokens remain securely encrypted on the server.
          </p>
          <button
            onClick={onConnect}
            disabled={connecting}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#f5ba42] px-5 py-3 text-sm font-bold text-[#140f07] hover:bg-[#ffd064] disabled:opacity-60 transition"
          >
            {connecting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Connecting to Spotify…
              </>
            ) : (
              "Continue with Spotify"
            )}
          </button>
        </div>
      ) : (
        <>
          <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-[#f5ba42]/20 bg-[#26190e] px-4 py-3 transition-all duration-500">
            <div className="relative shrink-0">
              <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-[#f5ba42] text-[#140f07] ring-2 ring-[#f5ba42]/30">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#26190e] bg-[#f5ba42]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#faf5ee]">
                Connected{displayName ? ` as ${displayName}` : " to Spotify"}
              </p>
              <p className="text-xs text-[#b0a08d]">
                {syncing
                  ? "Fetching playlists and listening history…"
                  : streamingEnabled
                  ? "Spotify Web Playback SDK is connected. Audio plays directly inside Musivo."
                  : "Reconnect Spotify to enable in-app playback."}
              </p>
            </div>
            <span className="rounded-full border border-[#f5ba42]/20 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#ffd064]">
              Account connected
            </span>
          </div>

          <div className="mb-8 grid gap-3 grid-cols-2 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/[0.08] bg-[#17110a] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#968572]">Synced playlists</p>
              <p className="mt-1 font-display text-2xl font-semibold text-[#faf5ee]">{playlists.length}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-[#17110a] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#968572]">Saved tracks</p>
              <p className="mt-1 font-display text-2xl font-semibold text-[#faf5ee]">{savedTracksCount ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-[#17110a] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#968572]">Recent tracks</p>
              <p className="mt-1 font-display text-2xl font-semibold text-[#faf5ee]">{recentTracks.length}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-[#17110a] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#968572]">Playback SDK</p>
              <p className="mt-1 text-sm font-semibold text-[#f5ba42]">
                {streamingEnabled ? "Active in Musivo" : "Ready"}
              </p>
            </div>
          </div>

          <div className="mb-8 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[#c09cff]/20 bg-gradient-to-br from-[#281e36] to-[#17151d] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#d5b9ff]">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em]">AI discovery</span>
                </div>
                {onOpenAiMixStudio && (
                  <button
                    type="button"
                    onClick={onOpenAiMixStudio}
                    className="text-[11px] font-semibold text-[#d5b9ff] hover:underline"
                  >
                    Open Studio →
                  </button>
                )}
              </div>
              <p className="text-sm font-semibold text-[#f1eafa]">Turn your vibe into an instant curated mix</p>
              <p className="mt-1 text-xs leading-5 text-[#b2a5bd]">
                Musivo analyzes your library and musical vibes to curate a full-length, private Spotify playlist.
              </p>
              <button
                type="button"
                onClick={onBuildAiMix}
                disabled={buildingAiMix}
                className="mt-4 flex items-center gap-2 rounded-full bg-[#d5b9ff] px-4 py-2 text-xs font-bold text-[#241832] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className={`h-3.5 w-3.5 ${buildingAiMix ? "animate-pulse" : ""}`} />
                {buildingAiMix ? "Building your mix…" : "Build AI mix"}
              </button>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#17110a] p-4">
              <div className="mb-3 flex items-center gap-2 text-[#f5ba42]">
                <ListMusic className="h-4 w-4" />
                <span className="font-mono text-[10px] uppercase tracking-[0.15em]">Your Spotify account</span>
              </div>
              <p className="text-sm font-semibold text-[#faf5ee]">Create a playlist without leaving Musivo</p>
              <p className="mt-1 text-xs leading-5 text-[#a0907d]">
                Start a private playlist and add your liked synced tracks in one step.
              </p>
              <button
                type="button"
                onClick={onCreatePlaylist}
                disabled={creatingPlaylist}
                className="mt-4 rounded-full border border-[#f5ba42]/35 px-4 py-2 text-xs font-bold text-[#f5ba42] hover:bg-[#f5ba42]/10 disabled:opacity-50"
              >
                Create Spotify playlist
              </button>
            </div>
          </div>

          {recommendations.length > 0 && (
            <div className="mb-8 rounded-2xl border border-[#c09cff]/20 bg-[#18141f] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#cbb0ef]">
                    Your AI picks
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#f1eafa]">
                    Curated playlist with full-length streaming
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {onPlayMix && (
                    <button
                      type="button"
                      onClick={onPlayMix}
                      className="flex items-center gap-1.5 rounded-full bg-[#f5ba42] hover:bg-[#ffd064] px-3 py-1 text-xs font-bold text-black shadow transition"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      Play Mix
                    </button>
                  )}
                  <span className="font-mono text-[10px] text-[#a99abb]">
                    {recommendations.length} tracks
                  </span>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {recommendations.slice(0, 8).map((recommendation) => {
                  const track = aiRecommendationToTrack(recommendation);
                  return (
                    <button
                      key={recommendation.id}
                      type="button"
                      onClick={() => onPlay(track)}
                      className="group flex items-center gap-3 rounded-xl bg-black/20 hover:bg-black/40 px-2.5 py-2 text-left transition w-full"
                    >
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#302441]">
                        {recommendation.art && (
                          <img
                            src={recommendation.art}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                          <Play className="h-4 w-4 fill-white text-white" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-[#f0eaf7] group-hover:text-[#f5ba42] transition-colors">
                          {recommendation.title}
                        </p>
                        <p className="truncate text-[11px] text-[#a99abb]">
                          {recommendation.artist} · {recommendation.reason}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {loading || syncing ? (
            <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
              <div>
                <SectionHeading eyebrow="Your Spotify library" title="Playlists" />
                <SyncSkeleton rows={4} />
              </div>
              <div>
                <SectionHeading eyebrow="Listening history" title="Recently played" />
                <SyncSkeleton rows={4} />
              </div>
            </div>
          ) : (
            <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
              <div>
                <SectionHeading eyebrow="Your Spotify library" title="Playlists" />
                {playlists.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {playlists.map((playlist) => (
                      <button
                        key={playlist.id}
                        onClick={() => onOpenPlaylist(playlist.externalId)}
                        className="group flex min-h-[150px] flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-[#17110a] p-4 text-left transition-colors hover:border-[#c88719] hover:bg-[#1c221a]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="h-14 w-14 overflow-hidden rounded-xl bg-[#261b11]">
                            {playlist.imageUrl && (
                              <img
                                src={playlist.imageUrl}
                                alt=""
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-[#968572]">
                            {playlist.trackCount} tracks
                          </span>
                        </div>
                        <div>
                          <p className="truncate font-display text-lg font-semibold text-[#faf5ee]">
                            {playlist.name}
                          </p>
                          <p className="mt-1 truncate text-xs text-[#9c8c79]">
                            Open detailed track listing
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/[0.12] px-5 py-12 text-center text-sm text-[#9c8c79]">
                    No Spotify playlists found. Tap Sync now to refresh.
                  </div>
                )}
              </div>

              <div>
                <SectionHeading eyebrow="Listening history" title="Recently played" />
                {recentTracks.length ? (
                  <div className="space-y-1 rounded-2xl border border-white/[0.08] bg-[#140e08] p-2">
                    {recentTracks.slice(0, 10).map((track) => (
                      <button
                        key={track.id}
                        onClick={() =>
                          onPlay(
                            toUiTrack({
                              id: `spotify-${track.externalId}`,
                              title: track.title,
                              artist: track.artist,
                              album: track.album,
                              art: track.artworkUrl,
                              audio: "",
                              storeUrl: track.storeUrl,
                              source: "Spotify",
                            })
                          )
                        }
                        className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-white/[0.045]"
                      >
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#261b11]">
                          {track.artworkUrl && (
                            <img
                              src={track.artworkUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#faf5ee]">
                            {track.title}
                          </p>
                          <p className="truncate text-xs text-[#948472]">
                            {track.artist} · {track.album || "Single"}
                          </p>
                        </div>
                        <span className="hidden font-mono text-[10px] text-[#7b6c5b] sm:block">
                          {new Date(track.playedAt).toLocaleDateString()}
                        </span>
                        <History className="h-4 w-4 text-[#968572] transition-colors group-hover:text-[#f5ba42]" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/[0.12] px-5 py-12 text-center text-sm text-[#9c8c79]">
                    No recent plays returned yet. Tap Sync now to refresh.
                  </div>
                )}
              </div>
            </div>
          )}
          <p className="mt-7 text-xs text-[#8c7d6b]">
            Spotify Web Playback SDK powers music streaming inside Musivo. All controls and queue state remain in the Musivo interface.
          </p>
        </>
      )}
    </section>
  );
}

function SpotifyConnectSection({
  isAuthenticated,
  connected,
  displayName,
  syncing,
  connecting,
  playlistCount,
  savedTracksCount,
  recentCount,
  syncStepText,
  user,
  onConnect,
  onSync,
  onOpen,
}: {
  isAuthenticated: boolean;
  connected: boolean;
  displayName: string | null;
  syncing: boolean;
  connecting?: boolean;
  playlistCount: number;
  savedTracksCount: number;
  recentCount: number;
  syncStepText?: string;
  user?: any;
  onConnect: () => void;
  onSync: () => void;
  onOpen: () => void;
}) {
  return (
    <section className="mt-10 overflow-hidden rounded-3xl border border-[#f5ba42]/15 bg-gradient-to-br from-[#24170c] via-[#1a120b] to-[#140e08] p-5 md:p-7">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        {user?.hasGoogle ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f5ba42]/25 bg-[#f5ba42]/10 px-3 py-1 font-medium text-[#f5ba42]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f5ba42]" />
            Google connected {user.email ? `(${user.email})` : ""}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-medium text-[#90816f]">
            Google not connected
          </span>
        )}
        {connected ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f5ba42]/25 bg-[#f5ba42]/10 px-3 py-1 font-medium text-[#f5ba42]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f5ba42]" />
            Spotify connected {displayName ? `(${displayName})` : ""}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-medium text-[#90816f]">
            Spotify not connected
          </span>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#f5ba42] text-[#140f07] shadow-[0_0_28px_rgba(245,186,66,0.16)]">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#caa972]">
              Build your Musivo library
            </p>
            <h2 className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#faf5ee]">
              {connected
                ? `Spotify is synced${displayName ? ` · ${displayName}` : ""}`
                : "Connect your Spotify account"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#b8a895]">
              {connected
                ? "Keep your playlists and listening history fresh in Musivo, then browse and play your synced music from one place."
                : "Bring your playlists and recently played tracks into Musivo. Spotify acts as the music engine while Musivo stays your music player interface."}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {connected ? (
            <>
              <button
                onClick={onSync}
                disabled={syncing}
                className="flex items-center gap-2 rounded-full bg-[#f5ba42] px-4 py-2.5 text-sm font-bold text-[#140f07] disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? (syncStepText || "Syncing account…") : "Sync account"}
              </button>
              <button
                onClick={onOpen}
                className="rounded-full border border-white/[0.14] px-4 py-2.5 text-sm font-semibold text-[#faf5ee] hover:border-[#f5ba42]/50"
              >
                Open synced library
              </button>
            </>
          ) : (
            <button
              onClick={onConnect}
              disabled={connecting}
              className="inline-flex items-center gap-2 rounded-full bg-[#f5ba42] px-5 py-2.5 text-sm font-bold text-[#140f07] hover:bg-[#ffd064] disabled:opacity-60 transition"
            >
              {connecting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Connecting to Spotify…
                </>
              ) : isAuthenticated ? (
                "Connect Spotify"
              ) : (
                "Log in to connect Spotify"
              )}
            </button>
          )}
        </div>
      </div>
      {connected ? (
        <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/[0.07] bg-black/10 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#968572]">
              Synced playlists
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-[#faf5ee]">
              {playlistCount}
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-black/10 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#968572]">
              Saved tracks
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-[#faf5ee]">
              {savedTracksCount}
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-black/10 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#968572]">
              Recent tracks
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-[#faf5ee]">
              {recentCount}
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-black/10 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#968572]">
              SDK Player
            </p>
            <p className="mt-1 text-sm font-semibold text-[#f5ba42]">
              Active in Musivo
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#c0b09d]">
          <span>Encrypted account connection</span>
          <span>In-app Spotify Web Playback SDK</span>
          <span>Full UI playback controls</span>
        </div>
      )}
    </section>
  );
}

function PlaybackDiagnostics({
  connected,
  sdkLoaded,
  connectionState,
  deviceId,
  error,
  isPremium,
  playbackMode,
}: {
  connected: boolean;
  sdkLoaded: boolean;
  connectionState: SpotifyConnectionState;
  deviceId: string | null;
  error: string | null;
  isPremium: boolean | null;
  playbackMode: PlaybackMode;
}) {
  const stateLabel = connectionState.replace("_", " ");
  const stateIcon =
    connectionState === "ready" ? (
      <CheckCircle2 className="h-4 w-4 text-[#f5ba42]" />
    ) : connectionState === "error" ? (
      <AlertCircle className="h-4 w-4 text-[#ef8e83]" />
    ) : (
      <Loader2 className="h-4 w-4 animate-spin text-[#f5ba42]" />
    );

  return (
    <div className="absolute bottom-[calc(100%+0.75rem)] right-4 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-white/[0.1] bg-[#1a130c]/98 p-4 shadow-2xl backdrop-blur-xl md:right-8">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a2927f]">
            Playback diagnostics
          </p>
          <p className="mt-1 text-sm font-semibold text-[#faf5ee]">
            Spotify Web Playback SDK
          </p>
        </div>
        {stateIcon}
      </div>
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[#a0917e]">Spotify account</span>
          <span className={connected ? "text-[#f5ba42]" : "text-[#ef8e83]"}>
            {connected ? "Connected" : "Not connected"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#a0917e]">SDK script</span>
          <span className={sdkLoaded ? "text-[#f5ba42]" : "text-[#bcaea0]"}>
            {sdkLoaded ? "Loaded" : "Waiting"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#a0917e]">Player state</span>
          <span className="capitalize text-[#dfe7d9]">{stateLabel}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[#a0917e]">Device</span>
          <span className="max-w-[190px] truncate font-mono text-[10px] text-[#dfe7d9]">
            {deviceId || "No browser device"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#a0917e]">Account tier</span>
          <span
            className={
              isPremium === false
                ? "text-[#f5ba42]"
                : isPremium
                ? "text-[#f5ba42]"
                : "text-[#bcaea0]"
            }
          >
            {isPremium === false
              ? "Free"
              : isPremium
              ? "Premium"
              : "Connected"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#a0917e]">Playback engine</span>
          <span className="font-medium text-[#f5ba42]">
            {playbackMode === "spotify"
              ? "Spotify Web Playback SDK"
              : playbackMode === "full"
              ? "Full Stream Audio"
              : playbackMode === "preview"
              ? "Preview Audio (HTML5)"
              : "Idle"}
          </span>
        </div>
      </div>
      {error && (
        <p className="mt-3 rounded-xl border border-[#ef6b5e]/20 bg-[#2a1817] px-3 py-2 text-xs leading-5 text-[#f0aaa2]">
          {error}
        </p>
      )}
      {!connected && (
        <p className="mt-3 text-xs leading-5 text-[#a0917e]">
          Connect Spotify to enable the in-app player. Preview tracks remain available without an account.
        </p>
      )}
    </div>
  );
}

export default function Home() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const playlistUtils = trpc.useUtils();
  const [activeView, setActiveView] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [trackToSave, setTrackToSave] = useState<Track | null>(null);
  const [selectedSpotifyPlaylist, setSelectedSpotifyPlaylist] = useState<string | null>(null);
  const [showPlaybackDiagnostics, setShowPlaybackDiagnostics] = useState(false);
  const [showSpotifyPlaylistDialog, setShowSpotifyPlaylistDialog] = useState(false);
  const [newSpotifyPlaylistName, setNewSpotifyPlaylistName] = useState("My Musivo favorites");
  const [includeLikedInSpotifyPlaylist, setIncludeLikedInSpotifyPlaylist] = useState(true);
  const [aiRecommendations, setAiRecommendations] = useState<AiRecommendation[]>([]);
  const [selectedMood, setSelectedMood] = useState("chill");
  const [customPrompt, setCustomPrompt] = useState("");
  const [aiMixMeta, setAiMixMeta] = useState<{
    title: string;
    description: string;
    mood: string;
  } | null>(null);
  const [syncStepText, setSyncStepText] = useState("");
  const [lastSyncStats, setLastSyncStats] = useState<{
    playlists: number;
    recentlyPlayed: number;
    savedTracks: number;
  } | null>(null);

  // Responsive mobile/tablet nav state & PWA installation hook
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isNowPlayingModalOpen, setIsNowPlayingModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstallPwa, setCanInstallPwa] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPwa(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const installPwa = useCallback(async () => {
    if (!deferredPrompt) {
      toast.info("To install on iOS: Tap Share then 'Add to Home Screen'. On desktop: Click the install icon in your browser address bar.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      toast.success("Musivo installed successfully! Launch it anytime from your home screen or desktop.");
      setCanInstallPwa(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  // Centralized playback hook
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    playbackMode,
    spotifyConnectionState,
    deviceId,
    sdkLoaded,
    isPremium,
    isSpotifyConnected,
    error: playbackError,
    autoplayBlocked,
    queue,
    repeatMode,
    toggleRepeatMode,
    addToQueue,
    playNextInQueue,
    removeFromQueue,
    clearQueue,
    shuffleQueue,
    playTrack,
    togglePlay,
    seek,
    setVolume,
    skip,
    sleepTimer,
    sleepTimerRemainingSec,
  } = usePlayback();

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [selectedSeedPlaylistId, setSelectedSeedPlaylistId] = useState<string | number | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [isPlayerSleepModalOpen, setIsPlayerSleepModalOpen] = useState(false);
  const [isPlayerDeviceModalOpen, setIsPlayerDeviceModalOpen] = useState(false);

  const prevVolumeRef = useRef(70);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          void togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          void seek(Math.min(duration, progress + 5));
          break;
        case "ArrowLeft":
          e.preventDefault();
          void seek(Math.max(0, progress - 5));
          break;
        case "KeyN":
          e.preventDefault();
          void skip(1);
          break;
        case "KeyP":
          e.preventDefault();
          void skip(-1);
          break;
        case "KeyM":
          e.preventDefault();
          if (volume > 0) {
            prevVolumeRef.current = volume;
            void setVolume(0);
          } else {
            void setVolume(prevVolumeRef.current || 70);
          }
          break;
        case "KeyS":
          e.preventDefault();
          toggleRepeatMode();
          break;
        case "KeyQ":
          e.preventDefault();
          setIsQueueOpen((prev) => !prev);
          break;
        case "Escape":
          setIsQueueOpen(false);
          setIsNowPlayingModalOpen(false);
          setIsMobileNavOpen(false);
          setShowPlaylistDialog(false);
          setShowSpotifyPlaylistDialog(false);
          setShowPlaybackDiagnostics(false);
          setSelectedArtistId(null);
          setSelectedAlbumId(null);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, seek, skip, duration, progress, volume, setVolume, toggleRepeatMode]);

  const statusQuery = trpc.music.status.useQuery(undefined, { staleTime: 1000 * 60 * 10 });
  const homeQuery = trpc.music.home.useQuery(undefined, { staleTime: 1000 * 60 * 10, retry: 1 });
  const liveSearchTerm = searchQuery.trim();
  const liveSearchQuery = trpc.music.search.useQuery(
    { query: liveSearchTerm || "music", limit: 12 },
    { enabled: liveSearchTerm.length > 0, staleTime: 1000 * 60 * 5, retry: 1 }
  );
  const playlistsQuery = trpc.playlists.list.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const likedQuery = trpc.likes.list.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const spotifyStatusQuery = trpc.spotify.status.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const spotifyPlaylistsQuery = trpc.spotify.playlists.useQuery(undefined, {
    enabled: isAuthenticated && Boolean(spotifyStatusQuery.data?.connected),
    retry: false,
  });
  const spotifyRecentQuery = trpc.spotify.recentlyPlayed.useQuery(undefined, {
    enabled: isAuthenticated && Boolean(spotifyStatusQuery.data?.connected),
    retry: false,
  });
  const aiTasteProfileQuery = trpc.music.getAiTasteProfile.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
  });
  const pastAiPlaylistsQuery = trpc.music.pastAiPlaylists.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });
  const trainAiMixMutation = trpc.music.trainAiMix.useMutation({
    onSuccess: (profile) => {
      playlistUtils.music.getAiTasteProfile.setData(undefined, profile);
      toast.success("AI Taste Engine updated from your latest library & history!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update AI model.");
    },
  });

  const [isConnectingSpotify, setIsConnectingSpotify] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const spotifyParam = params.get("spotify");
    const loginSuccess = params.get("login_success");
    const message = params.get("message");

    if (loginSuccess) {
      toast.success(`Welcome to Musivo! Signed in with ${loginSuccess === "google" ? "Google" : "Spotify"}.`);
    }

    if (spotifyParam === "connected") {
      setIsConnectingSpotify(false);
      toast.success("Spotify connected ✓ Library sync and Web Playback are ready.");
      void spotifyStatusQuery.refetch();
      void spotifyPlaylistsQuery.refetch();
      void spotifyRecentQuery.refetch();
      void playlistUtils.auth.me.invalidate();
    } else if (spotifyParam === "error") {
      setIsConnectingSpotify(false);
      const friendlyMessage =
        message && !message.includes("400") && !message.includes("status") && !message.includes("token request")
          ? message
          : "We couldn't connect to Spotify. Please try connecting again.";
      toast.error(friendlyMessage);
    } else if (spotifyParam === "denied") {
      setIsConnectingSpotify(false);
      toast.info(message ? `Spotify: ${message}` : "Spotify connection was cancelled.");
    }

    if (spotifyParam || loginSuccess || message) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("spotify");
      cleanUrl.searchParams.delete("login_success");
      cleanUrl.searchParams.delete("message");
      cleanUrl.searchParams.delete("auth_token");
      window.history.replaceState({}, document.title, cleanUrl.pathname + (cleanUrl.searchParams.toString() ? `?${cleanUrl.searchParams.toString()}` : "") + cleanUrl.hash);
    }
  }, []);

  const spotifyConnectMutation = trpc.spotify.connect.useMutation({
    onSuccess: ({ authorizeUrl }) => {
      window.location.href = authorizeUrl;
    },
    onError: (error) => {
      setIsConnectingSpotify(false);
      toast.error(error.message || "Failed to initiate Spotify connection.");
    },
  });

  const spotifySyncMutation = trpc.spotify.sync.useMutation({
    onSuccess: async (result) => {
      await Promise.all([
        spotifyPlaylistsQuery.refetch(),
        spotifyRecentQuery.refetch(),
        spotifyStatusQuery.refetch(),
        likedQuery.refetch(),
      ]);
      setLastSyncStats({
        playlists: result.playlists,
        recentlyPlayed: result.recentlyPlayed,
        savedTracks: result.savedTracks,
      });
      toast.success(
        `Synced ${result.playlists} playlists, ${result.savedTracks} saved tracks, and ${result.recentlyPlayed} recent tracks`
      );
    },
    onError: (error) => toast.error(error.message),
  });

  const spotifyCreatePlaylistMutation = trpc.spotify.createPlaylist.useMutation({
    onSuccess: (playlist) => {
      setShowSpotifyPlaylistDialog(false);
      setNewSpotifyPlaylistName("My Musivo favorites");
      toast.success(`Created ${playlist.name} in Spotify`);
    },
    onError: (error) => toast.error(error.message),
  });

  const aiMixMutation = trpc.music.createAiMix.useMutation({
    onSuccess: (result) => {
      setAiRecommendations(result.recommendations as AiRecommendation[]);
      setAiMixMeta({
        title: result.title,
        description: result.description,
        mood: result.mood,
      });
      toast.success(`Built ${result.title} with ${result.recommendations.length} tracks!`);
    },
    onError: (error) => toast.error(error.message),
  });

  const handleBuildAiMix = (
    moodOverride?: string,
    promptOverride?: string,
    seedPlaylistOverride?: string | number | null,
    isRefresh = false
  ) => {
    const mood = moodOverride ?? selectedMood;
    const prompt = promptOverride ?? customPrompt.trim();
    const seedId =
      seedPlaylistOverride !== undefined ? seedPlaylistOverride : selectedSeedPlaylistId;
    const refreshSeed = isRefresh ? Math.floor(Math.random() * 1000000) : undefined;
    aiMixMutation.mutate({
      mood,
      prompt: prompt || undefined,
      count: 8,
      saveToSpotify: Boolean(spotifyStatusQuery.data?.connected),
      seedPlaylistId: seedId ? seedId : undefined,
      searchIntent: searchQuery.trim() || undefined,
      refreshSeed,
    });
  };

  const handleLoadAiMixToQueue = () => {
    if (!aiRecommendations.length) return;
    const mixTracks = aiRecommendations.map(aiRecommendationToTrack);
    for (const track of mixTracks) {
      addToQueue(track);
    }
    toast.success(`Added ${mixTracks.length} tracks from AI Mix to queue`);
  };

  const handlePlayAiMix = () => {
    if (!aiRecommendations.length) return;
    const mixTracks = aiRecommendations.map(aiRecommendationToTrack);
    void playTrack(mixTracks[0], mixTracks);
    toast.success(`Playing AI Mix: ${aiMixMeta?.title || "Custom Mix"}`);
  };

  const handleSaveAiMixToLibrary = async () => {
    if (!aiRecommendations.length) return;
    try {
      const title = aiMixMeta?.title || `Musivo AI Mix (${new Date().toLocaleDateString()})`;
      const playlist = await createPlaylistMutation.mutateAsync({ name: title });
      const mixTracks = aiRecommendations.map(aiRecommendationToTrack);
      for (const track of mixTracks) {
        await addTrackMutation.mutateAsync({
          playlistId: playlist.id,
          track: toServerTrack(track),
        });
      }
      toast.success(`Saved all ${mixTracks.length} tracks to your library!`);
    } catch {
      toast.error("Failed to save AI mix to library.");
    }
  };

  const handleExportAiMixToSpotify = () => {
    if (!aiRecommendations.length) return;
    if (!spotifyStatusQuery.data?.connected) {
      connectSpotify();
      return;
    }
    const rawIds = aiRecommendations.map((r) => r.id.replace(/^spotify-/, ""));
    const title = aiMixMeta?.title || "Musivo AI Mix";
    spotifyCreatePlaylistMutation.mutate({
      name: title,
      description: aiMixMeta?.description || "Curated in Musivo AI Mix Studio",
      trackIds: rawIds,
    });
  };

  const spotifyDisconnectMutation = trpc.spotify.disconnect.useMutation({
    onSuccess: async () => {
      await Promise.all([
        spotifyStatusQuery.refetch(),
        spotifyPlaylistsQuery.refetch(),
        spotifyRecentQuery.refetch(),
      ]);
      toast.success("Spotify account disconnected");
      setActiveView("home");
    },
    onError: (error) => toast.error(error.message),
  });

  const createPlaylistMutation = trpc.playlists.create.useMutation({
    onSuccess: async (playlist) => {
      await playlistUtils.playlists.list.invalidate();
      setNewPlaylistName("");
      toast.success(`Created ${playlist.name}`);
      if (trackToSave) {
        await addTrackMutation.mutateAsync({
          playlistId: playlist.id,
          track: toServerTrack(trackToSave),
        });
        setTrackToSave(null);
      }
    },
    onError: (error) => toast.error(error.message),
  });

  const addTrackMutation = trpc.playlists.addTrack.useMutation({
    onSuccess: async () => {
      await playlistUtils.playlists.list.invalidate();
      toast.success("Saved to playlist");
      setTrackToSave(null);
      setShowPlaylistDialog(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const likeMutation = trpc.likes.toggle.useMutation({
    onSuccess: async (result) => {
      await likedQuery.refetch();
      toast.success(result.liked ? "Added to Liked Songs" : "Removed from Liked Songs");
    },
    onError: (error) => toast.error(error.message),
  });

  const catalog = useMemo(
    () => (homeQuery.data?.length ? homeQuery.data.map(toUiTrack) : fallbackTracks),
    [homeQuery.data]
  );
  const likedTracks = useMemo(
    () => (likedQuery.data ?? []).map(toUiTrack),
    [likedQuery.data]
  );
  const likedIds = useMemo(
    () => new Set(likedTracks.map((track) => String(track.id))),
    [likedTracks]
  );
  const liveResults = useMemo(
    () => (liveSearchQuery.data ?? []).map(toUiTrack),
    [liveSearchQuery.data]
  );
  const fallbackResults = useMemo(
    () =>
      catalog.filter((track) =>
        matchesTrackQuery(track, liveSearchTerm.toLowerCase())
      ),
    [catalog, liveSearchTerm]
  );
  const visibleSearchResults = liveResults.length > 0 ? liveResults : fallbackResults;
  const viewTracks = activeView === "liked" ? likedTracks : catalog;
  const greeting = user?.name?.split(" ")[0] || "listener";
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const [dashboardFilter, setDashboardFilter] = useState<"all" | "music" | "podcasts" | "aimix">("all");
  const [selectedGenreFilter, setSelectedGenreFilter] = useState<string>("all");

  const handleSurpriseMe = useCallback(() => {
    if (!catalog.length) return;
    const randomIndex = Math.floor(Math.random() * catalog.length);
    const surpriseTrack = catalog[randomIndex];
    void playTrack(surpriseTrack, catalog);
    toast.success(`Surprise Pick! Now streaming "${surpriseTrack.title}" by ${surpriseTrack.artist}`);
  }, [catalog, playTrack]);

  const filteredCatalog = useMemo(() => {
    if (selectedGenreFilter === "all") return catalog;
    const filterLower = selectedGenreFilter.toLowerCase();
    const matched = catalog.filter((track) => {
      const combined = `${track.title} ${track.artist} ${track.album ?? ""}`.toLowerCase();
      if (selectedGenreFilter === "pop") return combined.includes("pop") || combined.includes("love") || combined.includes("hit") || combined.includes("anthem");
      if (selectedGenreFilter === "lofi") return combined.includes("chill") || combined.includes("flow") || combined.includes("late") || combined.includes("soft") || combined.includes("rain");
      if (selectedGenreFilter === "electronic") return combined.includes("drive") || combined.includes("neon") || combined.includes("synth") || combined.includes("club") || combined.includes("vibe");
      if (selectedGenreFilter === "indie") return combined.includes("indie") || combined.includes("launch") || combined.includes("acoustic") || combined.includes("cafe");
      if (selectedGenreFilter === "rock") return combined.includes("rock") || combined.includes("faster") || combined.includes("guitar") || combined.includes("power");
      if (selectedGenreFilter === "acoustic") return combined.includes("acoustic") || combined.includes("soft") || combined.includes("morning") || combined.includes("coffee");
      if (selectedGenreFilter === "focus") return combined.includes("focus") || combined.includes("flow") || combined.includes("no lyrics") || combined.includes("deep");
      if (selectedGenreFilter === "ambient") return combined.includes("ambient") || combined.includes("night") || combined.includes("sleep") || combined.includes("dream");
      return combined.includes(filterLower);
    });
    return matched.length >= 4 ? matched : catalog;
  }, [catalog, selectedGenreFilter]);

  const popularArtists = useMemo(() => {
    const seen = new Set<string>();
    const list: { name: string; art: string }[] = [];
    for (const t of catalog) {
      if (t.artist && !seen.has(t.artist)) {
        seen.add(t.artist);
        list.push({ name: t.artist, art: t.art });
      }
    }
    return list;
  }, [catalog]);

  function toServerTrack(track: Track) {
    return {
      id: String(track.id),
      title: track.title,
      artist: track.artist,
      album: track.album,
      art: track.art,
      audio: track.audio || undefined,
      storeUrl: track.storeUrl,
      durationMs: track.durationMs ?? null,
    };
  }

  const handleNav = (id: string) => {
    setActiveView(id);
    if (id !== "spotify") setSelectedSpotifyPlaylist(null);
    setSearchQuery("");
    if ((id === "liked" || id === "playlists" || id === "spotify") && !isAuthenticated)
      startLogin();
    if (id === "albums") {
      setActiveView("search");
    }
  };

  const openPlaylistDialog = (track?: Track) => {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    setTrackToSave(track ?? null);
    setShowPlaylistDialog(true);
  };

  const toggleLike = (track: Track) => {
    if (!isAuthenticated) {
      toast.info("Sign in to keep your Liked Songs synced.");
      startLogin();
      return;
    }
    likeMutation.mutate(toServerTrack(track));
  };

  const connectSpotify = () => {
    setIsConnectingSpotify(true);
    if (!isAuthenticated) {
      const returnPath = window.location.pathname + window.location.search;
      window.location.href = `/api/auth/spotify?returnTo=${encodeURIComponent(returnPath)}`;
      return;
    }
    spotifyConnectMutation.mutate({ origin: window.location.origin });
  };

  const syncSpotify = () => {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    const steps = [
      "Connecting Spotify…",
      "Syncing your library…",
      "Syncing playlists…",
      "Syncing listening history…",
      "Almost ready…",
    ];
    let stepIndex = 0;
    setSyncStepText(steps[0]);
    const interval = setInterval(() => {
      stepIndex = (stepIndex + 1) % steps.length;
      setSyncStepText(steps[stepIndex]);
    }, 1200);

    spotifySyncMutation.mutate(undefined, {
      onSettled: () => {
        clearInterval(interval);
        setSyncStepText("");
      },
    });
  };

  const openSpotifyPlaylistDialog = () => {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    if (!spotifyStatusQuery.data?.connected) {
      toast.info("Connect Spotify first to create a playlist there.");
      setActiveView("spotify");
      return;
    }
    setShowSpotifyPlaylistDialog(true);
  };

  const createSpotifyPlaylist = () => {
    const trackIds = includeLikedInSpotifyPlaylist
      ? likedTracks
          .filter((track) => String(track.id).startsWith("spotify-"))
          .map((track) => String(track.id))
      : [];
    spotifyCreatePlaylistMutation.mutate({
      name: newSpotifyPlaylistName.trim(),
      description: "Created in Musivo",
      trackIds,
    });
  };

  const disconnectSpotify = () => {
    if (window.confirm("Disconnect Spotify and remove synced Spotify data from Musivo?"))
      spotifyDisconnectMutation.mutate();
  };

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) return;
    createPlaylistMutation.mutate({ name: newPlaylistName.trim() });
  };

  const showSearch = searchQuery.trim().length > 0;
  const featuredTrack = catalog[0] ?? fallbackTracks[0];
  const displayTracks = viewTracks.slice(0, 8);
  const isSpotifyCatalog = statusQuery.data?.provider === "spotify";

  return (
    <main className="noise min-h-[100dvh] bg-[#0d0f0d] text-[#f5f4ec] overflow-x-hidden">
      <div className="mx-auto flex min-h-[100dvh] max-w-[1600px] w-full">
        {/* Left Sidebar */}
        <aside className="hidden w-[250px] shrink-0 flex-col border-r border-white/[0.07] bg-[#0c0f12]/80 backdrop-blur-xl px-4 py-6 lg:flex">
          <div className="flex items-center gap-3 px-2">
            <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#f5ba42]/30 bg-[#16100a] shadow-[0_0_20px_rgba(245,186,66,0.25)]">
              <img
                src="/musivo-logo-transparent.png"
                alt="Musivo Logo"
                className="h-7 w-7 object-contain"
              />
            </div>
            <div>
              <span className="block font-display text-[22px] font-bold leading-none tracking-[-0.05em] text-[#faf5ee]">
                musivo<span className="text-[#f5ba42]">.</span>
              </span>
              <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.2em] text-[#8c7b68]">
                Music, Reimagined
              </span>
            </div>
          </div>

          {/* Browse / Discover Section */}
          <div className="mt-9">
            <p className="mb-2.5 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#786958]">
              Browse & Discover
            </p>
            <nav className="space-y-1">
              {navItems.map(({ id, label, icon: Icon }) => {
                const isActive = activeView === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleNav(id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs sm:text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-[#f5ba42] to-[#ffd064] font-semibold text-[#140f07] shadow-lg shadow-[#f5ba42]/20"
                        : "text-[#b2a28f] hover:bg-white/[0.05] hover:text-[#faf5ee]"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[#140f07]" : "text-[#8c7b68]"}`} />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Library Section */}
          <div className="mt-7">
            <p className="mb-2.5 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#786958]">
              My Music & Library
            </p>
            <nav className="space-y-1">
              {libraryItems.map(({ id, label, icon: Icon }) => {
                const isActive = activeView === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleNav(id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs sm:text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-white/[0.09] text-[#f5ba42] font-semibold border border-white/[0.08]"
                        : "text-[#b2a28f] hover:bg-white/[0.05] hover:text-[#faf5ee]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 truncate">
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[#f5ba42]" : "text-[#8c7b68]"}`} />
                      <span className="truncate">{label}</span>
                    </div>
                    {id === "liked" && likedTracks.length > 0 && (
                      <span className="ml-2 rounded-full bg-white/[0.07] px-2 py-0.5 font-mono text-[10px] text-[#b8a996]">
                        {likedTracks.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
            <button
              onClick={() => openPlaylistDialog()}
              className="mt-2.5 flex w-full items-center gap-2.5 rounded-xl border border-dashed border-white/[0.1] px-3 py-2 text-left text-xs font-semibold text-[#f5ba42] transition-colors hover:bg-white/[0.04] hover:border-[#f5ba42]/40"
            >
              <Plus className="h-4 w-4" />
              New Playlist
            </button>
            {isAuthenticated && (playlistsQuery.data ?? []).length > 0 && (
              <div className="mt-3.5 border-t border-white/[0.06] pt-2.5 space-y-0.5">
                {(playlistsQuery.data ?? []).slice(0, 4).map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => toast.info(`${playlist.name} is ready for track additions.`)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs text-[#9c8c79] hover:bg-white/[0.04] hover:text-[#faf5ee] transition-colors"
                  >
                    <Disc3 className="h-3.5 w-3.5 shrink-0 text-[#7a6b5a]" />
                    <span className="truncate">{playlist.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PWA Install Button (When installable) */}
          {canInstallPwa && (
            <button
              onClick={installPwa}
              className="mt-auto mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#f5ba42]/30 bg-[#f5ba42]/10 py-2.5 text-xs font-bold text-[#f5ba42] transition hover:bg-[#f5ba42] hover:text-[#140f07] shadow-[0_2px_12px_rgba(245,186,66,0.2)]"
            >
              <Download className="h-3.5 w-3.5" /> Install Musivo App
            </button>
          )}

          {/* Engine Status Card */}
          <div className={`${canInstallPwa ? "" : "mt-auto"} rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#18130c] to-[#120e09] p-3.5 shadow-lg`}>
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[#968572]">
                <span className={`h-2 w-2 rounded-full ${isSpotifyConnected ? "bg-emerald-400 animate-pulse" : "bg-[#f5ba42]"}`} />
                Engine
              </span>
              <span className="text-[10px] font-mono text-[#8a7966]">
                {isSpotifyConnected ? "Live" : "Preview"}
              </span>
            </div>
            <p className="text-xs font-semibold text-[#faf5ee]">
              {isSpotifyConnected ? "Spotify Web Playback" : "Musivo Preview Mode"}
            </p>
            <p className="mt-1 text-[11px] leading-4 text-[#9c8c79]">
              {isSpotifyConnected
                ? "Full in-app playback with Spotify Connect."
                : "Connect Spotify to play full catalog tracks."}
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/[0.07] bg-[#0a0d12]/85 px-4 py-3 sm:px-6 sm:py-3.5 backdrop-blur-2xl md:px-8 lg:px-10">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3.5">
              <button
                onClick={() => setIsMobileNavOpen(true)}
                aria-label="Open navigation menu"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-[#c2b2a0] hover:bg-white/[0.08] hover:text-white transition lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden xs:flex items-center shrink-0 lg:hidden">
                <img
                  src="/musivo-logo-transparent.png"
                  alt="Musivo"
                  className="h-7 w-7 object-contain drop-shadow-[0_0_8px_rgba(245,186,66,0.3)]"
                />
              </div>

              {/* JioSaavn Primary Category Navigation Tabs */}
              <div className="hidden md:flex items-center gap-1 shrink-0 mr-2">
                <button
                  type="button"
                  onClick={() => handleNav("home")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    activeView === "home" || activeView === "discover" || activeView === "releases"
                      ? "bg-white/[0.08] text-[#f5ba42]"
                      : "text-[#9a8976] hover:text-[#faf5ee] hover:bg-white/[0.04]"
                  }`}
                >
                  Music
                </button>
                <button
                  type="button"
                  onClick={() => handleNav("podcasts")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    activeView === "podcasts"
                      ? "bg-white/[0.08] text-[#f5ba42]"
                      : "text-[#9a8976] hover:text-[#faf5ee] hover:bg-white/[0.04]"
                  }`}
                >
                  Podcasts
                </button>
                <button
                  type="button"
                  onClick={() => handleNav("aimix")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    activeView === "aimix"
                      ? "bg-[#f5ba42]/20 text-[#f5ba42] border border-[#f5ba42]/30"
                      : "text-[#9a8976] hover:text-[#f5ba42] hover:bg-white/[0.04]"
                  }`}
                >
                  <Sparkles className="h-3 w-3 text-[#f5ba42]" />
                  <span>AI Mix</span>
                </button>
              </div>

              {/* JioSaavn-style Rounded-Full Universal Search Pill */}
              <div className="relative w-full max-w-[460px] group">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c7b68] group-focus-within:text-[#f5ba42] transition-colors" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search songs, artists, albums, or podcasts..."
                  className="h-10 w-full rounded-full border border-white/[0.09] bg-white/[0.04] pl-10 pr-9 text-xs sm:text-sm text-[#f5f4ec] placeholder:text-[#786958] outline-none transition-all duration-200 focus:border-[#f5ba42]/60 focus:bg-black/30 focus:shadow-[0_0_20px_rgba(245,186,66,0.12)]"
                />
                {showSearch ? (
                  <button
                    aria-label="Clear search"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c7b68] hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-flex absolute right-3.5 top-1/2 -translate-y-1/2 items-center rounded border border-white/[0.1] bg-white/[0.05] px-1.5 py-0.5 font-mono text-[9px] text-[#786958]">
                    /
                  </kbd>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
              <button
                onClick={() => toast.info("Settings are ready for your account and provider connections.")}
                className="hidden h-9 w-9 place-items-center rounded-full text-[#9c8c79] transition-colors hover:bg-white/[0.07] hover:text-white sm:grid"
                title="Settings"
              >
                <Settings2 className="h-4 w-4" />
              </button>

              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <div className="hidden text-right sm:block">
                    <p className="text-xs font-semibold text-[#faf5ee]">{user?.name || "Musivo Listener"}</p>
                    <p className="text-[10px] text-[#8c7b68]">Synced Library</p>
                  </div>
                  <button
                    onClick={() => void logout()}
                    disabled={authLoading}
                    className="flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] py-1 pl-1 pr-3 text-xs sm:text-sm font-semibold text-[#faf5ee] transition-all hover:border-[#f5ba42]/40 hover:bg-white/[0.07]"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-tr from-[#f5ba42] to-[#ffd064] text-xs font-bold text-[#140f07] shadow-sm">
                      {(user?.name || "M").slice(0, 1).toUpperCase()}
                    </span>
                    <span className="hidden sm:inline">Log out</span>
                    <ChevronDown className="h-3.5 w-3.5 text-[#8c7b68]" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startLogin()}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f5ba42] to-[#ffd064] px-4 py-2 text-xs sm:text-sm font-bold text-[#140f07] shadow-lg shadow-[#f5ba42]/20 transition-all hover:opacity-95 hover:scale-[1.02]"
                >
                  <span>Log in</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </header>

          <div className="px-3.5 py-4 sm:px-6 sm:py-6 md:px-8 lg:px-12 lg:py-8 pb-[calc(var(--bottom-nav-height,3.5rem)+6.5rem)] lg:pb-32">
            {autoplayBlocked && (
              <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-[#f5ba42]/30 bg-[#22160d] p-4 text-xs text-[#f5ba42]">
                <span>Browser audio autoplay was restricted. Press play to start playback in this browser.</span>
                <button
                  onClick={() => void togglePlay()}
                  className="rounded-full bg-[#f5ba42] px-4 py-1.5 font-bold text-[#140f07]"
                >
                  Play now
                </button>
              </div>
            )}

            {showSearch && activeView !== "search" ? (
              <section>
                <div className="mb-8 flex items-end justify-between gap-4">
                  <div>
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#a2927f]">
                      Live catalog search · {statusQuery.data?.label ?? "catalog"}
                    </p>
                    <h1 className="font-display text-3xl font-semibold tracking-[-0.05em] md:text-4xl">
                      Results for “{searchQuery}”
                    </h1>
                  </div>
                  <span className="font-mono text-xs text-[#90816f]">
                    {liveSearchQuery.isFetching ? "Searching…" : `${visibleSearchResults.length} matches`}
                  </span>
                </div>
                {visibleSearchResults.length > 0 ? (
                  <div className="max-w-3xl space-y-1">
                    {visibleSearchResults.map((track) => (
                      <TrackRow
                        key={track.id}
                        track={track}
                        onPlay={(t) => void playTrack(t, visibleSearchResults)}
                        onSave={openPlaylistDialog}
                        onLike={toggleLike}
                        onAddToQueue={(t) => addToQueue(t)}
                        active={String(currentTrack.id) === String(track.id) && isPlaying}
                        liked={likedIds.has(String(track.id))}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/[0.12] px-6 py-16 text-center">
                    <Search className="mx-auto mb-4 h-7 w-7 text-[#8f806e]" />
                    <p className="font-display text-lg font-semibold">No tracks found yet</p>
                    <p className="mt-1 text-sm text-[#9c8c79]">Try an artist, album, or a different mood.</p>
                  </div>
                )}
              </section>
            ) : activeView === "search" ? (
              <section className="space-y-6">
                <UniversalSearch />
              </section>
            ) : activeView === "stats" ? (
              <section className="space-y-6">
                <ListeningStatsView />
              </section>
            ) : activeView === "spotify" && selectedSpotifyPlaylist ? (
              <SpotifyPlaylistDetail
                key={selectedSpotifyPlaylist}
                externalId={selectedSpotifyPlaylist}
                onBack={() => setSelectedSpotifyPlaylist(null)}
                onPlay={(t) => void playTrack(t)}
                onSave={openPlaylistDialog}
                onLike={toggleLike}
                onAddToQueue={(t) => addToQueue(t)}
                likedIds={likedIds}
                activeTrackId={currentTrack.id}
                isPlaying={isPlaying}
              />
            ) : activeView === "spotify" ? (
              <SpotifyPanel
                connected={spotifyStatusQuery.data?.connected ?? false}
                displayName={spotifyStatusQuery.data?.displayName ?? null}
                profileImageUrl={spotifyStatusQuery.data?.profileImageUrl ?? null}
                streamingEnabled={Boolean(spotifyStatusQuery.data?.scope?.split(" ").includes("streaming"))}
                playlists={spotifyPlaylistsQuery.data ?? []}
                recentTracks={spotifyRecentQuery.data ?? []}
                loading={
                  spotifyStatusQuery.isLoading ||
                  spotifyPlaylistsQuery.isLoading ||
                  spotifyRecentQuery.isLoading
                }
                syncing={spotifySyncMutation.isPending}
                disconnecting={spotifyDisconnectMutation.isPending}
                connecting={isConnectingSpotify}
                onConnect={connectSpotify}
                onSync={syncSpotify}
                onDisconnect={disconnectSpotify}
                onOpenPlaylist={setSelectedSpotifyPlaylist}
                onPlay={(t) => void playTrack(t)}
                onCreatePlaylist={openSpotifyPlaylistDialog}
                creatingPlaylist={spotifyCreatePlaylistMutation.isPending}
                onBuildAiMix={() => handleBuildAiMix()}
                buildingAiMix={aiMixMutation.isPending}
                recommendations={aiRecommendations}
                onOpenAiMixStudio={() => setActiveView("aimix")}
                onPlayMix={handlePlayAiMix}
                isPremium={isPremium}
                user={user}
                savedTracksCount={lastSyncStats?.savedTracks ?? spotifyStatusQuery.data?.savedTracksCount ?? (likedTracks ?? []).length}
                syncStepText={syncStepText}
              />
            ) : activeView === "aimix" ? (
              <section className="space-y-6">
                <SubNavRibbon
                  activeTab="aimix"
                  onSelectTab={handleNav}
                  activeFilter={selectedGenreFilter}
                  onSelectFilter={setSelectedGenreFilter}
                  onSurpriseMe={handleSurpriseMe}
                />
                <AiMixStudio
                  recommendations={aiRecommendations}
                  meta={aiMixMeta}
                  selectedMood={selectedMood}
                  onSelectMood={(mood) => {
                    setSelectedMood(mood);
                    handleBuildAiMix(mood, undefined);
                  }}
                  customPrompt={customPrompt}
                  onChangePrompt={setCustomPrompt}
                  onBuildMix={() => handleBuildAiMix()}
                  onRefreshMix={() => handleBuildAiMix(undefined, undefined, undefined, true)}
                  buildingMix={aiMixMutation.isPending}
                  onPlayMix={handlePlayAiMix}
                  onPlayTrack={(t) => void playTrack(t, aiRecommendations.map(aiRecommendationToTrack))}
                  onSaveToLibrary={handleSaveAiMixToLibrary}
                  onExportToSpotify={handleExportAiMixToSpotify}
                  exportingSpotify={spotifyCreatePlaylistMutation.isPending}
                  isSpotifyConnected={Boolean(spotifyStatusQuery.data?.connected)}
                  activeTrackId={currentTrack.id}
                  isPlaying={isPlaying}
                  likedIds={likedIds}
                  onLike={toggleLike}
                  tasteProfile={aiTasteProfileQuery.data}
                  trainingModel={trainAiMixMutation.isPending}
                  onRetrainModel={() => trainAiMixMutation.mutate()}
                  pastAiPlaylists={pastAiPlaylistsQuery.data ?? []}
                  selectedSeedPlaylistId={selectedSeedPlaylistId}
                  onSelectSeedPlaylist={(id) => {
                    setSelectedSeedPlaylistId(id);
                    handleBuildAiMix(undefined, undefined, id);
                  }}
                  onAddToQueue={(track) => addToQueue(track)}
                  onAddAllToQueue={handleLoadAiMixToQueue}
                />
              </section>
            ) : activeView === "liked" ? (
              <section>
                <SectionHeading
                  eyebrow="Your library"
                  title="Liked songs"
                  action="Back home"
                  onAction={() => setActiveView("home")}
                />
                {likedTracks.length > 0 ? (
                  <div className="max-w-3xl space-y-1">
                    {likedTracks.map((track) => (
                      <TrackRow
                        key={track.id}
                        track={track}
                        onPlay={(t) => void playTrack(t, likedTracks)}
                        onSave={openPlaylistDialog}
                        onLike={toggleLike}
                        onAddToQueue={(t) => addToQueue(t)}
                        active={String(currentTrack.id) === String(track.id) && isPlaying}
                        liked
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/[0.12] px-6 py-16 text-center">
                    <Heart className="mx-auto mb-4 h-7 w-7 text-[#f5ba42]" />
                    <p className="font-display text-lg font-semibold">Your Liked Songs are waiting</p>
                    <p className="mt-1 text-sm text-[#9c8c79]">
                      Tap the heart beside any track to keep it synced to your account.
                    </p>
                  </div>
                )}
              </section>
            ) : activeView === "playlists" ? (
              <section className="space-y-8">
                <SubNavRibbon
                  activeTab="playlists"
                  onSelectTab={handleNav}
                  activeFilter={selectedGenreFilter}
                  onSelectFilter={setSelectedGenreFilter}
                  onSurpriseMe={handleSurpriseMe}
                />
                <div>
                  <SectionHeader
                    eyebrow="Your Library"
                    title="Playlists"
                    subtitle="Collections and playlists saved to your account"
                    action="Create New"
                    onAction={() => openPlaylistDialog()}
                  />
                  {(playlistsQuery.data ?? []).length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {(playlistsQuery.data ?? []).map((playlist) => (
                        <button
                          key={playlist.id}
                          onClick={() => toast.info(`${playlist.name} is ready for track additions.`)}
                          className="flex min-h-[132px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#17110a] p-5 text-left transition-colors hover:border-[#c88719] hover:bg-[#231a10]"
                        >
                          <ListMusic className="h-5 w-5 text-[#f5ba42]" />
                          <span>
                            <p className="font-display text-lg font-semibold">{playlist.name}</p>
                            <p className="mt-1 text-xs text-[#948472]">Synced to your account</p>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/[0.12] px-6 py-12 text-center">
                      <ListMusic className="mx-auto mb-4 h-7 w-7 text-[#f5ba42]" />
                      <p className="font-display text-lg font-semibold">Build your first playlist</p>
                      <p className="mt-1 text-sm text-[#9c8c79]">
                        Save catalog tracks into a collection that follows you.
                      </p>
                      <button
                        onClick={() => openPlaylistDialog()}
                        className="mt-5 rounded-full bg-[#f5ba42] px-4 py-2 text-sm font-bold text-[#140f07]"
                      >
                        Create playlist
                      </button>
                    </div>
                  )}
                </div>

                {/* JioSaavn-style Top Playlists Shelf */}
                <div className="mt-8">
                  <SectionHeader
                    eyebrow="Top Playlists"
                    title="Featured Playlists"
                    subtitle="Curated collections ready to stream right now"
                    action="Explore All"
                    onAction={() => setActiveView("discover")}
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
                    {mixes.map((mix, idx) => (
                      <div
                        key={`playlist-shelf-${mix.title}`}
                        onClick={() => {
                          const target = catalog[idx % Math.max(catalog.length, 1)] ?? fallbackTracks[0];
                          void playTrack(target, catalog);
                          toast.success(`${mix.title} is now playing`);
                        }}
                        className="group relative flex flex-col p-3 rounded-2xl bg-[#16110a] hover:bg-[#20180f] border border-white/[0.06] hover:border-[#f5ba42]/30 transition-all duration-300 cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-1"
                      >
                        <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-2.5 bg-[#24170c] shadow-md">
                          <img
                            src={mix.art}
                            alt={mix.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <button
                            type="button"
                            aria-label={`Play ${mix.title}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              const target = catalog[idx % Math.max(catalog.length, 1)] ?? fallbackTracks[0];
                              void playTrack(target, catalog);
                              toast.success(`${mix.title} is now playing`);
                            }}
                            className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-[#f5ba42] text-[#140f07] shadow-2xl flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 hover:scale-110 active:scale-95 z-10"
                          >
                            <Play className="h-4 w-4 fill-current ml-0.5" />
                          </button>
                        </div>
                        <p className="font-semibold text-xs sm:text-sm text-[#faf5ee] truncate group-hover:text-[#f5ba42] transition-colors">
                          {mix.title}
                        </p>
                        <p className="text-[11px] sm:text-xs text-[#9a8976] truncate mt-0.5">
                          {mix.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : activeView === "podcasts" ? (
              <section className="space-y-6">
                <SubNavRibbon
                  activeTab="podcasts"
                  onSelectTab={handleNav}
                  activeFilter={selectedGenreFilter}
                  onSelectFilter={setSelectedGenreFilter}
                  onSurpriseMe={handleSurpriseMe}
                />
                <PodcastView />
              </section>
            ) : activeView === "discover" ? (
              <section className="space-y-8">
                <SubNavRibbon
                  activeTab="discover"
                  onSelectTab={handleNav}
                  activeFilter={selectedGenreFilter}
                  onSelectFilter={setSelectedGenreFilter}
                  onSurpriseMe={handleSurpriseMe}
                />

                {/* Top Music Charts Banner Shelf (Screenshot 3) */}
                <div>
                  <SectionHeader
                    eyebrow="Charts & Leaderboards"
                    title="Top Music Charts"
                    subtitle="The most played and trending soundscapes across Musivo"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <ChartBannerCard
                      title="Top 50 - Musivo Global"
                      subtitle="Updated daily · Worldwide most streamed"
                      badge="TOP 50"
                      image={catalog[0]?.art}
                      gradient="from-[#3a2211] via-[#22160d] to-[#140d08]"
                      isCurrent={Boolean(catalog[0] && currentTrack.id === catalog[0].id)}
                      isPlaying={isPlaying && Boolean(catalog[0] && currentTrack.id === catalog[0].id)}
                      onClick={() => catalog[0] && void playTrack(catalog[0], catalog)}
                      onPlay={() => catalog[0] && void playTrack(catalog[0], catalog)}
                    />
                    <ChartBannerCard
                      title="Trending Today"
                      subtitle="Viral breakout hits & indie discoveries"
                      badge="TRENDING"
                      image={catalog[1]?.art}
                      gradient="from-[#2e1919] via-[#1e1310] to-[#120d09]"
                      isCurrent={Boolean(catalog[1] && currentTrack.id === catalog[1].id)}
                      isPlaying={isPlaying && Boolean(catalog[1] && currentTrack.id === catalog[1].id)}
                      onClick={() => catalog[1] && void playTrack(catalog[1], catalog)}
                      onPlay={() => catalog[1] && void playTrack(catalog[1], catalog)}
                    />
                    <ChartBannerCard
                      title="Musivo Superhits"
                      subtitle="Certified chart-toppers & crowd favorites"
                      badge="SUPERHITS"
                      image={catalog[2]?.art}
                      gradient="from-[#1c271e] via-[#151c14] to-[#0e140d]"
                      isCurrent={Boolean(catalog[2] && currentTrack.id === catalog[2].id)}
                      isPlaying={isPlaying && Boolean(catalog[2] && currentTrack.id === catalog[2].id)}
                      onClick={() => catalog[2] && void playTrack(catalog[2], catalog)}
                      onPlay={() => catalog[2] && void playTrack(catalog[2], catalog)}
                    />
                    <ChartBannerCard
                      title="Late Night Lo-Fi"
                      subtitle="Smooth ambient & relaxing chill sessions"
                      badge="LO-FI"
                      image={catalog[3]?.art}
                      gradient="from-[#1e1e32] via-[#151522] to-[#0d0d16]"
                      isCurrent={Boolean(catalog[3] && currentTrack.id === catalog[3].id)}
                      isPlaying={isPlaying && Boolean(catalog[3] && currentTrack.id === catalog[3].id)}
                      onClick={() => catalog[3] && void playTrack(catalog[3], catalog)}
                      onPlay={() => catalog[3] && void playTrack(catalog[3], catalog)}
                    />
                  </div>
                </div>

                {/* Top Ranked Songs */}
                <div>
                  <SectionHeader
                    eyebrow="Right Now"
                    title="Chart Toppers"
                    subtitle="Ranked in real-time by total streams"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                    {catalog.slice(0, 12).map((track, idx) => (
                      <MusicCard
                        key={`chart-top-${track.id}`}
                        track={track}
                        rank={idx + 1}
                        isCurrent={currentTrack.id === track.id}
                        isPlaying={isPlaying && currentTrack.id === track.id}
                        isLiked={likedIds.has(String(track.id))}
                        onPlay={() => void playTrack(track, catalog)}
                        onLike={() => toggleLike(track)}
                        onAddToQueue={() => addToQueue(track)}
                      />
                    ))}
                  </div>
                </div>

                {/* Mood & Soundscapes Grid */}
                <div>
                  <SectionHeader
                    eyebrow="Moods & Genres"
                    title="Curated Moods & Vibes"
                    subtitle="Soundscapes tailored for every frame of mind"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                    {MOOD_OPTIONS.map((mood) => (
                      <button
                        key={mood.id}
                        type="button"
                        onClick={() => {
                          setSelectedMood(mood.id);
                          setActiveView("aimix");
                          handleBuildAiMix(mood.id, undefined);
                        }}
                        className={`group flex flex-col justify-between p-4 rounded-2xl bg-gradient-to-br ${mood.gradient} border border-white/[0.08] hover:border-white/[0.2] transition-all duration-300 text-left cursor-pointer hover:scale-[1.02] shadow-lg`}
                      >
                        <span className="text-2xl sm:text-3xl mb-3 block">{mood.emoji}</span>
                        <div>
                          <p className="font-semibold text-xs sm:text-sm text-[#faf5ee] group-hover:text-[#f5ba42] transition-colors">
                            {mood.name}
                          </p>
                          <p className="text-[10px] text-[#9a8976] line-clamp-2 mt-1">
                            {mood.vibe}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Full Catalog Multi-Column Responsive Grid */}
                <div>
                  <SectionHeader
                    eyebrow="Complete Collection"
                    title={`All Tracks & Catalog (${catalog.length})`}
                    subtitle="Every master recording available in your current audio library"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                    {catalog.map((track) => (
                      <MusicCard
                        key={`discover-track-${track.id}`}
                        track={track}
                        isCurrent={currentTrack.id === track.id}
                        isPlaying={isPlaying && currentTrack.id === track.id}
                        isLiked={likedIds.has(String(track.id))}
                        onPlay={() => void playTrack(track, catalog)}
                        onLike={() => toggleLike(track)}
                        onAddToQueue={() => addToQueue(track)}
                      />
                    ))}
                  </div>
                </div>
              </section>
            ) : activeView === "releases" ? (
              <section className="space-y-8">
                <SubNavRibbon
                  activeTab="releases"
                  onSelectTab={handleNav}
                  activeFilter={selectedGenreFilter}
                  onSelectFilter={setSelectedGenreFilter}
                  onSurpriseMe={handleSurpriseMe}
                />

                {/* Featured Release Hero Banner */}
                {featuredTrack && (
                  <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#f5ba42]/25 bg-gradient-to-br from-[#2a1d10] via-[#1c140c] to-[#120d08] p-5 sm:p-8 shadow-2xl">
                    <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#f5ba42]/15 blur-3xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-7">
                      <img
                        src={featuredTrack.art}
                        alt={featuredTrack.title}
                        className="h-28 w-28 sm:h-36 sm:w-36 rounded-2xl object-cover shadow-2xl shrink-0 border border-white/10"
                      />
                      <div className="min-w-0 flex-1 space-y-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5ba42]/20 border border-[#f5ba42]/30 px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#f5ba42]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#f5ba42] animate-ping" />
                          Featured Release
                        </span>
                        <h2 className="font-display text-xl sm:text-3xl font-bold text-[#faf5ee] truncate">
                          {featuredTrack.title}
                        </h2>
                        <p className="text-sm text-[#bcaea0] truncate">
                          {featuredTrack.artist} · {featuredTrack.album}
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => void playTrack(featuredTrack, catalog)}
                            className="inline-flex items-center gap-2 rounded-full bg-[#f5ba42] hover:bg-[#ffd064] px-5 py-2 text-xs font-bold text-[#140f07] shadow-lg transition hover:scale-105 active:scale-95"
                          >
                            <Play className="h-4 w-4 fill-current" />
                            Play now
                          </button>
                          <button
                            type="button"
                            onClick={() => addToQueue(featuredTrack)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] px-4 py-2 text-xs font-semibold text-[#faf5ee] transition"
                          >
                            <ListPlus className="h-4 w-4" />
                            Add to queue
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* New Releases Multi-Column Grid */}
                <div>
                  <SectionHeader
                    eyebrow="Fresh Drops"
                    title="Latest Singles & Drops"
                    subtitle="Newly released singles, master recordings, and recent album cuts"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                    {catalog.map((track) => (
                      <MusicCard
                        key={`release-track-${track.id}`}
                        track={track}
                        badge="NEW"
                        isCurrent={currentTrack.id === track.id}
                        isPlaying={isPlaying && currentTrack.id === track.id}
                        isLiked={likedIds.has(String(track.id))}
                        onPlay={() => void playTrack(track, catalog)}
                        onLike={() => toggleLike(track)}
                        onAddToQueue={() => addToQueue(track)}
                      />
                    ))}
                  </div>
                </div>
              </section>
            ) : (
              <>
                {/* JioSaavn-style Sub-Navigation Ribbon (Tabs + Surprise Me + Genre/Vibe Scroller) */}
                <SubNavRibbon
                  activeTab="home"
                  onSelectTab={handleNav}
                  activeFilter={selectedGenreFilter}
                  onSelectFilter={setSelectedGenreFilter}
                  onSurpriseMe={handleSurpriseMe}
                />

                {/* JioSaavn-style Quick-Access 6-Tile Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5 mb-7 sm:mb-10">
                  <QuickAccessCard
                    title="Liked Songs"
                    subtitle={`${likedTracks.length} saved tracks`}
                    icon={<Heart className="h-5 w-5 fill-current text-[#140f07]" />}
                    onClick={() => setActiveView("liked")}
                    onPlay={(e) => {
                      e.stopPropagation();
                      if (likedTracks.length) void playTrack(likedTracks[0], likedTracks);
                      else setActiveView("liked");
                    }}
                  />

                  <QuickAccessCard
                    title="AI Mix Studio"
                    subtitle="Curated neural soundscapes"
                    icon={<Sparkles className="h-5 w-5 text-[#140f07]" />}
                    onClick={() => setActiveView("aimix")}
                    onPlay={(e) => {
                      e.stopPropagation();
                      setActiveView("aimix");
                    }}
                  />

                  {catalog.slice(0, 4).map((track) => (
                    <QuickAccessCard
                      key={`quick-${track.id}`}
                      title={track.title}
                      subtitle={track.artist}
                      art={track.art}
                      isActive={currentTrack.id === track.id}
                      onClick={() => void playTrack(track, catalog)}
                      onPlay={(e) => {
                        e.stopPropagation();
                        void playTrack(track, catalog);
                      }}
                    />
                  ))}
                </div>

                {/* Editorial Hero Banner with rotating vinyl record */}
                <section className="relative overflow-hidden rounded-2xl sm:rounded-[26px] border border-[#f5ba42]/20 bg-[#24170c] shadow-[0_16px_60px_rgba(0,0,0,0.4)] mb-8 sm:mb-10">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(245,186,66,0.32),transparent_32%),linear-gradient(105deg,#24170c_0%,#352010_45%,#150e08_100%)]" />
                  <div className="absolute -right-20 -top-32 h-[420px] w-[420px] rounded-full border border-[#f5ba42]/25 bg-[#f5ba42]/15 blur-3xl pointer-events-none" />
                  
                  {/* Right-side Vinyl Sleeve Display */}
                  <div className="absolute bottom-0 right-0 top-0 hidden w-[44%] items-center justify-center overflow-hidden pr-8 md:flex pointer-events-none">
                    <div className="relative group">
                      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-[#f5ba42]/30 to-[#ffd064]/15 blur-2xl opacity-70" />
                      
                      {/* Rotating Vinyl Record Disc */}
                      <div className="absolute -right-10 top-3 h-48 w-48 rounded-full bg-[#100c07] border border-white/10 shadow-2xl flex items-center justify-center rotate-45 transition-transform duration-700">
                        <div className="h-36 w-36 rounded-full border border-white/5 flex items-center justify-center">
                          <div className="h-24 w-24 rounded-full border border-white/10 flex items-center justify-center bg-[#1c140d]">
                            <div className="h-10 w-10 rounded-full bg-[#f5ba42] flex items-center justify-center text-[#140f07]">
                              <Disc3 className="h-6 w-6 animate-[spin_8s_linear_infinite]" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Main Featured Album Art */}
                      <div className="relative h-56 w-56 overflow-hidden rounded-2xl border border-white/15 bg-[#1a120b] shadow-2xl">
                        <img
                          src={featuredTrack.art}
                          alt={featuredTrack.title}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="truncate text-xs font-semibold text-white drop-shadow">
                            {featuredTrack.title}
                          </p>
                          <p className="truncate text-[11px] text-[#d6c8b6] drop-shadow">
                            {featuredTrack.artist}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative max-w-[650px] px-4 py-5 sm:px-8 sm:py-8 md:px-9 md:py-10 lg:px-11 lg:py-12">
                    <div className="mb-3 sm:mb-6 flex items-center gap-2.5 sm:gap-3">
                      <span className="rounded-full bg-gradient-to-r from-[#f5ba42] to-[#ffd064] px-2.5 py-1 font-mono text-[9px] font-bold tracking-[0.16em] text-[#140f07] shadow-sm">
                        {isSpotifyConnected ? "SPOTIFY CONNECTED" : "FEATURED RECORD"}
                      </span>
                      <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.16em] text-[#d8c9a8]">
                        {catalog.length} TRACKS AVAILABLE
                      </span>
                    </div>
                    <h2 className="font-display max-w-[570px] text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.05] tracking-[-0.05em] text-[#faf5ee]">
                      Stream your favorite music with Musivo<span className="text-[#f5ba42]">.</span>
                    </h2>
                    <p className="mt-2.5 sm:mt-5 max-w-[440px] text-xs sm:text-sm leading-5 sm:leading-6 text-[#d6c8b6] md:text-[15px]">
                      Discover a world of sound with Musivo, where every genre, creator, and mood is at your fingertips, ready to be explored.
                    </p>
                    <div className="mt-4 sm:mt-8 flex flex-wrap items-center gap-2.5 sm:gap-3">
                      <button
                        onClick={() => void playTrack(featuredTrack, catalog)}
                        className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ffd064] via-[#f5ba42] to-[#e09b26] px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-bold text-[#140f07] shadow-[0_8px_28px_rgba(245,186,66,0.35)] hover:opacity-95 hover:scale-[1.02] transition"
                      >
                        <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" /> Start listening
                      </button>
                      <button
                        onClick={() => setActiveView("discover")}
                        className="rounded-full border border-white/20 px-3.5 py-2 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-[#faf5ee] hover:bg-white/10 transition"
                      >
                        Explore the mix
                      </button>
                    </div>
                  </div>

                  <div className="relative flex items-center gap-3 border-t border-white/[0.09] bg-black/20 px-4 py-2.5 sm:px-8 sm:py-3 lg:px-11">
                    <div className="waveform">
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                    <p className="text-[11px] sm:text-xs text-[#cbbca8]">
                      Your daily mix is ready{" "}
                      <span className="text-[#8a7a67]">· refreshed just now</span>
                    </p>
                  </div>
                </section>

                <SpotifyConnectSection
                  isAuthenticated={isAuthenticated}
                  connected={isSpotifyConnected}
                  displayName={spotifyStatusQuery.data?.displayName ?? null}
                  syncing={spotifySyncMutation.isPending}
                  connecting={isConnectingSpotify}
                  playlistCount={(spotifyPlaylistsQuery.data ?? []).length}
                  savedTracksCount={lastSyncStats?.savedTracks ?? spotifyStatusQuery.data?.savedTracksCount ?? (likedTracks ?? []).length}
                  recentCount={(spotifyRecentQuery.data ?? []).length}
                  syncStepText={syncStepText}
                  user={user}
                  onConnect={connectSpotify}
                  onSync={syncSpotify}
                  onOpen={() => setActiveView("spotify")}
                />

                {/* Section 1: "Trending Now" (JioSaavn Screenshot 1) */}
                <section className="mt-8 sm:mt-10">
                  <SectionHeader
                    eyebrow="Trending Now"
                    title="Trending Now"
                    subtitle={selectedGenreFilter === "all" ? "The hottest tracks streaming across Musivo right now" : `Top trending tracks for ${selectedGenreFilter}`}
                    action="See all"
                    onAction={() => setActiveView("discover")}
                  />
                  <div className="flex sm:grid overflow-x-auto sm:overflow-visible gap-3 sm:gap-4 snap-x pb-2 hide-scrollbar sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {filteredCatalog.slice(0, 10).map((track) => (
                      <MusicCard
                        key={`trending-${track.id}`}
                        track={track}
                        isCurrent={currentTrack.id === track.id}
                        isPlaying={isPlaying && currentTrack.id === track.id}
                        isLiked={likedIds.has(String(track.id))}
                        onPlay={() => void playTrack(track, filteredCatalog)}
                        onLike={() => toggleLike(track)}
                        onAddToQueue={() => addToQueue(track)}
                        className="min-w-[155px] w-[155px] sm:min-w-0 sm:w-auto snap-start shrink-0 sm:shrink"
                      />
                    ))}
                  </div>
                </section>

                {/* Section 2: "Top Music Charts" Wide 16:9 Banner Cards (JioSaavn Screenshot 3) */}
                <section className="mt-8 sm:mt-10">
                  <SectionHeader
                    eyebrow="Charts & Countdowns"
                    title="Top Music Charts"
                    subtitle="The most streamed chart-toppers and weekly countdowns across genres"
                    action="All Charts"
                    onAction={() => setActiveView("discover")}
                  />
                  <div className="flex sm:grid overflow-x-auto sm:overflow-visible gap-3 sm:gap-4 snap-x pb-2 hide-scrollbar sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    <ChartBannerCard
                      title="Top 50 - Musivo Global"
                      subtitle="Updated daily · Worldwide most streamed"
                      badge="TOP 50"
                      image={catalog[0]?.art}
                      gradient="from-[#3a2211] via-[#22160d] to-[#140d08]"
                      isCurrent={Boolean(catalog[0] && currentTrack.id === catalog[0].id)}
                      isPlaying={isPlaying && Boolean(catalog[0] && currentTrack.id === catalog[0].id)}
                      onClick={() => catalog[0] && void playTrack(catalog[0], catalog)}
                      onPlay={() => catalog[0] && void playTrack(catalog[0], catalog)}
                      className="min-w-[240px] w-[240px] sm:min-w-0 sm:w-auto snap-start shrink-0 sm:shrink"
                    />
                    <ChartBannerCard
                      title="Trending Today"
                      subtitle="Viral breakout hits & indie discoveries"
                      badge="TRENDING"
                      image={catalog[1]?.art}
                      gradient="from-[#2e1919] via-[#1e1310] to-[#120d09]"
                      isCurrent={Boolean(catalog[1] && currentTrack.id === catalog[1].id)}
                      isPlaying={isPlaying && Boolean(catalog[1] && currentTrack.id === catalog[1].id)}
                      onClick={() => catalog[1] && void playTrack(catalog[1], catalog)}
                      onPlay={() => catalog[1] && void playTrack(catalog[1], catalog)}
                      className="min-w-[240px] w-[240px] sm:min-w-0 sm:w-auto snap-start shrink-0 sm:shrink"
                    />
                    <ChartBannerCard
                      title="Musivo Superhits"
                      subtitle="Certified chart-toppers & crowd favorites"
                      badge="SUPERHITS"
                      image={catalog[2]?.art}
                      gradient="from-[#1c271e] via-[#151c14] to-[#0e140d]"
                      isCurrent={Boolean(catalog[2] && currentTrack.id === catalog[2].id)}
                      isPlaying={isPlaying && Boolean(catalog[2] && currentTrack.id === catalog[2].id)}
                      onClick={() => catalog[2] && void playTrack(catalog[2], catalog)}
                      onPlay={() => catalog[2] && void playTrack(catalog[2], catalog)}
                      className="min-w-[240px] w-[240px] sm:min-w-0 sm:w-auto snap-start shrink-0 sm:shrink"
                    />
                    <ChartBannerCard
                      title="Late Night Lo-Fi"
                      subtitle="Smooth ambient & relaxing chill sessions"
                      badge="LO-FI"
                      image={catalog[3]?.art}
                      gradient="from-[#1e1e32] via-[#151522] to-[#0d0d16]"
                      isCurrent={Boolean(catalog[3] && currentTrack.id === catalog[3].id)}
                      isPlaying={isPlaying && Boolean(catalog[3] && currentTrack.id === catalog[3].id)}
                      onClick={() => catalog[3] && void playTrack(catalog[3], catalog)}
                      onPlay={() => catalog[3] && void playTrack(catalog[3], catalog)}
                      className="min-w-[240px] w-[240px] sm:min-w-0 sm:w-auto snap-start shrink-0 sm:shrink"
                    />
                    <ChartBannerCard
                      title="India Top 20"
                      subtitle="Top Bollywood and regional chartbusters"
                      badge="TOP 20"
                      image={catalog[4]?.art}
                      gradient="from-[#302114] via-[#1f1710] to-[#120d09]"
                      isCurrent={Boolean(catalog[4] && currentTrack.id === catalog[4].id)}
                      isPlaying={isPlaying && Boolean(catalog[4] && currentTrack.id === catalog[4].id)}
                      onClick={() => catalog[4] && void playTrack(catalog[4], catalog)}
                      onPlay={() => catalog[4] && void playTrack(catalog[4], catalog)}
                      className="min-w-[240px] w-[240px] sm:min-w-0 sm:w-auto snap-start shrink-0 sm:shrink"
                    />
                  </div>
                </section>

                {/* Section 3: "New Songs" (JioSaavn Screenshot 2) */}
                <section className="mt-8 sm:mt-10">
                  <SectionHeader
                    eyebrow="Fresh Releases"
                    title="New Songs"
                    subtitle="Newly added singles, master recordings, and recent drops"
                    action="All releases"
                    onAction={() => setActiveView("releases")}
                  />
                  <div className="flex sm:grid overflow-x-auto sm:overflow-visible gap-3 sm:gap-4 snap-x pb-2 hide-scrollbar sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {catalog.slice(2, 12).map((track) => (
                      <MusicCard
                        key={`new-song-${track.id}`}
                        track={track}
                        badge="NEW"
                        isCurrent={currentTrack.id === track.id}
                        isPlaying={isPlaying && currentTrack.id === track.id}
                        isLiked={likedIds.has(String(track.id))}
                        onPlay={() => void playTrack(track, catalog)}
                        onLike={() => toggleLike(track)}
                        onAddToQueue={() => addToQueue(track)}
                        className="min-w-[155px] w-[155px] sm:min-w-0 sm:w-auto snap-start shrink-0 sm:shrink"
                      />
                    ))}
                  </div>
                </section>

                {/* Section 3: AI Mix Studio Showcase Banner */}
                <div className="mt-8 sm:mt-10 overflow-hidden rounded-2xl sm:rounded-3xl border border-[#f5ba42]/20 bg-gradient-to-br from-[#291e14] via-[#1f160e] to-[#140e08] p-5 sm:p-8 shadow-xl relative">
                  <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#f5ba42]/10 blur-3xl pointer-events-none" />
                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5">
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2 text-[#f5ba42]">
                        <Sparkles className="h-4 w-4 animate-pulse" />
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] font-bold">
                          AI Mix Studio
                        </span>
                      </div>
                      <h2 className="font-display text-lg sm:text-2xl font-bold text-[#faf5ee] tracking-tight">
                        Curate your personal soundscape with AI
                      </h2>
                      <p className="text-xs sm:text-sm text-[#cbbca8] leading-relaxed">
                        Choose from crafted mood presets or describe any vibe to generate and stream full-length playlists instantly.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveView("aimix")}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f5ba42] to-[#ffd064] hover:opacity-95 px-6 py-3 text-xs font-bold text-[#140f07] shadow-lg transition hover:scale-[1.03] shrink-0"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Open AI Mix Studio
                    </button>
                  </div>
                </div>

                {/* Section 4: "Popular Artists" Circular Avatar Carousel */}
                {popularArtists.length > 0 && (
                  <section className="mt-8 sm:mt-10">
                    <SectionHeader
                      eyebrow="Discover Voices"
                      title="Popular Artists"
                      subtitle="Featured creators and vocalists shaping the soundscape"
                      action="Explore"
                      onAction={() => setActiveView("search")}
                    />
                    <div className="flex overflow-x-auto gap-4 pb-3 hide-scrollbar snap-x">
                      {popularArtists.slice(0, 10).map((artist) => (
                        <ArtistCard
                          key={artist.name}
                          name={artist.name}
                          image={artist.art}
                          category="Artist"
                          onClick={() => setSelectedArtistId(artist.name)}
                          className="min-w-[125px] w-[125px] sm:min-w-[145px] sm:w-[145px] snap-start shrink-0"
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Section 5: Curated Musivo Mood Blends */}
                <section className="mt-8 sm:mt-10">
                  <SectionHeader
                    eyebrow="Your Sound, Expanded"
                    title="Made for your next move"
                    subtitle="Specially crafted vibe mixes for work, travel, and unwinding"
                    action="View all"
                    onAction={() => setActiveView("discover")}
                  />
                  <div className="flex sm:grid overflow-x-auto sm:overflow-visible gap-3 sm:gap-4 snap-x pb-2 hide-scrollbar sm:grid-cols-2 lg:grid-cols-3">
                    {mixes.map((mix, index) => (
                      <button
                        key={mix.title}
                        onClick={() => {
                          const target =
                            catalog[index % Math.max(catalog.length, 1)] ?? fallbackTracks[0];
                          void playTrack(target, catalog);
                          toast.success(`${mix.title} is now playing`);
                        }}
                        className={`group relative min-h-[150px] sm:min-h-[178px] min-w-[230px] w-[230px] sm:min-w-0 sm:w-auto snap-start shrink-0 sm:shrink overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br ${mix.gradient} p-4 sm:p-5 text-left transition-transform duration-300 hover:-translate-y-1`}
                      >
                        <img
                          src={mix.art}
                          alt=""
                          className="absolute -bottom-8 -right-8 h-36 w-36 sm:h-40 sm:w-40 rotate-6 rounded-2xl object-cover opacity-70 shadow-2xl transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110"
                        />
                        <div className="relative z-10 max-w-[170px]">
                          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/45">
                            MUSIVO MIX
                          </span>
                          <p className="mt-3 sm:mt-4 font-display text-lg sm:text-xl font-semibold tracking-[-0.05em] text-white">
                            {mix.title}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-white/55">{mix.detail}</p>
                        </div>
                        <span className="absolute bottom-3.5 left-4 sm:bottom-4 sm:last:left-5 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-[#f5ba42] opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100">
                          <Play className="h-3.5 w-3.5 fill-current" />
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Section 6: "Top Playlists" (JioSaavn Screenshot 4) */}
                <section className="mt-8 sm:mt-10">
                  <SectionHeader
                    eyebrow="Top Playlists"
                    title="Top Playlists"
                    subtitle="Handcrafted playlists curated for every vibe, mood, and moment"
                    action="All playlists"
                    onAction={() => setActiveView("playlists")}
                  />
                  <div className="flex sm:grid overflow-x-auto sm:overflow-visible gap-3 sm:gap-4 snap-x pb-2 hide-scrollbar sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {mixes.map((mix, idx) => (
                      <div
                        key={`home-playlist-${mix.title}`}
                        onClick={() => {
                          const target = catalog[idx % Math.max(catalog.length, 1)] ?? fallbackTracks[0];
                          void playTrack(target, catalog);
                          toast.success(`${mix.title} is now playing`);
                        }}
                        className="group relative flex flex-col p-3 rounded-2xl bg-[#16110a] hover:bg-[#20180f] border border-white/[0.06] hover:border-[#f5ba42]/30 transition-all duration-300 cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-1 min-w-[160px] w-[160px] sm:min-w-0 sm:w-auto snap-start shrink-0 sm:shrink"
                      >
                        <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-2.5 bg-[#24170c] shadow-md">
                          <img
                            src={mix.art}
                            alt={mix.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <button
                            type="button"
                            aria-label={`Play ${mix.title}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              const target = catalog[idx % Math.max(catalog.length, 1)] ?? fallbackTracks[0];
                              void playTrack(target, catalog);
                              toast.success(`${mix.title} is now playing`);
                            }}
                            className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-[#f5ba42] text-[#140f07] shadow-2xl flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 hover:scale-110 active:scale-95 z-10"
                          >
                            <Play className="h-4 w-4 fill-current ml-0.5" />
                          </button>
                        </div>
                        <p className="font-semibold text-xs sm:text-sm text-[#faf5ee] truncate group-hover:text-[#f5ba42] transition-colors">
                          {mix.title}
                        </p>
                        <p className="text-[11px] sm:text-xs text-[#9a8976] truncate mt-0.5">
                          {mix.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Persistent Bottom Musivo Player */}
      <div className="fixed inset-x-0 bottom-[var(--bottom-nav-height,3.5rem)] lg:bottom-0 z-40 lg:z-50 border-t border-white/[0.09] bg-[#100c08]/95 shadow-[0_-16px_50px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition-all">
        {/* Mobile Top Progress Line Indicator (Spotify Mobile Style) */}
        <div className="absolute top-0 inset-x-0 h-[2.5px] bg-white/[0.08] sm:hidden overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#ffd064] via-[#f5ba42] to-[#e09b26] transition-all duration-300"
            style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
          />
        </div>

        <div className="relative mx-auto max-w-[1600px] px-3.5 py-2 sm:px-6 sm:py-3 md:px-8 lg:px-12">
          {showPlaybackDiagnostics && (
            <PlaybackDiagnostics
              connected={isSpotifyConnected}
              sdkLoaded={sdkLoaded}
              connectionState={spotifyConnectionState}
              deviceId={deviceId}
              error={playbackError}
              isPremium={isPremium}
              playbackMode={playbackMode}
            />
          )}

          <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3 md:gap-5">
            {/* Left Track Info (Click to open Now Playing view on mobile) */}
            <div
              onClick={() => setIsNowPlayingModalOpen(true)}
              className="flex min-w-0 max-w-[56%] sm:max-w-none sm:w-[28%] sm:flex-none items-center gap-2.5 sm:gap-3 cursor-pointer group/track"
            >
              <img
                src={currentTrack.art}
                alt=""
                className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-lg object-cover shadow-md group-hover/track:scale-105 transition-transform"
              />
              <div className="min-w-0">
                <p className="truncate text-xs sm:text-[13px] font-semibold text-[#faf5ee] group-hover/track:text-[#f5ba42] transition-colors">
                  {currentTrack.title}
                </p>
                <p className="truncate text-[11px] sm:text-xs text-[#a2927f]">{currentTrack.artist}</p>
              </div>
              <div
                className={`player-eq hidden xs:flex ${isPlaying ? "" : "paused"}`}
                aria-label={isPlaying ? "Playing" : "Paused"}
              >
                <span />
                <span />
                <span />
              </div>
              <button
                aria-label="Like current song"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike(currentTrack);
                }}
                className={`ml-1 hidden sm:grid h-9 w-9 place-items-center rounded-full hover:bg-white/[0.08] transition ${
                  likedIds.has(String(currentTrack.id))
                    ? "text-[#f5ba42]"
                    : "text-[#887967] hover:text-white"
                }`}
              >
                <Heart
                  className="h-4 w-4"
                  fill={likedIds.has(String(currentTrack.id)) ? "currentColor" : "none"}
                />
              </button>
            </div>

            {/* Middle Playback Controls */}
            <div className="flex shrink-0 sm:flex-1 flex-col items-center gap-1 sm:gap-1.5 md:max-w-[520px]">
              <div className="flex items-center gap-1.5 sm:gap-3 text-[#948472]">
                <button
                  aria-label="Shuffle queue"
                  onClick={shuffleQueue}
                  className="hidden sm:grid h-9 w-9 place-items-center rounded-full text-[#948472] hover:bg-white/[0.08] hover:text-[#f5ba42] transition active:scale-95 shrink-0"
                  title="Shuffle queue"
                >
                  <Shuffle className="h-4 w-4" />
                </button>
                <button
                  aria-label="Previous track"
                  onClick={() => void skip(-1)}
                  className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full text-[#948472] hover:bg-white/[0.08] hover:text-white transition active:scale-95 shrink-0"
                >
                  <SkipBack className="h-4 w-4 sm:h-4.5 sm:w-4.5 fill-current" />
                </button>
                <button
                  aria-label={isPlaying ? "Pause" : "Play"}
                  onClick={() => void togglePlay()}
                  className="grid h-9 w-9 sm:h-11 sm:w-11 place-items-center rounded-full bg-[#faf5ee] text-[#131811] hover:bg-[#f5ba42] hover:scale-105 active:scale-95 transition-all shadow-md shrink-0"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                  ) : (
                    <Play className="ml-0.5 h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                  )}
                </button>
                <button
                  aria-label="Next track"
                  onClick={() => void skip(1)}
                  className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full text-[#948472] hover:bg-white/[0.08] hover:text-white transition active:scale-95 shrink-0"
                >
                  <SkipForward className="h-4 w-4 sm:h-4.5 sm:w-4.5 fill-current" />
                </button>

                {/* Spotify Full-Length Indicator or Sign-in Action */}
                {playbackMode === "spotify" ? (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#f5ba42]/15 px-2 py-0.5 text-[9px] font-semibold text-[#f5ba42]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#f5ba42] animate-pulse" />
                    Spotify Full Stream
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#f5ba42]/15 px-2 py-0.5 text-[9px] font-semibold text-[#f5ba42]">
                    Full Length Audio
                  </span>
                )}

                <button
                  aria-label={`Repeat mode: ${repeatMode}`}
                  onClick={toggleRepeatMode}
                  className={`hidden sm:inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 transition active:scale-95 ${
                    repeatMode !== "off"
                      ? "text-[#f5ba42] drop-shadow-[0_0_8px_rgba(245,186,66,0.4)] bg-[#f5ba42]/10"
                      : "text-[#948472] hover:bg-white/[0.08] hover:text-[#f5ba42]"
                  }`}
                  title={`Repeat: ${repeatMode.toUpperCase()}`}
                >
                  {repeatMode === "one" ? (
                    <Repeat1 className="h-4 w-4" />
                  ) : (
                    <Repeat2 className="h-4 w-4" />
                  )}
                  {repeatMode !== "off" && (
                    <span className="font-mono text-[9px] font-bold">
                      {repeatMode === "one" ? "1" : "ALL"}
                    </span>
                  )}
                </button>
                <button
                  aria-label="Sleep timer"
                  onClick={() => setIsPlayerSleepModalOpen(true)}
                  className={`sm:hidden grid h-9 w-9 place-items-center rounded-full transition shrink-0 ${
                    sleepTimer
                      ? "text-[#f5ba42] bg-[#f5ba42]/10"
                      : "text-[#8e7f6e] hover:bg-white/[0.08] hover:text-[#f5ba42]"
                  }`}
                  title="Sleep Timer"
                >
                  <Moon className="h-4 w-4" />
                </button>
                <button
                  aria-label="Toggle playback queue"
                  onClick={() => setIsQueueOpen((prev) => !prev)}
                  className="sm:hidden grid h-9 w-9 place-items-center rounded-full text-[#8e7f6e] hover:bg-white/[0.08] hover:text-[#f5ba42] transition shrink-0"
                  title="Queue"
                >
                  <ListMusic className="h-4 w-4" />
                </button>
                <button
                  aria-label="Playback diagnostics"
                  onClick={() => setShowPlaybackDiagnostics((visible) => !visible)}
                  className="md:hidden grid h-9 w-9 place-items-center rounded-full text-[#8e7f6e] hover:bg-white/[0.08] hover:text-[#f5ba42] transition shrink-0"
                >
                  <Headphones className="h-4 w-4" />
                </button>
              </div>

              {/* Progress Slider */}
              <div className="hidden w-full items-center gap-2 sm:flex">
                <span className="w-8 text-right font-mono text-[9px] text-[#7d6e5d]">
                  {formatTime(progress)}
                </span>
                <input
                  aria-label="Seek"
                  type="range"
                  min="0"
                  max={duration || (currentTrack.durationMs ? Math.round(currentTrack.durationMs / 1000) : 100)}
                  value={progress}
                  onChange={(event) => void seek(Number(event.target.value))}
                  className="h-1 w-full cursor-pointer accent-[#f5ba42]"
                />
                <span className="w-8 font-mono text-[9px] text-[#7d6e5d]">
                  {duration ? formatTime(duration) : currentTrack.duration}
                </span>
              </div>
            </div>

            {/* Right Tools & Volume */}
            <div className="hidden w-[28%] items-center justify-end gap-2 md:flex">
              {/* Sleep Timer */}
              <button
                aria-label="Sleep Timer"
                onClick={() => setIsPlayerSleepModalOpen(true)}
                className={`relative rounded-xl p-2 transition ${
                  sleepTimer
                    ? "bg-[#f5ba42]/20 text-[#f5ba42]"
                    : "text-[#8e7f6e] hover:bg-white/[0.06] hover:text-[#faf5ee]"
                }`}
                title={
                  sleepTimer
                    ? `Sleep timer active: ${sleepTimerRemainingSec ? formatTime(sleepTimerRemainingSec) : "Running"}`
                    : "Set Sleep Timer"
                }
              >
                <Moon className="h-4 w-4" />
                {sleepTimer && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#f5ba42] animate-pulse" />
                )}
              </button>

              {/* Connected Devices */}
              <button
                aria-label="Connect Devices"
                onClick={() => setIsPlayerDeviceModalOpen(true)}
                className="rounded-xl p-2 text-[#8e7f6e] hover:bg-white/[0.06] hover:text-[#faf5ee] transition"
                title="Connect Devices"
              >
                <Laptop className="h-4 w-4" />
              </button>

              {/* Playback Queue */}
              <button
                aria-label="Toggle playback queue"
                onClick={() => setIsQueueOpen((prev) => !prev)}
                className={`relative rounded-xl p-2 transition ${
                  isQueueOpen
                    ? "bg-[#f5ba42]/20 text-[#f5ba42]"
                    : "text-[#8e7f6e] hover:bg-white/[0.06] hover:text-[#faf5ee]"
                }`}
                title="Playback Queue"
              >
                <ListMusic className="h-4 w-4" />
                {queue.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f5ba42] px-1 font-mono text-[9px] font-bold text-[#100c08]">
                    {queue.length}
                  </span>
                )}
              </button>

              {/* Playback Diagnostics */}
              <button
                aria-label="Playback diagnostics"
                onClick={() => setShowPlaybackDiagnostics((visible) => !visible)}
                className={`rounded-xl p-2 transition ${
                  showPlaybackDiagnostics
                    ? "bg-[#f5ba42]/20 text-[#f5ba42]"
                    : "text-[#8e7f6e] hover:bg-white/[0.06] hover:text-[#faf5ee]"
                }`}
                title="Audio Diagnostics"
              >
                <Headphones className="h-4 w-4" />
              </button>

              {/* Clickable Volume Mute Toggle & Slider */}
              <div className="flex items-center gap-1.5 ml-1">
                <button
                  type="button"
                  aria-label={volume === 0 ? "Unmute volume" : "Mute volume"}
                  onClick={() => {
                    if (volume > 0) {
                      prevVolumeRef.current = volume;
                      void setVolume(0);
                    } else {
                      void setVolume(prevVolumeRef.current || 70);
                    }
                  }}
                  className="rounded-lg p-1 text-[#8e7f6e] hover:text-[#faf5ee] transition"
                  title={volume === 0 ? "Unmute" : "Mute"}
                >
                  {volume === 0 ? (
                    <VolumeX className="h-4 w-4 text-rose-400" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
                <input
                  aria-label="Volume"
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(event) => void setVolume(Number(event.target.value))}
                  className="w-20 cursor-pointer accent-[#f5ba42]"
                />
              </div>

              {/* Full-Screen Now Playing View */}
              <button
                aria-label="Full-Screen View"
                onClick={() => setIsNowPlayingModalOpen(true)}
                className="rounded-xl p-2 text-[#8e7f6e] hover:bg-white/[0.06] hover:text-[#faf5ee] transition"
                title="Full-Screen Player"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* JioSaavn-style Floating Right Edge Queue Tab */}
      <button
        type="button"
        onClick={() => setIsQueueOpen((prev) => !prev)}
        className={`hidden xl:flex fixed right-0 top-1/2 -translate-y-1/2 z-30 items-center gap-2 py-3.5 px-2 rounded-l-xl border-l border-t border-b border-white/[0.12] bg-[#1a140d]/90 hover:bg-[#251b11] backdrop-blur-md shadow-2xl text-[#d6c8b6] hover:text-[#f5ba42] transition-all group ${
          isQueueOpen ? "bg-[#251b11] text-[#f5ba42] border-[#f5ba42]/40 ring-1 ring-[#f5ba42]/30" : ""
        }`}
        style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        title="Toggle Playback Queue"
      >
        <ListMusic className="h-4 w-4 -rotate-90 text-[#f5ba42] group-hover:scale-110 transition-transform" />
        <span className="font-semibold text-xs tracking-wider">Queue</span>
        {queue.length > 0 && (
          <span className="h-4 w-4 rounded-full bg-[#f5ba42] text-[#140f07] text-[10px] font-bold flex items-center justify-center -rotate-90 mt-1">
            {queue.length}
          </span>
        )}
      </button>

      {/* Playback Queue Drawer */}
      <QueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        queue={queue}
        repeatMode={repeatMode}
        onToggleRepeat={toggleRepeatMode}
        onPlayTrack={(track) => void playTrack(track, queue)}
        onRemoveFromQueue={removeFromQueue}
        onClearQueue={clearQueue}
        onShuffleQueue={shuffleQueue}
        onLoadAiMixToQueue={handleLoadAiMixToQueue}
        hasAiMix={aiRecommendations.length > 0}
      />

      {/* Playlist Dialog */}
      {showPlaylistDialog && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 px-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/[0.1] bg-[#1a130c] p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a2927f]">
                  Your library
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.05em]">
                  {trackToSave ? "Save to playlist" : "Create a playlist"}
                </h2>
                {trackToSave && (
                  <p className="mt-1 max-w-[270px] truncate text-xs text-[#9c8c79]">
                    {trackToSave.title} · {trackToSave.artist}
                  </p>
                )}
              </div>
              <button
                aria-label="Close playlist dialog"
                onClick={() => setShowPlaylistDialog(false)}
                className="rounded-xl p-2 text-[#928372] hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {isAuthenticated && trackToSave && (
              <div className="mb-5 max-h-44 space-y-1 overflow-y-auto">
                {(playlistsQuery.data ?? []).map((playlist) => (
                  <button
                    key={playlist.id}
                    disabled={addTrackMutation.isPending}
                    onClick={() =>
                      addTrackMutation.mutate({
                        playlistId: playlist.id,
                        track: toServerTrack(trackToSave),
                      })
                    }
                    className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3 text-left text-sm text-[#faf5ee] hover:border-[#c88719] hover:bg-white/[0.06]"
                  >
                    <span className="flex items-center gap-2">
                      <ListMusic className="h-4 w-4 text-[#f5ba42]" />
                      {playlist.name}
                    </span>
                    <Plus className="h-4 w-4 text-[#988877]" />
                  </button>
                ))}
                {(playlistsQuery.data ?? []).length === 0 && (
                  <p className="rounded-xl border border-dashed border-white/[0.1] px-4 py-6 text-center text-xs text-[#9c8c79]">
                    Create your first playlist below.
                  </p>
                )}
              </div>
            )}
            <div className="border-t border-white/[0.08] pt-4">
              <p className="mb-2 text-xs font-semibold text-[#d4c5b3]">New playlist</p>
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={newPlaylistName}
                  onChange={(event) => setNewPlaylistName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") createPlaylist();
                  }}
                  placeholder="e.g. Sunday morning"
                  className="h-11 min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-black/20 px-3 text-sm text-white placeholder:text-[#7d6e5d] outline-none focus:border-[#e6a325]"
                />
                <button
                  disabled={!newPlaylistName.trim() || createPlaylistMutation.isPending}
                  onClick={createPlaylist}
                  className="rounded-xl bg-[#f5ba42] px-4 text-sm font-bold text-[#140f07] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Create
                </button>
              </div>
            </div>
            {!isAuthenticated && (
              <button
                onClick={() => startLogin()}
                className="mt-4 w-full rounded-xl border border-white/[0.1] px-4 py-3 text-sm font-semibold text-[#f5ba42] hover:bg-white/[0.05]"
              >
                Sign in to save playlists
              </button>
            )}
          </div>
        </div>
      )}

      {/* Spotify Playlist Dialog */}
      {showSpotifyPlaylistDialog && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 px-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[#f5ba42]/15 bg-[#1a130c] p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#caa972]">
                  Spotify account
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.05em]">
                  Create a Spotify playlist
                </h2>
                <p className="mt-1 text-xs leading-5 text-[#a2927f]">
                  The playlist will be private and created directly in your Spotify account.
                </p>
              </div>
              <button
                aria-label="Close Spotify playlist dialog"
                onClick={() => setShowSpotifyPlaylistDialog(false)}
                className="rounded-xl p-2 text-[#928372] hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              autoFocus
              value={newSpotifyPlaylistName}
              onChange={(event) => setNewSpotifyPlaylistName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") createSpotifyPlaylist();
              }}
              placeholder="Playlist name"
              className="h-12 w-full rounded-xl border border-white/[0.08] bg-black/20 px-3 text-sm text-white placeholder:text-[#7d6e5d] outline-none focus:border-[#e6a325]"
            />
            <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-3 text-xs text-[#dbcebc]">
              <input
                type="checkbox"
                checked={includeLikedInSpotifyPlaylist}
                onChange={(event) => setIncludeLikedInSpotifyPlaylist(event.target.checked)}
                className="h-4 w-4 accent-[#f5ba42]"
              />
              <span>
                Add my{" "}
                {
                  likedTracks.filter((track) => String(track.id).startsWith("spotify-"))
                    .length
                }{" "}
                liked synced tracks
              </span>
            </label>
            <button
              disabled={!newSpotifyPlaylistName.trim() || spotifyCreatePlaylistMutation.isPending}
              onClick={createSpotifyPlaylist}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f5ba42] px-4 py-3 text-sm font-bold text-[#140f07] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {spotifyCreatePlaylistMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating playlist…
                </>
              ) : (
                "Create private Spotify playlist"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Mobile & Tablet Slide-Over Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        activeView={activeView}
        onSelectView={(viewId) => {
          handleNav(viewId);
          setIsMobileNavOpen(false);
        }}
        navItems={navItems}
        libraryItems={libraryItems}
        isSpotifyConnected={isSpotifyConnected}
        canInstallPwa={canInstallPwa}
        onInstallPwa={installPwa}
      />

      {/* Mobile Bottom Navigation Bar (Spotify mobile style) */}
      <BottomNavBar
        activeView={activeView}
        onSelectView={(viewId) => handleNav(viewId)}
        likedCount={likedTracks.length}
      />

      {/* Full-Screen Now Playing Sheet/Modal */}
      <NowPlayingModal
        isOpen={isNowPlayingModalOpen}
        onClose={() => setIsNowPlayingModalOpen(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        progress={progress}
        duration={duration}
        playbackMode={playbackMode}
        repeatMode={repeatMode}
        isLiked={likedIds.has(String(currentTrack.id))}
        onTogglePlay={() => void togglePlay()}
        onSkip={(direction) => void skip(direction)}
        onSeek={(seconds) => void seek(seconds)}
        onToggleLike={() => toggleLike(currentTrack)}
        onToggleRepeat={toggleRepeatMode}
        onShuffle={shuffleQueue}
        onOpenQueue={() => setIsQueueOpen(true)}
      />

      {/* Artist Detail Modal */}
      <ArtistDetailModal
        artistId={selectedArtistId}
        isOpen={Boolean(selectedArtistId)}
        onClose={() => setSelectedArtistId(null)}
        onSelectAlbum={(albId) => {
          setSelectedArtistId(null);
          setSelectedAlbumId(albId);
        }}
      />

      {/* Album Detail Modal */}
      <AlbumDetailModal
        albumId={selectedAlbumId}
        isOpen={Boolean(selectedAlbumId)}
        onClose={() => setSelectedAlbumId(null)}
      />

      {/* Sleep Timer Modal */}
      <SleepTimerModal
        isOpen={isPlayerSleepModalOpen}
        onClose={() => setIsPlayerSleepModalOpen(false)}
      />

      {/* Spotify Connect Device Selector Modal */}
      <DeviceSelectorModal
        isOpen={isPlayerDeviceModalOpen}
        onClose={() => setIsPlayerDeviceModalOpen(false)}
      />
    </main>
  );
}
