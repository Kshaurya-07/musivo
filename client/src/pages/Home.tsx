import { useEffect, useMemo, useRef, useState } from "react";
import {
  Album,
  ArrowRight,
  ChevronDown,
  CircleHelp,
  Clock3,
  Compass,
  Disc3,
  Download,
  Headphones,
  Heart,
  Home as HomeIcon,
  Library,
  ListMusic,
  Menu,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Podcast,
  Radio,
  Repeat2,
  Search,
  Settings2,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
  Volume2,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { formatTime, getNextTrackIndex, matchesTrackQuery } from "@/lib/musivo";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";

type Track = {
  id: number | string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  art: string;
  audio: string;
  accent: string;
  badge?: string;
  storeUrl?: string;
  durationMs?: number | null;
  source?: string;
};

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

const art = {
  neon: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=85",
  purple: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=85",
  sunset: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=85",
  blue: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=85",
  red: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=900&q=85",
  green: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=900&q=85",
  cream: "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=85",
  night: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=85",
};

const tracks: Track[] = [
  { id: 1, title: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming", duration: "4:03", art: art.neon, audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", accent: "#d8ff57", badge: "MADE FOR YOU" },
  { id: 2, title: "Still Feel.", artist: "half·alive", album: "Now, Not Yet", duration: "2:47", art: art.purple, audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", accent: "#b497ff", badge: "TRENDING" },
  { id: 3, title: "Sunset Lover", artist: "Petit Biscuit", album: "Presence", duration: "3:58", art: art.sunset, audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", accent: "#ffb247", badge: "NEW" },
  { id: 4, title: "A Moment Apart", artist: "ODESZA", album: "A Moment Apart", duration: "3:54", art: art.blue, audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", accent: "#63c5ff" },
  { id: 5, title: "The Less I Know The Better", artist: "Tame Impala", album: "Currents", duration: "3:36", art: art.red, audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", accent: "#ff725d" },
  { id: 6, title: "Intro", artist: "The xx", album: "xx", duration: "2:07", art: art.night, audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", accent: "#8ca3ff" },
  { id: 7, title: "Good Days", artist: "SZA", album: "Good Days", duration: "4:39", art: art.cream, audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3", accent: "#ecdbad" },
  { id: 8, title: "Love Tonight", artist: "Shouse", album: "Open", duration: "4:01", art: art.green, audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", accent: "#7be3b5" },
];

const playlists = [
  { title: "late night drive", detail: "A little faster, a little further", art: art.neon, gradient: "from-[#263716] to-[#131c12]" },
  { title: "focus / flow", detail: "No lyrics. No distractions.", art: art.blue, gradient: "from-[#162b3b] to-[#111719]" },
  { title: "soft launch", detail: "New sounds worth sharing", art: art.cream, gradient: "from-[#493a24] to-[#181612]" },
];

const podcasts = [
  { title: "The Daily Brief", detail: "Global news, in 20 minutes", creator: "The Briefing Room", art: art.blue, time: "20 min" },
  { title: "Design Matters", detail: "Conversations with people who make", creator: "Debbie Millman", art: art.purple, time: "47 min" },
  { title: "Science Vs", detail: "Facts over the hype", creator: "WNYC Studios", art: art.green, time: "38 min" },
];

const navItems: NavItem[] = [
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "discover", label: "Discover", icon: Compass },
  { id: "releases", label: "New releases", icon: Sparkles },
  { id: "podcasts", label: "Podcasts", icon: Podcast },
];

const libraryItems: NavItem[] = [
  { id: "liked", label: "Liked songs", icon: Heart },
  { id: "albums", label: "Albums", icon: Album },
  { id: "playlists", label: "Your playlists", icon: ListMusic },
];

function TrackRow({ track, onPlay, onSave, active }: { track: Track; onPlay: (track: Track) => void; onSave: (track: Track) => void; active: boolean }) {
  return (
    <div className={`group grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.055] ${active ? "bg-white/[0.07]" : ""}`}>
      <button aria-label={`Play ${track.title}`} onClick={() => onPlay(track)} className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg">
        <img src={track.art} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
        <span className="absolute inset-0 grid place-items-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">{active ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}</span>
      </button>
      <button className="min-w-0 text-left" onClick={() => onPlay(track)}>
        <p className={`truncate text-[13px] font-semibold ${active ? "text-[#d8ff57]" : "text-[#f3f3ea]"}`}>{track.title}</p>
        <p className="truncate text-xs text-[#8b9389]">{track.artist} · {track.album}</p>
      </button>
      <div className="flex items-center gap-3 text-xs text-[#7f877e]">
        <span className="hidden sm:inline">{track.duration}</span>
        <button aria-label={`Add ${track.title} to a playlist`} onClick={() => onSave(track)} className="opacity-0 transition-opacity hover:text-[#d8ff57] group-hover:opacity-100"><Plus className="h-4 w-4" /></button>
        <button aria-label={`More options for ${track.title}`} onClick={() => toast.info(track.storeUrl ? "Open the store link from the track details when your catalog is connected." : "Track actions are ready for your catalog integration.")} className="opacity-0 transition-opacity hover:text-white group-hover:opacity-100"><MoreHorizontal className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#919c8b]">{eyebrow}</p>}
        <h2 className="font-display text-xl font-semibold tracking-[-0.03em] text-[#f2f4eb] md:text-2xl">{title}</h2>
      </div>
      {action && <button onClick={() => toast.info("Full library view is coming next.")} className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[#959e91] transition-colors hover:text-[#d8ff57]">{action} <ArrowRight className="h-3.5 w-3.5" /></button>}
    </div>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const playlistUtils = trpc.useUtils();
  const [activeView, setActiveView] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTrack, setCurrentTrack] = useState(tracks[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(72);
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [trackToSave, setTrackToSave] = useState<Track | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const catalog = useMemo(() => [...tracks, ...tracks.map((track) => ({ ...track, id: Number(track.id) + 100, title: `${track.title} (radio edit)` }))], []);
  const liveSearchTerm = searchQuery.trim();
  const liveSearchQuery = trpc.music.search.useQuery({ query: liveSearchTerm || "music", limit: 12 }, { enabled: liveSearchTerm.length > 0, staleTime: 1000 * 60 * 5, retry: 1 });
  const playlistsQuery = trpc.playlists.list.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const createPlaylistMutation = trpc.playlists.create.useMutation({
    onSuccess: async (playlist) => {
      await playlistUtils.playlists.list.invalidate();
      setNewPlaylistName("");
      toast.success(`Created ${playlist.name}`);
      if (trackToSave) {
        await addTrackMutation.mutateAsync({ playlistId: playlist.id, track: { ...trackToSave, id: String(trackToSave.id) } });
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
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return catalog.filter((track) => matchesTrackQuery(track, query));
  }, [catalog, searchQuery]);
  const liveResults: Track[] = useMemo(() => (liveSearchQuery.data ?? []).map((item) => ({ ...item, duration: item.durationMs ? formatTime(item.durationMs / 1000) : "Preview" })), [liveSearchQuery.data]);
  const visibleSearchResults = liveResults.length > 0 ? liveResults : searchResults;

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  const playTrack = (track: Track) => {
    setCurrentTrack(track);
    setProgress(0);
    setIsPlaying(true);
    window.setTimeout(() => {
      if (!audioRef.current) return;
      audioRef.current.src = track.audio;
      audioRef.current.volume = volume / 100;
      void audioRef.current.play().catch(() => {
        toast.info("Demo playback is ready — press play again if your browser blocked autoplay.");
        setIsPlaying(false);
      });
    }, 0);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current.src) audioRef.current.src = currentTrack.audio;
      void audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const skip = (direction: 1 | -1) => {
    const queueId = typeof currentTrack.id === "number" ? currentTrack.id : tracks[0].id;
    const nextIndex = getNextTrackIndex(tracks, queueId, direction);
    if (nextIndex < 0) return;
    playTrack(tracks[nextIndex]);
  };

  const handleNav = (id: string) => {
    setActiveView(id);
    setSearchQuery("");
  };

  const openPlaylistDialog = (track?: Track) => {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    setTrackToSave(track ?? null);
    setShowPlaylistDialog(true);
  };

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) return;
    createPlaylistMutation.mutate({ name: newPlaylistName.trim() });
  };

  const showSearch = searchQuery.trim().length > 0;
  const featuredTrack = tracks[0];

  return (
    <main className="noise min-h-screen bg-[#0d0f0d] pb-28 text-[#f5f4ec]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[240px] shrink-0 flex-col border-r border-white/[0.065] px-5 py-6 lg:flex">
          <div className="flex items-center gap-2.5 px-2">
            <div className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#d8ff57] text-[#10110f] shadow-[0_0_28px_rgba(216,255,87,0.18)]"><Radio className="h-[18px] w-[18px] stroke-[2.5]" /></div>
            <span className="font-display text-[22px] font-semibold tracking-[-0.06em]">musivo<span className="text-[#d8ff57]">.</span></span>
          </div>

          <div className="mt-12">
            <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#687067]">Listen</p>
            <nav className="space-y-1">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => handleNav(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${activeView === id ? "bg-[#d8ff57] font-semibold text-[#10110f]" : "text-[#9aa296] hover:bg-white/[0.05] hover:text-[#f5f4ec]"}`}>
                  <Icon className="h-[17px] w-[17px]" />{label}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-9">
            <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#687067]">Your library</p>
            <nav className="space-y-1">
              {libraryItems.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => handleNav(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${activeView === id ? "bg-white/[0.08] text-[#d8ff57]" : "text-[#9aa296] hover:bg-white/[0.05] hover:text-[#f5f4ec]"}`}>
                  <Icon className="h-[17px] w-[17px]" />{label}
                </button>
              ))}
            </nav>
            <button onClick={() => openPlaylistDialog()} className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[#d8ff57] transition-colors hover:bg-white/[0.05]"><Plus className="h-[17px] w-[17px]" />New playlist</button>
            {isAuthenticated && (playlistsQuery.data ?? []).length > 0 && <div className="mt-4 border-t border-white/[0.06] pt-3">{(playlistsQuery.data ?? []).slice(0, 4).map((playlist) => <button key={playlist.id} onClick={() => toast.info(`${playlist.name} is ready for track additions.`)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs text-[#7f8a7c] hover:bg-white/[0.04] hover:text-[#f5f4ec]"><Disc3 className="h-3.5 w-3.5" />{playlist.name}</button>)}</div>}
          </div>

          <div className="mt-auto rounded-2xl border border-white/[0.08] bg-[#171b15] p-4">
            <div className="mb-3 flex items-center justify-between"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#2c3820] text-[#d8ff57]"><Download className="h-4 w-4" /></span><span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#718069]">Coming soon</span></div>
            <p className="text-sm font-semibold text-[#e9ede0]">Take your music offline</p>
            <p className="mt-1 text-xs leading-5 text-[#7e887a]">Your downloaded mixes, wherever the signal drops.</p>
            <button onClick={() => toast.info("Offline mode will be available with a premium account.")} className="mt-3 text-xs font-semibold text-[#d8ff57] hover:underline">Tell me more →</button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-white/[0.055] bg-[#0d0f0d]/85 px-5 py-4 backdrop-blur-xl md:px-8 lg:px-12">
            <div className="flex min-w-0 items-center gap-3">
              <button onClick={() => toast.info("Open Musivo on a wider screen for the full library rail.")} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.08] text-[#aab2a5] lg:hidden"><Menu className="h-5 w-5" /></button>
              <div className="relative w-full max-w-[360px]">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a8478]" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="What do you want to play?" className="h-10 w-full rounded-xl border border-white/[0.075] bg-white/[0.045] pl-10 pr-9 text-sm text-[#f5f4ec] placeholder:text-[#727b71] outline-none transition-colors focus:border-[#a5c23d]" />
                {showSearch && <button aria-label="Clear search" onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a8478] hover:text-white"><X className="h-4 w-4" /></button>}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button onClick={() => toast.info("Settings are ready for your account and provider connections.")} className="hidden h-10 w-10 place-items-center rounded-xl text-[#8d9789] transition-colors hover:bg-white/[0.05] hover:text-white sm:grid"><Settings2 className="h-[17px] w-[17px]" /></button>
              <button onClick={() => toast.info("Sign-in is the next step for synced playlists and listening history.")} className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] py-1.5 pl-1.5 pr-3 text-sm font-semibold text-[#e7eadf] transition-colors hover:border-[#788d39]">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#b9da4c] text-xs font-bold text-[#1b2412]">A</span><span className="hidden sm:inline">Alex</span><ChevronDown className="h-3.5 w-3.5 text-[#7c8876]" />
              </button>
            </div>
          </header>

          <div className="px-5 py-7 md:px-8 lg:px-12 lg:py-9">
            {showSearch ? (
              <section>
                <div className="mb-8 flex items-end justify-between gap-4"><div><p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#899789]">Live catalog search · iTunes</p><h1 className="font-display text-3xl font-semibold tracking-[-0.05em] md:text-4xl">Results for “{searchQuery}”</h1></div><span className="font-mono text-xs text-[#7c8779]">{liveSearchQuery.isFetching ? "Searching…" : `${visibleSearchResults.length} matches`}</span></div>
                {visibleSearchResults.length > 0 ? <div className="max-w-3xl space-y-1">{visibleSearchResults.map((track) => <TrackRow key={track.id} track={track} onPlay={playTrack} onSave={openPlaylistDialog} active={currentTrack.id === track.id && isPlaying} />)}</div> : <div className="rounded-2xl border border-dashed border-white/[0.12] px-6 py-16 text-center"><Search className="mx-auto mb-4 h-7 w-7 text-[#7a856f]" /><p className="font-display text-lg font-semibold">No tracks found yet</p><p className="mt-1 text-sm text-[#7f887d]">Try an artist, album, or a different mood.</p></div>}
              </section>
            ) : (
              <>
                <section className="relative overflow-hidden rounded-[26px] border border-white/[0.09] bg-[#202c1b] shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(216,255,87,0.34),transparent_22%),linear-gradient(105deg,#172416_0%,#26351b_45%,#131916_100%)]" />
                  <div className="absolute -right-20 -top-32 h-[420px] w-[420px] rounded-full border border-[#d8ff57]/20 bg-[#d8ff57]/10 blur-3xl" />
                  <div className="absolute bottom-0 right-0 top-0 hidden w-[42%] overflow-hidden md:block"><img src={featuredTrack.art} alt="" className="h-full w-full object-cover opacity-35 mix-blend-screen" /><div className="absolute inset-0 bg-gradient-to-r from-[#1a2b1b] via-transparent to-transparent" /></div>
                  <div className="relative max-w-[650px] px-6 py-8 md:px-9 md:py-10 lg:px-11 lg:py-12">
                    <div className="mb-7 flex items-center gap-3"><span className="rounded-full bg-[#d8ff57] px-2.5 py-1 font-mono text-[9px] font-medium tracking-[0.16em] text-[#18200f]">EDITOR’S PICK</span><span className="font-mono text-[10px] tracking-[0.16em] text-[#bdcda3]">04 / 12</span></div>
                    <h1 className="font-display max-w-[570px] text-4xl font-semibold leading-[0.98] tracking-[-0.07em] text-[#f3f6e9] md:text-6xl">Every mood has a frequency<span className="text-[#d8ff57]">.</span></h1>
                    <p className="mt-5 max-w-[420px] text-sm leading-6 text-[#c3d0b2] md:text-[15px]">New sounds, familiar feelings, and the songs you didn’t know you needed yet.</p>
                    <div className="mt-8 flex flex-wrap items-center gap-3"><button onClick={() => playTrack(featuredTrack)} className="flex items-center gap-2 rounded-full bg-[#d8ff57] px-5 py-3 text-sm font-bold text-[#15200f] shadow-[0_8px_24px_rgba(216,255,87,0.18)] hover:bg-[#e5ff8c]"><Play className="h-4 w-4 fill-current" /> Start listening</button><button onClick={() => { setActiveView("discover"); toast.success("Discover mode opened"); }} className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-[#f1f5e8] hover:bg-white/10">Explore the mix</button></div>
                  </div>
                  <div className="relative flex items-center gap-3 border-t border-white/[0.09] bg-black/10 px-6 py-3 md:px-9 lg:px-11"><div className="waveform"><span /><span /><span /><span /><span /></div><p className="text-xs text-[#b6c4a9]">Your daily mix is ready <span className="text-[#697568]">· refreshed just now</span></p></div>
                </section>

                <section className="mt-10"><SectionHeading eyebrow="Picked for you" title="Good evening, Alex" action="See all" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{tracks.slice(0, 4).map((track) => <div key={track.id} className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#151815] p-2.5 transition-colors hover:border-white/[0.15] hover:bg-[#1b201a]"><div className="relative h-[62px] w-[62px] shrink-0 overflow-hidden rounded-xl"><img src={track.art} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" /><button onClick={() => playTrack(track)} className="absolute inset-0 m-auto grid h-9 w-9 place-items-center rounded-full bg-[#d8ff57] text-[#15200f] opacity-0 shadow-lg transition-all group-hover:opacity-100"><Play className="h-4 w-4 fill-current" /></button></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#ebeee4]">{track.title}</p><p className="mt-0.5 truncate text-xs text-[#848e82]">{track.artist}</p></div><button onClick={() => setIsLiked((value) => !value)} className={`ml-auto self-start p-1.5 ${isLiked && currentTrack.id === track.id ? "text-[#d8ff57]" : "text-[#697468] opacity-0 group-hover:opacity-100"}`}><Heart className="h-4 w-4" fill={isLiked && currentTrack.id === track.id ? "currentColor" : "none"} /></button></div>)}</div></section>

                <section className="mt-10"><SectionHeading eyebrow="Your sound, expanded" title="Made for your next move" action="View all" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{playlists.map((playlist) => <button key={playlist.title} onClick={() => { playTrack(tracks[Math.floor(Math.random() * tracks.length)]); toast.success(`${playlist.title} is now playing`); }} className={`group relative min-h-[178px] overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br ${playlist.gradient} p-5 text-left transition-transform duration-300 hover:-translate-y-1`}><img src={playlist.art} alt="" className="absolute -bottom-8 -right-8 h-40 w-40 rotate-6 rounded-2xl object-cover opacity-70 shadow-2xl transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" /><div className="relative z-10 max-w-[170px]"><span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/45">MUSIVO MIX</span><p className="mt-4 font-display text-xl font-semibold tracking-[-0.05em] text-white">{playlist.title}</p><p className="mt-1 text-xs leading-5 text-white/55">{playlist.detail}</p></div><span className="absolute bottom-4 left-5 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-[#d8ff57] opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100"><Play className="h-3.5 w-3.5 fill-current" /></span></button>)}</div></section>

                <section className="mt-10"><SectionHeading eyebrow="Right now" title="Trending near you" action="Open charts" /><div className="grid gap-1 rounded-2xl border border-white/[0.07] bg-[#121512] p-2 md:grid-cols-2">{tracks.slice(4, 8).map((track, index) => <div key={track.id} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/[0.045]"><span className="w-5 font-mono text-xs text-[#657064]">0{index + 1}</span><img src={track.art} alt="" className="h-11 w-11 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#e9ede3]">{track.title}</p><p className="truncate text-xs text-[#7e887c]">{track.artist}</p></div><span className="font-mono text-[10px] text-[#637062]">{track.duration}</span><button onClick={() => playTrack(track)} className="grid h-8 w-8 place-items-center rounded-full text-[#86917f] hover:bg-[#d8ff57] hover:text-[#17210f]"><Play className="h-3.5 w-3.5 fill-current" /></button></div>)}</div></section>

                <section className="mt-10"><SectionHeading eyebrow="Keep listening" title="Podcasts for the curious" action="Browse podcasts" /><div className="grid gap-4 md:grid-cols-3">{podcasts.map((podcast) => <button key={podcast.title} onClick={() => toast.info(`${podcast.title} is a podcast placeholder — connect your podcast provider to stream episodes.`)} className="group flex gap-3 rounded-2xl border border-white/[0.07] bg-[#151815] p-3 text-left transition-colors hover:border-white/[0.15] hover:bg-[#1a1e19]"><img src={podcast.art} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover transition-transform duration-300 group-hover:scale-105" /><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#ebeee4]">{podcast.title}</p><p className="mt-1 truncate text-xs text-[#899388]">{podcast.detail}</p><span className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] text-[#6f7d6c]"><Clock3 className="h-3 w-3" /> {podcast.time}</span></div></button>)}</div></section>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.09] bg-[#10130f]/95 shadow-[0_-16px_50px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
        <div className="mx-auto max-w-[1600px] px-4 py-3 md:px-8 lg:px-12">
          <div className="flex items-center gap-3 md:gap-5">
            <div className="flex min-w-0 flex-1 items-center gap-3 md:w-[28%] md:flex-none"><img src={currentTrack.art} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" /><div className="min-w-0"><p className="truncate text-[13px] font-semibold text-[#f0f2e9]">{currentTrack.title}</p><p className="truncate text-xs text-[#899388]">{currentTrack.artist}</p></div><div className={`player-eq ${isPlaying ? "" : "paused"}`} aria-label={isPlaying ? "Playing" : "Paused"}><span /><span /><span /></div><button aria-label="Like current song" onClick={() => setIsLiked((value) => !value)} className={`ml-1 hidden sm:block ${isLiked ? "text-[#d8ff57]" : "text-[#727c70] hover:text-white"}`}><Heart className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} /></button></div>
            <div className="flex flex-1 flex-col items-center gap-1.5 md:max-w-[520px]"><div className="flex items-center gap-4 text-[#7f8a7b]"><button aria-label="Shuffle" onClick={() => toast.info("Shuffle is on deck for the full queue.")} className="hidden sm:block hover:text-[#d8ff57]"><Shuffle className="h-3.5 w-3.5" /></button><button aria-label="Previous track" onClick={() => skip(-1)} className="hover:text-white"><SkipBack className="h-4 w-4 fill-current" /></button><button aria-label={isPlaying ? "Pause" : "Play"} onClick={togglePlay} className="grid h-8 w-8 place-items-center rounded-full bg-[#f2f5e8] text-[#131811] hover:bg-[#d8ff57]">{isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}</button><button aria-label="Next track" onClick={() => skip(1)} className="hover:text-white"><SkipForward className="h-4 w-4 fill-current" /></button><button aria-label="Repeat" onClick={() => toast.info("Repeat will apply when the queue is connected.")} className="hidden sm:block hover:text-[#d8ff57]"><Repeat2 className="h-3.5 w-3.5" /></button></div><div className="hidden w-full items-center gap-2 sm:flex"><span className="w-8 text-right font-mono text-[9px] text-[#6e786d]">{formatTime(progress)}</span><input aria-label="Seek" type="range" min="0" max={duration || 100} value={progress} onChange={(event) => { const next = Number(event.target.value); setProgress(next); if (audioRef.current) audioRef.current.currentTime = next; }} className="h-1 w-full cursor-pointer accent-[#d8ff57]" /><span className="w-8 font-mono text-[9px] text-[#6e786d]">{duration ? formatTime(duration) : currentTrack.duration}</span></div></div>
            <div className="hidden w-[28%] items-center justify-end gap-3 md:flex"><button onClick={() => toast.info("Queue view is ready for your next iteration.")} className="text-[#788376] hover:text-white"><ListMusic className="h-4 w-4" /></button><button onClick={() => toast.info("Device picker will connect to your provider SDK.")} className="text-[#788376] hover:text-white"><Headphones className="h-4 w-4" /></button><Volume2 className="h-4 w-4 text-[#788376]" /><input aria-label="Volume" type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} className="w-20 cursor-pointer accent-[#d8ff57]" /></div>
          </div>
        </div>
      </div>
      {showPlaylistDialog && <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 px-5 backdrop-blur-sm"><div className="w-full max-w-md rounded-3xl border border-white/[0.1] bg-[#171b15] p-5 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#899789]">Your library</p><h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.05em]">{trackToSave ? "Save to playlist" : "Create a playlist"}</h2>{trackToSave && <p className="mt-1 max-w-[270px] truncate text-xs text-[#7f8b7c]">{trackToSave.title} · {trackToSave.artist}</p>}</div><button aria-label="Close playlist dialog" onClick={() => setShowPlaylistDialog(false)} className="rounded-xl p-2 text-[#7b8779] hover:bg-white/[0.06] hover:text-white"><X className="h-4 w-4" /></button></div>{isAuthenticated && trackToSave && <div className="mb-5 max-h-44 space-y-1 overflow-y-auto">{(playlistsQuery.data ?? []).map((playlist) => <button key={playlist.id} disabled={addTrackMutation.isPending} onClick={() => addTrackMutation.mutate({ playlistId: playlist.id, track: { ...trackToSave, id: String(trackToSave.id) } })} className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3 text-left text-sm text-[#e8eee1] hover:border-[#7d9634] hover:bg-white/[0.06]"><span className="flex items-center gap-2"><ListMusic className="h-4 w-4 text-[#d8ff57]" />{playlist.name}</span><Plus className="h-4 w-4 text-[#85947e]" /></button>)}{(playlistsQuery.data ?? []).length === 0 && <p className="rounded-xl border border-dashed border-white/[0.1] px-4 py-6 text-center text-xs text-[#7e897b]">Create your first playlist below.</p>}</div>}<div className="border-t border-white/[0.08] pt-4"><p className="mb-2 text-xs font-semibold text-[#b8c1b1]">New playlist</p><div className="flex gap-2"><input autoFocus value={newPlaylistName} onChange={(event) => setNewPlaylistName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") createPlaylist(); }} placeholder="e.g. Sunday morning" className="h-11 min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-black/20 px-3 text-sm text-white placeholder:text-[#6e796d] outline-none focus:border-[#a2c23e]" /><button disabled={!newPlaylistName.trim() || createPlaylistMutation.isPending} onClick={createPlaylist} className="rounded-xl bg-[#d8ff57] px-4 text-sm font-bold text-[#17200f] disabled:cursor-not-allowed disabled:opacity-40">Create</button></div></div>{!isAuthenticated && <button onClick={() => startLogin()} className="mt-4 w-full rounded-xl border border-white/[0.1] px-4 py-3 text-sm font-semibold text-[#d8ff57] hover:bg-white/[0.05]">Sign in to save playlists</button>}</div></div>}
      <audio ref={audioRef} onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)} onTimeUpdate={() => setProgress(audioRef.current?.currentTime ?? 0)} onEnded={() => skip(1)} preload="none" />
    </main>
  );
}
