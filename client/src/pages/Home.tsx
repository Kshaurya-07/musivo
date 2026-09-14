import { useEffect, useMemo, useState } from "react";
import {
  Album,
  ArrowRight,
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
  ListMusic,
  ListPlus,
  Link2,
  Menu,
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
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { formatTime, matchesTrackQuery } from "@/lib/musivo";
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
  { id: "fallback-8", title: "Love Tonight", artist: "Shouse", album: "Open", duration: "4:01", art: art.purple, audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", accent: "#7be3b5", durationMs: 241000, source: "fallback" },
];

const mixes = [
  { title: "late night drive", detail: "A little faster, a little further", art: art.neon, gradient: "from-[#263716] to-[#131c12]" },
  { title: "focus / flow", detail: "No lyrics. No distractions.", art: art.blue, gradient: "from-[#162b3b] to-[#111719]" },
  { title: "soft launch", detail: "New sounds worth sharing", art: art.cream, gradient: "from-[#493a24] to-[#181612]" },
];

const navItems: NavItem[] = [
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "aimix", label: "AI Mix Studio", icon: Sparkles },
  { id: "discover", label: "Discover", icon: Compass },
  { id: "releases", label: "New releases", icon: Sparkles },
  { id: "podcasts", label: "Podcasts", icon: Podcast },
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
    gradient: "from-[#172836] to-[#10171d]",
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
              active ? "text-[#f5ba42]" : "text-[#f3f3ea]"
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
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#919c8b]">
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-xl font-semibold tracking-[-0.03em] text-[#f2f4eb] md:text-2xl">
          {title}
        </h2>
      </div>
      {action && (
        <button
          onClick={onAction}
          className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[#959e91] transition-colors hover:text-[#f5ba42]"
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
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#9aa697] hover:text-[#f5ba42]"
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
            <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-[#293421] md:h-40 md:w-40">
              {playlist?.imageUrl && (
                <img src={playlist.imageUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#899789]">
                Spotify playlist
              </p>
              <h1 className="truncate font-display text-3xl font-semibold tracking-[-0.06em] text-[#f1f4ea] md:text-5xl">
                {playlist?.name}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a2927f]">
                {playlist?.description || "Synced from your Spotify library."}
              </p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#718069]">
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
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a8478]" />
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
              <p className="mt-1 text-sm text-[#7f887d]">
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
                <p className="truncate text-xs text-[#a9b3a7]">
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
                <span className="text-[11px] text-[#7a8479]">
                  Auto-advances smoothly
                </span>
              )}
            </div>

            {upcoming.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center space-y-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04] text-[#899388] mx-auto">
                  <ListMusic className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#d4dcd2]">Queue is empty</p>
                  <p className="text-[11px] text-[#7a8579] leading-relaxed max-w-[260px] mx-auto">
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
                        <span className="w-4 font-mono text-[11px] text-[#6b756a] text-center shrink-0">
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
                          <p className="truncate text-[11px] text-[#869085]">
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] font-mono text-[#6c766b] mr-1">
                          {track.duration}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveFromQueue(absoluteIdx)}
                          title="Remove from queue"
                          className="rounded-lg p-1.5 text-[#6c766b] hover:bg-white/10 hover:text-[#ef6b5e] transition"
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
            <p className="font-display text-base font-semibold text-[#8ce28a] truncate">
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
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-full bg-[#1db954] hover:bg-[#1ed760] px-4 py-2.5 text-xs font-bold text-black transition"
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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 font-medium text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
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
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#899789]">
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
                className="rounded-full border border-[#f5ba42]/30 px-4 py-2.5 text-sm font-semibold text-[#f5ba42] hover:bg-[#f5ba42]/10"
              >
                Reconnect for playback
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={onConnect}
            className="flex items-center gap-2 rounded-full bg-[#f5ba42] px-4 py-2.5 text-sm font-bold text-[#140f07]"
          >
            <Link2 className="h-4 w-4" />
            Connect Spotify
          </button>
        )}
      </div>


      {!connected ? (
        <div className="rounded-3xl border border-white/[0.08] bg-[#17110a] p-8">
          <Link2 className="h-8 w-8 text-[#f5ba42]" />
          <h2 className="mt-5 font-display text-2xl font-semibold tracking-[-0.04em]">
            Your listening space, connected.
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#899388]">
            Authorize Musivo to stream your music via the Spotify Web Playback SDK and read your playlists. Tokens remain securely encrypted on the server.
          </p>
          <button
            onClick={onConnect}
            className="mt-6 rounded-full bg-[#f5ba42] px-5 py-3 text-sm font-bold text-[#140f07]"
          >
            Continue with Spotify
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
              <p className="truncate text-sm font-semibold text-[#ebf1e2]">
                Connected{displayName ? ` as ${displayName}` : " to Spotify"}
              </p>
              <p className="text-xs text-[#99aa90]">
                {syncing
                  ? "Fetching playlists and listening history…"
                  : streamingEnabled
                  ? "Spotify Web Playback SDK is connected. Audio plays directly inside Musivo."
                  : "Reconnect Spotify to enable in-app playback."}
              </p>
            </div>
            <span className="rounded-full border border-[#f5ba42]/20 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#b8d66b]">
              Account connected
            </span>
          </div>

          <div className="mb-8 grid gap-3 grid-cols-2 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/[0.08] bg-[#17110a] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#718069]">Synced playlists</p>
              <p className="mt-1 font-display text-2xl font-semibold text-[#f0f4e9]">{playlists.length}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-[#17110a] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#718069]">Saved tracks</p>
              <p className="mt-1 font-display text-2xl font-semibold text-[#f0f4e9]">{savedTracksCount ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-[#17110a] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#718069]">Recent tracks</p>
              <p className="mt-1 font-display text-2xl font-semibold text-[#f0f4e9]">{recentTracks.length}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-[#17110a] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#718069]">Playback SDK</p>
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
              <p className="text-sm font-semibold text-[#edf2e8]">Create a playlist without leaving Musivo</p>
              <p className="mt-1 text-xs leading-5 text-[#879383]">
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
                          <div className="h-14 w-14 overflow-hidden rounded-xl bg-[#273321]">
                            {playlist.imageUrl && (
                              <img
                                src={playlist.imageUrl}
                                alt=""
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-[#718069]">
                            {playlist.trackCount} tracks
                          </span>
                        </div>
                        <div>
                          <p className="truncate font-display text-lg font-semibold text-[#edf2e8]">
                            {playlist.name}
                          </p>
                          <p className="mt-1 truncate text-xs text-[#7f8b7c]">
                            Open detailed track listing
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/[0.12] px-5 py-12 text-center text-sm text-[#7f887d]">
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
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#273321]">
                          {track.artworkUrl && (
                            <img
                              src={track.artworkUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#e9ede3]">
                            {track.title}
                          </p>
                          <p className="truncate text-xs text-[#948472]">
                            {track.artist} · {track.album || "Single"}
                          </p>
                        </div>
                        <span className="hidden font-mono text-[10px] text-[#7b6c5b] sm:block">
                          {new Date(track.playedAt).toLocaleDateString()}
                        </span>
                        <History className="h-4 w-4 text-[#718069] transition-colors group-hover:text-[#f5ba42]" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/[0.12] px-5 py-12 text-center text-sm text-[#7f887d]">
                    No recent plays returned yet. Tap Sync now to refresh.
                  </div>
                )}
              </div>
            </div>
          )}
          <p className="mt-7 text-xs text-[#6f7a6e]">
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
    <section className="mt-10 overflow-hidden rounded-3xl border border-[#f5ba42]/15 bg-gradient-to-br from-[#1b2815] via-[#151c13] to-[#140e08] p-5 md:p-7">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        {user?.hasGoogle ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 font-medium text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
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
            <h2 className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#f1f5e8]">
              {connected
                ? `Spotify is synced${displayName ? ` · ${displayName}` : ""}`
                : "Connect your Spotify account"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a1ae9b]">
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
                className="rounded-full border border-white/[0.14] px-4 py-2.5 text-sm font-semibold text-[#e4ebdc] hover:border-[#f5ba42]/50"
              >
                Open synced library
              </button>
            </>
          ) : (
            <button
              onClick={onConnect}
              className="rounded-full bg-[#f5ba42] px-5 py-2.5 text-sm font-bold text-[#140f07] hover:bg-[#ffd064]"
            >
              {isAuthenticated ? "Connect Spotify" : "Log in to connect Spotify"}
            </button>
          )}
        </div>
      </div>
      {connected ? (
        <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/[0.07] bg-black/10 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#718069]">
              Synced playlists
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-[#f0f4e9]">
              {playlistCount}
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-black/10 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#718069]">
              Saved tracks
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-[#f0f4e9]">
              {savedTracksCount}
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-black/10 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#718069]">
              Recent tracks
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-[#f0f4e9]">
              {recentCount}
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-black/10 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#718069]">
              SDK Player
            </p>
            <p className="mt-1 text-sm font-semibold text-[#f5ba42]">
              Active in Musivo
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#a8b79d]">
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
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#899789]">
            Playback diagnostics
          </p>
          <p className="mt-1 text-sm font-semibold text-[#edf2e8]">
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
          <span className={sdkLoaded ? "text-[#f5ba42]" : "text-[#a5afa1]"}>
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
                : "text-[#a5afa1]"
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
  } = usePlayback();

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [selectedSeedPlaylistId, setSelectedSeedPlaylistId] = useState<string | number | null>(null);

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
      toast.success("Spotify connected successfully! Library sync is ready.");
      spotifyStatusQuery.refetch();
      spotifyPlaylistsQuery.refetch();
      spotifyRecentQuery.refetch();
      playlistUtils.auth.me.invalidate();
    } else if (spotifyParam === "error") {
      toast.error(message ? `Spotify connection error: ${message}` : "Spotify connection failed. Please try again.");
    } else if (spotifyParam === "denied") {
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
    onError: (error) => toast.error(error.message),
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
    seedPlaylistOverride?: string | number | null
  ) => {
    const mood = moodOverride ?? selectedMood;
    const prompt = promptOverride ?? customPrompt.trim();
    const seedId =
      seedPlaylistOverride !== undefined ? seedPlaylistOverride : selectedSeedPlaylistId;
    aiMixMutation.mutate({
      mood,
      prompt: prompt || undefined,
      count: 8,
      saveToSpotify: Boolean(spotifyStatusQuery.data?.connected),
      seedPlaylistId: seedId ? seedId : undefined,
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

  useEffect(() => {
    const result = new URLSearchParams(window.location.search).get("spotify");
    if (!result) return;
    if (result === "connected") {
      toast.success("Spotify connected — in-app Web Playback SDK is active.");
      void spotifyStatusQuery.refetch();
    } else if (result === "denied") {
      toast.info("Spotify connection was cancelled.");
    } else if (result === "error") {
      toast.error("Spotify could not be connected. Please try again.");
    }
    window.history.replaceState({}, "", window.location.pathname);
  }, [spotifyStatusQuery]);

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
    if (id === "albums")
      toast.info("Albums are available from every Spotify catalog result.");
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
    if (!isAuthenticated) {
      startLogin();
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
    <main className="noise min-h-screen bg-[#0d0f0d] pb-28 text-[#f5f4ec]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        {/* Left Sidebar */}
        <aside className="hidden w-[240px] shrink-0 flex-col border-r border-white/[0.065] px-5 py-6 lg:flex">
          <div className="flex items-center gap-2.5 px-2">
            <div className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#f5ba42] text-[#140f07] shadow-[0_0_28px_rgba(245,186,66,0.18)]">
              <Radio className="h-[18px] w-[18px] stroke-[2.5]" />
            </div>
            <span className="font-display text-[22px] font-semibold tracking-[-0.06em]">
              musivo<span className="text-[#f5ba42]">.</span>
            </span>
          </div>

          <div className="mt-12">
            <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#687067]">
              Listen
            </p>
            <nav className="space-y-1">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleNav(id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
                    activeView === id
                      ? "bg-[#f5ba42] font-semibold text-[#140f07]"
                      : "text-[#9aa296] hover:bg-white/[0.05] hover:text-[#f5f4ec]"
                  }`}
                >
                  <Icon className="h-[17px] w-[17px]" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-9">
            <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#687067]">
              Your library
            </p>
            <nav className="space-y-1">
              {libraryItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleNav(id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
                    activeView === id
                      ? "bg-white/[0.08] text-[#f5ba42]"
                      : "text-[#9aa296] hover:bg-white/[0.05] hover:text-[#f5f4ec]"
                  }`}
                >
                  <Icon className="h-[17px] w-[17px]" />
                  {label}
                </button>
              ))}
            </nav>
            <button
              onClick={() => openPlaylistDialog()}
              className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[#f5ba42] transition-colors hover:bg-white/[0.05]"
            >
              <Plus className="h-[17px] w-[17px]" />
              New playlist
            </button>
            {isAuthenticated && (playlistsQuery.data ?? []).length > 0 && (
              <div className="mt-4 border-t border-white/[0.06] pt-3">
                {(playlistsQuery.data ?? []).slice(0, 4).map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => toast.info(`${playlist.name} is ready for track additions.`)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs text-[#7f8a7c] hover:bg-white/[0.04] hover:text-[#f5f4ec]"
                  >
                    <Disc3 className="h-3.5 w-3.5" />
                    {playlist.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-auto rounded-2xl border border-white/[0.08] bg-[#1a130c] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#382614] text-[#f5ba42]">
                <Download className="h-4 w-4" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#718069]">
                Engine
              </span>
            </div>
            <p className="text-sm font-semibold text-[#e9ede0]">
              {isSpotifyConnected ? "Spotify Web Playback" : "Musivo Preview Mode"}
            </p>
            <p className="mt-1 text-xs leading-5 text-[#7e887a]">
              {isSpotifyConnected
                ? "Full in-app playback with real Spotify Connect controls."
                : "Connect Spotify to play full catalog tracks in Musivo."}
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-white/[0.055] bg-[#0d0f0d]/85 px-5 py-4 backdrop-blur-xl md:px-8 lg:px-12">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => toast.info("Open Musivo on a wider screen for the full library rail.")}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.08] text-[#aab2a5] lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="relative w-full max-w-[390px]">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a8478]" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search Spotify's catalog"
                  className="h-10 w-full rounded-xl border border-white/[0.075] bg-white/[0.045] pl-10 pr-9 text-sm text-[#f5f4ec] placeholder:text-[#887967] outline-none transition-colors focus:border-[#e6a325]"
                />
                {showSearch && (
                  <button
                    aria-label="Clear search"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a8478] hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => toast.info("Settings are ready for your account and provider connections.")}
                className="hidden h-10 w-10 place-items-center rounded-xl text-[#8d9789] transition-colors hover:bg-white/[0.05] hover:text-white sm:grid"
              >
                <Settings2 className="h-[17px] w-[17px]" />
              </button>
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <div className="hidden text-right sm:block">
                    <p className="text-xs font-semibold text-[#e7eadf]">{user?.name || "Musivo listener"}</p>
                    <p className="text-[10px] text-[#7c8876]">Synced library</p>
                  </div>
                  <button
                    onClick={() => void logout()}
                    disabled={authLoading}
                    className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] py-1.5 pl-1.5 pr-3 text-sm font-semibold text-[#e7eadf] transition-colors hover:border-[#c88719]"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#b9da4c] text-xs font-bold text-[#1b2412]">
                      {(user?.name || "M").slice(0, 1).toUpperCase()}
                    </span>
                    <span className="hidden sm:inline">Log out</span>
                    <ChevronDown className="h-3.5 w-3.5 text-[#7c8876]" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startLogin()}
                  className="flex items-center gap-2 rounded-xl border border-[#f5ba42]/30 bg-[#f5ba42] py-2 pl-3 pr-3 text-sm font-bold text-[#140f07] transition-colors hover:bg-[#ffd064]"
                >
                  <span>Log in</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </header>

          <div className="px-5 py-7 md:px-8 lg:px-12 lg:py-9">
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

            {showSearch ? (
              <section>
                <div className="mb-8 flex items-end justify-between gap-4">
                  <div>
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#899789]">
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
                    <p className="mt-1 text-sm text-[#7f887d]">Try an artist, album, or a different mood.</p>
                  </div>
                )}
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
                    <p className="mt-1 text-sm text-[#7f887d]">
                      Tap the heart beside any track to keep it synced to your account.
                    </p>
                  </div>
                )}
              </section>
            ) : activeView === "playlists" ? (
              <section>
                <SectionHeading
                  eyebrow="Your library"
                  title="Playlists"
                  action="Create new"
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
                  <div className="rounded-2xl border border-dashed border-white/[0.12] px-6 py-16 text-center">
                    <ListMusic className="mx-auto mb-4 h-7 w-7 text-[#f5ba42]" />
                    <p className="font-display text-lg font-semibold">Build your first playlist</p>
                    <p className="mt-1 text-sm text-[#7f887d]">
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
              </section>
            ) : activeView === "podcasts" ? (
              <section>
                <SectionHeading eyebrow="Listen" title="Podcasts" />
                <div className="rounded-2xl border border-white/[0.08] bg-[#17110a] p-8">
                  <Podcast className="h-7 w-7 text-[#f5ba42]" />
                  <h1 className="mt-5 font-display text-3xl font-semibold tracking-[-0.05em]">
                    Podcasts, coming next.
                  </h1>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-[#a2927f]">
                    Musivo is connected to music catalog metadata first. Podcast discovery can be added as a separate provider surface without mixing playback or user data.
                  </p>
                </div>
              </section>
            ) : (
              <>
                {/* Hero Section */}
                <section className="relative overflow-hidden rounded-[26px] border border-[#f5ba42]/20 bg-[#24170c] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(245,186,66,0.38),transparent_28%),linear-gradient(105deg,#24170c_0%,#3d2714_45%,#160e08_100%)]" />
                  <div className="absolute -right-20 -top-32 h-[420px] w-[420px] rounded-full border border-[#f5ba42]/25 bg-[#f5ba42]/15 blur-3xl" />
                  <div className="absolute bottom-0 right-0 top-0 hidden w-[46%] overflow-hidden md:block">
                    <img
                      src="/molten-gold-hero.jpg"
                      alt="Musivo Molten Gold Artwork"
                      className="h-full w-full object-cover opacity-75 mix-blend-lighten transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#24170c] via-[#24170c]/40 to-transparent" />
                  </div>
                  <div className="relative max-w-[650px] px-6 py-8 md:px-9 md:py-10 lg:px-11 lg:py-12">
                    <div className="mb-7 flex items-center gap-3">
                      <span className="rounded-full bg-[#f5ba42] px-2.5 py-1 font-mono text-[9px] font-medium tracking-[0.16em] text-[#140f07] shadow-sm">
                        {isSpotifyConnected ? "SPOTIFY CONNECTED" : "PREVIEW MODE"}
                      </span>
                      <span className="font-mono text-[10px] tracking-[0.16em] text-[#d8c9a8]">
                        {catalog.length} TRACKS
                      </span>
                    </div>
                    <h1 className="font-display max-w-[570px] text-4xl font-semibold leading-[0.98] tracking-[-0.07em] text-[#faf5ee] md:text-6xl">
                      Stream your favorite music with Musivo<span className="text-[#f5ba42]">.</span>
                    </h1>
                    <p className="mt-5 max-w-[440px] text-sm leading-6 text-[#d6c8b6] md:text-[15px]">
                      Discover a world of sound with Musivo (integrated with Spotify), where every genre and artist is at your fingertips, ready to be explored.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => void playTrack(featuredTrack, catalog)}
                        className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ffd064] via-[#f5ba42] to-[#e09b26] px-5 py-3 text-sm font-bold text-[#140f07] shadow-[0_8px_28px_rgba(245,186,66,0.3)] hover:opacity-95 hover:scale-[1.02] transition"
                      >
                        <Play className="h-4 w-4 fill-current" /> Start listening
                      </button>
                      <button
                        onClick={() => setActiveView("discover")}
                        className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-[#faf5ee] hover:bg-white/10 transition"
                      >
                        Explore the mix
                      </button>
                    </div>
                  </div>
                  <div className="relative flex items-center gap-3 border-t border-white/[0.09] bg-black/10 px-6 py-3 md:px-9 lg:px-11">
                    <div className="waveform">
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                    <p className="text-xs text-[#b6c4a9]">
                      Your daily mix is ready{" "}
                      <span className="text-[#697568]">· refreshed just now</span>
                    </p>
                  </div>
                </section>

                <SpotifyConnectSection
                  isAuthenticated={isAuthenticated}
                  connected={isSpotifyConnected}
                  displayName={spotifyStatusQuery.data?.displayName ?? null}
                  syncing={spotifySyncMutation.isPending}
                  playlistCount={(spotifyPlaylistsQuery.data ?? []).length}
                  savedTracksCount={lastSyncStats?.savedTracks ?? spotifyStatusQuery.data?.savedTracksCount ?? (likedTracks ?? []).length}
                  recentCount={(spotifyRecentQuery.data ?? []).length}
                  syncStepText={syncStepText}
                  user={user}
                  onConnect={connectSpotify}
                  onSync={syncSpotify}
                  onOpen={() => setActiveView("spotify")}
                />

                <div className="mt-8 overflow-hidden rounded-3xl border border-[#c09cff]/25 bg-gradient-to-br from-[#291c3d] via-[#1d1627] to-[#121316] p-6 sm:p-7 shadow-xl relative">
                  <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#d5b9ff]/10 blur-3xl pointer-events-none" />
                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2 text-[#d5b9ff]">
                        <Sparkles className="h-4 w-4 animate-pulse" />
                        <span className="font-mono text-[10px] uppercase tracking-[0.16em] font-semibold">
                          AI Mix Studio
                        </span>
                      </div>
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-[#f6efff] tracking-tight">
                        Curate your personal soundscape with AI
                      </h2>
                      <p className="text-xs sm:text-sm text-[#bcaecf] leading-relaxed">
                        Choose from crafted mood presets like Midnight Reverie and Neon Cardio, or describe any vibe to generate and play full-length playlists instantly.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveView("aimix")}
                      className="flex items-center gap-2 rounded-full bg-[#d5b9ff] hover:bg-[#e4d2ff] px-5 py-2.5 text-xs font-bold text-[#1f132e] shadow-lg transition hover:scale-[1.03] shrink-0"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Open AI Mix Studio
                    </button>
                  </div>
                </div>

                <section className="mt-10">
                  <SectionHeading
                    eyebrow="Picked for you"
                    title={`Good evening, ${greeting}`}
                    action="See all"
                    onAction={() => setActiveView("discover")}
                  />
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {catalog.slice(0, 4).map((track) => (
                      <div
                        key={track.id}
                        className="group gloss-card relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#17110a] p-2.5 transition-colors hover:border-white/[0.18] hover:bg-[#231a10]"
                      >
                        <div className="relative h-[62px] w-[62px] shrink-0 overflow-hidden rounded-xl">
                          <img
                            src={track.art}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <button
                            onClick={() => void playTrack(track, catalog)}
                            className="absolute inset-0 m-auto grid h-9 w-9 place-items-center rounded-full bg-[#f5ba42] text-[#140f07] opacity-0 shadow-lg transition-all group-hover:opacity-100"
                          >
                            <Play className="h-4 w-4 fill-current" />
                          </button>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#ebeee4]">
                            {track.title}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-[#978776]">{track.artist}</p>
                        </div>
                        <div className="ml-auto flex items-center gap-1 self-center">
                          <button
                            type="button"
                            title="Add to queue"
                            onClick={() => addToQueue(track)}
                            className="p-1.5 text-[#978776] hover:text-[#f5ba42] transition"
                          >
                            <ListPlus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleLike(track)}
                            className={`p-1.5 ${
                              likedIds.has(String(track.id))
                                ? "text-[#f5ba42]"
                                : "text-[#697468] opacity-0 group-hover:opacity-100"
                            }`}
                          >
                            <Heart
                              className="h-4 w-4"
                              fill={likedIds.has(String(track.id)) ? "currentColor" : "none"}
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="mt-10">
                  <SectionHeading
                    eyebrow="Your sound, expanded"
                    title="Made for your next move"
                    action="View all"
                    onAction={() => setActiveView("discover")}
                  />
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {mixes.map((mix, index) => (
                      <button
                        key={mix.title}
                        onClick={() => {
                          const target =
                            catalog[index % Math.max(catalog.length, 1)] ?? fallbackTracks[0];
                          void playTrack(target, catalog);
                          toast.success(`${mix.title} is now playing`);
                        }}
                        className={`group relative min-h-[178px] overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br ${mix.gradient} p-5 text-left transition-transform duration-300 hover:-translate-y-1`}
                      >
                        <img
                          src={mix.art}
                          alt=""
                          className="absolute -bottom-8 -right-8 h-40 w-40 rotate-6 rounded-2xl object-cover opacity-70 shadow-2xl transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110"
                        />
                        <div className="relative z-10 max-w-[170px]">
                          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/45">
                            MUSIVO MIX
                          </span>
                          <p className="mt-4 font-display text-xl font-semibold tracking-[-0.05em] text-white">
                            {mix.title}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-white/55">{mix.detail}</p>
                        </div>
                        <span className="absolute bottom-4 left-5 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-[#f5ba42] opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100">
                          <Play className="h-3.5 w-3.5 fill-current" />
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="mt-10">
                  <SectionHeading
                    eyebrow={activeView === "home" ? "Right now" : "Spotify catalog"}
                    title={activeView === "home" ? "Trending near you" : "Explore the catalog"}
                    action="Open charts"
                    onAction={() => setActiveView("discover")}
                  />
                  <div className="grid gap-1 rounded-2xl border border-white/[0.07] bg-[#140e08] p-2 md:grid-cols-2">
                    {displayTracks.map((track, index) => (
                      <div
                        key={track.id}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/[0.045]"
                      >
                        <span className="w-5 font-mono text-xs text-[#7b6c5b]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <img
                          src={track.art}
                          alt=""
                          className="h-11 w-11 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#e9ede3]">
                            {track.title}
                          </p>
                          <p className="truncate text-xs text-[#948472]">{track.artist}</p>
                        </div>
                        <span className="font-mono text-[10px] text-[#7b6c5b]">
                          {track.duration}
                        </span>
                        <button
                          type="button"
                          title="Add to queue"
                          onClick={() => addToQueue(track)}
                          className="grid h-8 w-8 place-items-center rounded-full text-[#9a8b79] hover:bg-white/10 hover:text-[#f5ba42] transition"
                        >
                          <ListPlus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          aria-label="Play track"
                          onClick={() => void playTrack(track, displayTracks)}
                          className="grid h-8 w-8 place-items-center rounded-full text-[#9a8b79] hover:bg-[#f5ba42] hover:text-[#140f07]"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                        </button>
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
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.09] bg-[#100c08]/95 shadow-[0_-16px_50px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
        <div className="relative mx-auto max-w-[1600px] px-4 py-3 md:px-8 lg:px-12">
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

          <div className="flex items-center gap-3 md:gap-5">
            {/* Left Track Info */}
            <div className="flex min-w-0 flex-1 items-center gap-3 md:w-[28%] md:flex-none">
              <img
                src={currentTrack.art}
                alt=""
                className="h-11 w-11 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-[#f0f2e9]">
                  {currentTrack.title}
                </p>
                <p className="truncate text-xs text-[#899388]">{currentTrack.artist}</p>
              </div>
              <div
                className={`player-eq ${isPlaying ? "" : "paused"}`}
                aria-label={isPlaying ? "Playing" : "Paused"}
              >
                <span />
                <span />
                <span />
              </div>
              <button
                aria-label="Like current song"
                onClick={() => toggleLike(currentTrack)}
                className={`ml-1 hidden sm:block ${
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
            <div className="flex flex-1 flex-col items-center gap-1.5 md:max-w-[520px]">
              <div className="flex items-center gap-4 text-[#948472]">
                <button
                  aria-label="Shuffle queue"
                  onClick={shuffleQueue}
                  className="hidden sm:block text-[#948472] hover:text-[#f5ba42] transition"
                  title="Shuffle queue"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                </button>
                <button
                  aria-label="Previous track"
                  onClick={() => void skip(-1)}
                  className="hover:text-white"
                >
                  <SkipBack className="h-4 w-4 fill-current" />
                </button>
                <button
                  aria-label={isPlaying ? "Pause" : "Play"}
                  onClick={() => void togglePlay()}
                  className="grid h-8 w-8 place-items-center rounded-full bg-[#f2f5e8] text-[#131811] hover:bg-[#f5ba42]"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 fill-current" />
                  ) : (
                    <Play className="ml-0.5 h-4 w-4 fill-current" />
                  )}
                </button>
                <button
                  aria-label="Next track"
                  onClick={() => void skip(1)}
                  className="hover:text-white"
                >
                  <SkipForward className="h-4 w-4 fill-current" />
                </button>

                {/* Spotify Full-Length Indicator or Sign-in Action */}
                {playbackMode === "spotify" ? (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#1db954]/15 px-2 py-0.5 text-[9px] font-semibold text-[#1db954]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1db954] animate-pulse" />
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
                  className={`hidden sm:flex items-center gap-1 transition ${
                    repeatMode !== "off"
                      ? "text-[#f5ba42] drop-shadow-[0_0_8px_rgba(245,186,66,0.4)]"
                      : "text-[#948472] hover:text-[#f5ba42]"
                  }`}
                  title={`Repeat: ${repeatMode.toUpperCase()}`}
                >
                  {repeatMode === "one" ? (
                    <Repeat1 className="h-3.5 w-3.5" />
                  ) : (
                    <Repeat2 className="h-3.5 w-3.5" />
                  )}
                  {repeatMode !== "off" && (
                    <span className="font-mono text-[9px] font-bold">
                      {repeatMode === "one" ? "1" : "ALL"}
                    </span>
                  )}
                </button>
                <button
                  aria-label="Toggle playback queue"
                  onClick={() => setIsQueueOpen((prev) => !prev)}
                  className="sm:hidden text-[#8e7f6e] hover:text-[#f5ba42]"
                  title="Queue"
                >
                  <ListMusic className="h-3.5 w-3.5" />
                </button>
                <button
                  aria-label="Playback diagnostics"
                  onClick={() => setShowPlaybackDiagnostics((visible) => !visible)}
                  className="md:hidden text-[#8e7f6e] hover:text-[#f5ba42]"
                >
                  <Headphones className="h-3.5 w-3.5" />
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
            <div className="hidden w-[28%] items-center justify-end gap-3 md:flex">
              <button
                aria-label="Toggle playback queue"
                onClick={() => setIsQueueOpen((prev) => !prev)}
                className={`relative rounded-xl p-1.5 transition ${
                  isQueueOpen
                    ? "bg-[#f5ba42]/20 text-[#f5ba42]"
                    : "text-[#8e7f6e] hover:bg-white/[0.06] hover:text-white"
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
              <button
                aria-label="Playback diagnostics"
                onClick={() => setShowPlaybackDiagnostics((visible) => !visible)}
                className={`text-[#8e7f6e] hover:text-white ${
                  showPlaybackDiagnostics ? "text-[#f5ba42]" : ""
                }`}
              >
                <Headphones className="h-4 w-4" />
              </button>
              <Volume2 className="h-4 w-4 text-[#8e7f6e]" />
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
          </div>
        </div>
      </div>

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
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#899789]">
                  Your library
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.05em]">
                  {trackToSave ? "Save to playlist" : "Create a playlist"}
                </h2>
                {trackToSave && (
                  <p className="mt-1 max-w-[270px] truncate text-xs text-[#7f8b7c]">
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
                    className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3 text-left text-sm text-[#e8eee1] hover:border-[#c88719] hover:bg-white/[0.06]"
                  >
                    <span className="flex items-center gap-2">
                      <ListMusic className="h-4 w-4 text-[#f5ba42]" />
                      {playlist.name}
                    </span>
                    <Plus className="h-4 w-4 text-[#988877]" />
                  </button>
                ))}
                {(playlistsQuery.data ?? []).length === 0 && (
                  <p className="rounded-xl border border-dashed border-white/[0.1] px-4 py-6 text-center text-xs text-[#7e897b]">
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
                <p className="mt-1 text-xs leading-5 text-[#899388]">
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
    </main>
  );
}
