import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { formatTime, getNextTrackIndex, parseDuration } from "@/lib/musivo";
import {
  useSpotifyPlayer,
  SpotifyConnectionState,
} from "@/hooks/useSpotifyPlayer";
import { toast } from "sonner";

declare global {
  interface Window {
    YT?: {
      Player: new (elementId: string, config: any) => any;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export type PlaybackTrack = {
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

export type PlaybackMode = "spotify" | "full" | "preview" | "idle";
export type RepeatMode = "off" | "all" | "one";

export type SleepTimer = {
  minutes: number;
  targetTimestamp: number;
  mode: "minutes" | "track_end";
} | null;

export interface PlaybackContextType {
  currentTrack: PlaybackTrack;
  isPlaying: boolean;
  progress: number; // in seconds
  duration: number; // in seconds
  volume: number; // 0 to 100
  playbackMode: PlaybackMode;
  spotifyConnectionState: SpotifyConnectionState;
  deviceId: string | null;
  sdkLoaded: boolean;
  isPremium: boolean | null;
  isSpotifyConnected: boolean;
  error: string | null;
  autoplayBlocked: boolean;
  queue: PlaybackTrack[];
  repeatMode: RepeatMode;
  toggleRepeatMode: () => void;
  addToQueue: (track: PlaybackTrack) => void;
  playNextInQueue: (track: PlaybackTrack) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  shuffleQueue: () => void;
  playTrack: (track: PlaybackTrack, newQueue?: PlaybackTrack[]) => Promise<void>;
  togglePlay: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (seconds: number) => Promise<void>;
  setVolume: (volumePercent: number) => Promise<void>;
  skip: (direction: 1 | -1) => Promise<void>;
  setQueue: (queue: PlaybackTrack[]) => void;
  clearError: () => void;
  connectSpotify: () => void;
  sleepTimer: SleepTimer;
  sleepTimerRemainingSec: number | null;
  setSleepTimer: (minutes: number | null, isTrackEnd?: boolean) => void;
  activeEpisodeId: string | null;
  setActiveEpisodeId: (id: string | null) => void;
  videoMode: boolean;
  setVideoMode: (enabled: boolean) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  seekRelative: (seconds: number) => Promise<void>;
}

const fallbackDefaultTrack: PlaybackTrack = {
  id: "fallback-1",
  title: "Midnight City",
  artist: "M83",
  album: "Hurry Up, We're Dreaming",
  duration: "4:03",
  art: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=85",
  audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  accent: "#f5ba42",
  badge: "MADE FOR YOU",
  durationMs: 243000,
  source: "fallback",
};

const PlaybackContext = createContext<PlaybackContextType | null>(null);

export function PlaybackProvider({ children }: { children: React.ReactNode }) {
  const trpcUtils = trpc.useUtils();
  const { isAuthenticated } = useAuth();
  const spotifyStatusQuery = trpc.spotify.status.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

  const isSpotifyConnected = Boolean(
    isAuthenticated && spotifyStatusQuery.data?.connected
  );

  const [volume, setVolumeState] = useState(72);
  const [currentTrack, setCurrentTrack] = useState<PlaybackTrack>(fallbackDefaultTrack);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>("idle");
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<PlaybackTrack[]>([]);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [userError, setUserError] = useState<string | null>(null);

  const recordSessionMutation = trpc.music.recordSession.useMutation();

  // Sleep timer state
  const [sleepTimer, setSleepTimerState] = useState<SleepTimer>(null);
  const [sleepTimerRemainingSec, setSleepTimerRemainingSec] = useState<number | null>(null);
  const baseVolumeRef = useRef(volume);

  // Podcast state
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(null);
  const [videoMode, setVideoMode] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeedState] = useState<number>(1.0);

  // Active listening session tracker (>=30 seconds active listening threshold)
  const activeSessionRef = useRef<{
    contentId: string;
    contentType: "track" | "episode";
    title: string;
    artist: string;
    artworkUrl?: string;
    durationMs?: number;
    startedAt: Date;
    accumulatedMs: number;
    lastTick: number;
  } | null>(null);

  const prefetchingQueueRef = useRef(false);

  const flushListeningSession = useCallback(
    async (completed = 0) => {
      const session = activeSessionRef.current;
      if (!session) return;
      if (isAuthenticated && session.accumulatedMs >= 30000) {
        try {
          await recordSessionMutation.mutateAsync({
            contentId: session.contentId,
            contentType: session.contentType,
            title: session.title,
            artist: session.artist,
            artworkUrl: session.artworkUrl,
            durationMs: session.durationMs,
            listenedMs: Math.round(session.accumulatedMs),
            completed,
            startedAt: session.startedAt,
            endedAt: new Date(),
          });
        } catch (err) {
          console.warn("[Session Tracking] Could not record session:", err);
        }
      }
      activeSessionRef.current = null;
    },
    [isAuthenticated, recordSessionMutation]
  );

  const flushListeningSessionRef = useRef(flushListeningSession);
  useEffect(() => {
    flushListeningSessionRef.current = flushListeningSession;
  }, [flushListeningSession]);

  // Session accumulation ticker (every second during active playback)
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      if (activeSessionRef.current) {
        const now = Date.now();
        const delta = Math.min(2000, now - activeSessionRef.current.lastTick);
        activeSessionRef.current.accumulatedMs += delta;
        activeSessionRef.current.lastTick = now;
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Flush session on window unload or tab close
  useEffect(() => {
    const handleUnload = () => {
      void flushListeningSessionRef.current(0);
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      void flushListeningSessionRef.current(0);
    };
  }, []);

  const skipRef = useRef<(direction: 1 | -1) => Promise<void>>(() => Promise.resolve());

  // Hidden HTML5 audio element for preview/demo tracks
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Background audio player instance for full-length song streaming
  const ytPlayerRef = useRef<any>(null);

  // Timestamp and position reference for smooth Spotify position interpolation
  const spotifyStateRef = useRef<{
    positionMs: number;
    timestamp: number;
    paused: boolean;
    durationMs: number;
  }>({
    positionMs: 0,
    timestamp: Date.now(),
    paused: true,
    durationMs: 0,
  });

  // Spotify Web Playback SDK singleton hook
  const spotifyPlayer = useSpotifyPlayer({
    enabled: isSpotifyConnected,
    initialVolume: volume / 100,
    onStateChange: (state) => {
      if (!state) return;
      spotifyStateRef.current = {
        positionMs: state.position,
        timestamp: Date.now(),
        paused: state.paused,
        durationMs: state.duration,
      };

      setDuration(Math.round(state.duration / 1000));
      setProgress(Math.round(state.position / 1000));

      const current = state.track_window?.current_track;
      if (current) {
        setCurrentTrack((prev) => ({
          ...prev,
          id: `spotify-${current.id}`,
          title: current.name,
          artist:
            current.artists?.map((a) => a.name).filter(Boolean).join(", ") ||
            prev.artist,
          album: current.album?.name || prev.album,
          art: current.album?.images?.[0]?.url || prev.art,
          duration: formatTime(state.duration / 1000),
          durationMs: state.duration,
          source: "Spotify",
        }));
      }

      if (playbackMode === "spotify") {
        setIsPlaying(!state.paused);
      }
    },
  });

  // Keep volume synced to both audio engines
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
    void spotifyPlayer.setVolume(volume / 100).catch(() => undefined);
  }, [volume, spotifyPlayer]);

  // Interpolate progress smoothly while Spotify is actively playing
  useEffect(() => {
    if (playbackMode !== "spotify" || !isPlaying) return;

    const interval = window.setInterval(() => {
      const { positionMs, timestamp, paused, durationMs } =
        spotifyStateRef.current;
      if (paused) return;

      const elapsed = Date.now() - timestamp;
      const currentPosMs = Math.min(positionMs + elapsed, durationMs);
      const currentPosSec = Math.floor(currentPosMs / 1000);
      setProgress(currentPosSec);
    }, 500);

    return () => window.clearInterval(interval);
  }, [playbackMode, isPlaying]);

  // Setup native HTML5 audio element attached to document for background streaming & lock screen audio session
  useEffect(() => {
    if (typeof window === "undefined") return;

    let audio = document.getElementById("musivo-native-audio") as HTMLAudioElement;
    if (!audio) {
      audio = document.createElement("audio");
      audio.id = "musivo-native-audio";
      audio.setAttribute("playsinline", "true");
      audio.setAttribute("webkit-playsinline", "true");
      audio.preload = "auto";
      Object.assign(audio.style, {
        position: "fixed",
        bottom: "-100px",
        left: "-100px",
        width: "1px",
        height: "1px",
        opacity: "0.01",
        pointerEvents: "none",
      });
      document.body.appendChild(audio);
    }
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        const audioSec = Math.round(audioRef.current?.duration || 0);
        if (audioSec > 0) {
          setDuration(audioSec);
        }
      }
    };

    const handleTimeUpdate = () => {
      if (audioRef.current && (playbackMode === "full" || playbackMode === "preview")) {
        setProgress(Math.round(audioRef.current.currentTime || 0));
      }
    };

    const handleEnded = () => {
      void flushListeningSessionRef.current(1);
      void skipRef.current(1);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [playbackMode]);

  // Background YouTube audio player setup for full-length song playback
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initYt = () => {
      if (!window.YT?.Player || ytPlayerRef.current) return;
      try {
        let container = document.getElementById("musivo-yt-audio-container");
        if (!container) {
          container = document.createElement("div");
          container.id = "musivo-yt-audio-container";
          Object.assign(container.style, {
            position: "fixed",
            bottom: "-9999px",
            left: "-9999px",
            width: "2px",
            height: "2px",
            opacity: "0.01",
            pointerEvents: "none",
          });
          const target = document.createElement("div");
          target.id = "musivo-yt-player-target";
          container.appendChild(target);
          document.body.appendChild(container);
        }

        const player = new window.YT.Player("musivo-yt-player-target", {
          height: "1",
          width: "1",
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              ytPlayerRef.current = event.target;
              try {
                event.target.setVolume(volume);
              } catch {}
            },
            onStateChange: (event: any) => {
              // 1: playing, 2: paused, 0: ended
              if (event.data === 1) {
                setIsPlaying(true);
                const dur = Math.floor(player.getDuration() || 0);
                if (dur > 0) setDuration(dur);
              } else if (event.data === 2) {
                setIsPlaying(false);
              } else if (event.data === 0) {
                void flushListeningSessionRef.current(1);
                void skipRef.current(1);
              }
            },
            onError: (err: any) => {
              console.warn("[Musivo Full Stream] Audio error:", err);
            },
          },
        });
      } catch (err) {
        console.warn("[Musivo] Failed to init background audio player:", err);
      }
    };

    if (window.YT && window.YT.Player) {
      initYt();
    } else {
      if (!document.getElementById("musivo-yt-api-script")) {
        const script = document.createElement("script");
        script.id = "musivo-yt-api-script";
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
      }
      const existingCb = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        existingCb?.();
        initYt();
      };
    }
  }, [volume]);

  // Track position and full duration while in full streaming mode
  useEffect(() => {
    if (playbackMode !== "full" || !isPlaying) return;

    const interval = window.setInterval(() => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === "function") {
        try {
          const cur = Math.floor(ytPlayerRef.current.getCurrentTime() || 0);
          setProgress(cur);
          const dur = Math.floor(ytPlayerRef.current.getDuration() || 0);
          if (dur > 0) {
            setDuration(dur);
          }
        } catch {}
      }
    }, 500);

    return () => window.clearInterval(interval);
  }, [playbackMode, isPlaying]);

  // Play a track (Full-Length & Spotify)
  const playTrack = useCallback(
    async (track: PlaybackTrack, newQueue?: PlaybackTrack[]) => {
      if (newQueue && newQueue.length > 0) {
        setQueue(newQueue);
      }

      // Pre-warm audio elements on user gesture to comply with browser autoplay policies
      void spotifyPlayer.activateElement().catch(() => undefined);

      // Flush previous listening session if active
      void flushListeningSessionRef.current(0);

      let playTarget = track;
      const initialDuration = parseDuration(playTarget.durationMs || playTarget.duration);

      const isPodcast =
        playTarget.source === "spotify-episode" ||
        playTarget.badge === "PODCAST EPISODE" ||
        Boolean((playTarget as any).isEpisode);

      activeSessionRef.current = {
        contentId: String(playTarget.id),
        contentType: isPodcast ? "episode" : "track",
        title: playTarget.title,
        artist: playTarget.artist,
        artworkUrl: playTarget.art,
        durationMs: playTarget.durationMs || undefined,
        startedAt: new Date(),
        accumulatedMs: 0,
        lastTick: Date.now(),
      };

      if (isPodcast) {
        setActiveEpisodeId(String(playTarget.id).replace(/^spotify-/, ""));
      }

      // 1. Authoritative path: Spotify Web Playback SDK (if Spotify is connected)
      if (isSpotifyConnected) {
        let isSpotifyTrack =
          String(playTarget.id).startsWith("spotify-") ||
          playTarget.source === "Spotify" ||
          Boolean(playTarget.storeUrl?.includes("spotify.com"));

        // If not a Spotify track (e.g. from iTunes search or catalog), resolve on Spotify!
        if (!isSpotifyTrack && playTarget.title) {
          try {
            const resolved = await trpcUtils.spotify.resolveTrack.fetch({
              title: playTarget.title,
              artist: playTarget.artist,
            });
            if (resolved?.spotifyTrackId) {
              playTarget = {
                ...playTarget,
                id: `spotify-${resolved.spotifyTrackId}`,
                source: "Spotify",
                storeUrl: `https://open.spotify.com/track/${resolved.spotifyTrackId}`,
                durationMs: resolved.durationMs || playTarget.durationMs,
                duration: resolved.durationMs
                  ? formatTime(resolved.durationMs / 1000)
                  : playTarget.duration,
                art: resolved.art || playTarget.art,
              };
              isSpotifyTrack = true;
            }
          } catch (resErr) {
            console.warn("[Musivo] Track resolution to Spotify skipped:", resErr);
          }
        }

        if (isSpotifyTrack) {
          try {
            if (audioRef.current) audioRef.current.pause();
            if (ytPlayerRef.current?.pauseVideo) ytPlayerRef.current.pauseVideo();

            setCurrentTrack(playTarget);
            setProgress(0);
            setDuration(initialDuration || 0);
            setPlaybackMode("spotify");
            setUserError(null);

            await spotifyPlayer.playTrack(String(playTarget.id));
            setIsPlaying(true);
            return;
          } catch (err: unknown) {
            const isPremiumReq =
              err instanceof Error &&
              (err.message.includes("PREMIUM_REQUIRED") || err.message.includes("403"));

            if (isPremiumReq) {
              toast.info(
                "Spotify Premium is required for full web SDK streaming. Streaming full song via Musivo high-fidelity engine."
              );
            } else {
              console.warn(
                "[Musivo] Spotify Web Playback SDK error, transitioning to full engine stream:",
                err
              );
            }
          }
        }
      }

      // 2. High-Fidelity Full-Length Audio Engine Stream (Full duration, seeking, background playback)
      try {
        const fullStream = await trpcUtils.music.resolveFullStream.fetch({
          title: playTarget.title,
          artist: playTarget.artist,
        });

        if (fullStream?.videoId) {
          if (audioRef.current) audioRef.current.pause();
          if (spotifyPlayer.isPlaying) void spotifyPlayer.pause().catch(() => undefined);

          setCurrentTrack(playTarget);
          setProgress(0);
          setDuration(initialDuration || 0);
          setPlaybackMode("full");
          setIsPlaying(true);
          setUserError(null);

          if (ytPlayerRef.current?.loadVideoById) {
            ytPlayerRef.current.loadVideoById(fullStream.videoId);
            ytPlayerRef.current.setVolume(volume);
            ytPlayerRef.current.playVideo();
            return;
          }
        }
      } catch (streamErr) {
        console.warn("[Musivo] Full-length stream resolution fallback:", streamErr);
      }

      // 3. Direct High-Fidelity Native Audio (only if real non-preview full audio stream URL exists)
      const isPreviewClip =
        !playTarget.audio ||
        playTarget.audio.includes("p.scdn.co") ||
        playTarget.audio.includes("audio-ak-spotify");

      if (playTarget.audio && !isPreviewClip) {
        if (spotifyPlayer.isPlaying) void spotifyPlayer.pause().catch(() => undefined);
        if (ytPlayerRef.current?.pauseVideo) ytPlayerRef.current.pauseVideo();

        setCurrentTrack(playTarget);
        setProgress(0);
        setDuration(initialDuration || 0);
        setPlaybackMode("full");
        setIsPlaying(true);
        setUserError(null);

        if (audioRef.current) {
          audioRef.current.src = playTarget.audio;
          audioRef.current.volume = volume / 100;
          try {
            await audioRef.current.play();
            setIsPlaying(true);
            return;
          } catch (e) {
            console.warn("[Musivo Native Engine] Play error:", e);
            setIsPlaying(false);
          }
        }
      }

      // 4. No playback available
      setCurrentTrack(playTarget);
      setIsPlaying(false);
      toast.info("No audio stream available for this track.");
    },
    [isSpotifyConnected, spotifyPlayer, volume, trpcUtils]
  );

  const pause = useCallback(async () => {
    if (playbackMode === "spotify") {
      await spotifyPlayer.pause().catch(() => undefined);
    }
    if (ytPlayerRef.current?.pauseVideo) {
      try {
        ytPlayerRef.current.pauseVideo();
      } catch {}
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  }, [playbackMode, spotifyPlayer]);

  const resume = useCallback(async () => {
    void spotifyPlayer.activateElement().catch(() => undefined);
    if (playbackMode === "spotify") {
      await spotifyPlayer.resume().catch(() => undefined);
      setIsPlaying(true);
    } else if (audioRef.current && (playbackMode === "full" || playbackMode === "preview") && currentTrack.audio) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    } else if (playbackMode === "full" && ytPlayerRef.current?.playVideo) {
      ytPlayerRef.current.playVideo();
      setIsPlaying(true);
    }
  }, [playbackMode, spotifyPlayer, currentTrack]);

  const togglePlay = useCallback(async () => {
    void spotifyPlayer.activateElement().catch(() => undefined);
    if (isPlaying) {
      await pause();
    } else {
      if (playbackMode === "idle") {
        await playTrack(currentTrack);
      } else {
        await resume();
      }
    }
  }, [isPlaying, pause, resume, playbackMode, playTrack, currentTrack, spotifyPlayer]);

  const seek = useCallback(
    async (seconds: number) => {
      const safeSeconds = Math.max(0, seconds);
      setProgress(safeSeconds);

      if (playbackMode === "spotify") {
        spotifyStateRef.current.positionMs = safeSeconds * 1000;
        spotifyStateRef.current.timestamp = Date.now();
        await spotifyPlayer.seek(safeSeconds * 1000).catch(() => undefined);
      }
      if (audioRef.current && (playbackMode === "full" || playbackMode === "preview")) {
        audioRef.current.currentTime = safeSeconds;
      }
      if (playbackMode === "full" && ytPlayerRef.current?.seekTo) {
        try {
          ytPlayerRef.current.seekTo(safeSeconds, true);
        } catch {}
      }
    },
    [playbackMode, spotifyPlayer]
  );

  const setVolume = useCallback(
    async (volumePercent: number) => {
      const clamped = Math.max(0, Math.min(100, volumePercent));
      setVolumeState(clamped);
      if (audioRef.current) {
        audioRef.current.volume = clamped / 100;
      }
      if (ytPlayerRef.current?.setVolume) {
        try {
          ytPlayerRef.current.setVolume(clamped);
        } catch {}
      }
      await spotifyPlayer.setVolume(clamped / 100);
    },
    [spotifyPlayer]
  );

  const setSleepTimer = useCallback(
    (minutes: number | null, isTrackEnd = false) => {
      if (minutes === null) {
        setSleepTimerState(null);
        setSleepTimerRemainingSec(null);
        if (baseVolumeRef.current) {
          void setVolume(baseVolumeRef.current);
        }
        toast.info("Sleep timer turned off");
        return;
      }

      baseVolumeRef.current = volume;

      if (isTrackEnd) {
        setSleepTimerState({ minutes: 0, targetTimestamp: 0, mode: "track_end" });
        setSleepTimerRemainingSec(null);
        toast.success("Sleep timer set: Stop at end of track");
        return;
      }

      const target = Date.now() + minutes * 60 * 1000;
      setSleepTimerState({ minutes, targetTimestamp: target, mode: "minutes" });
      setSleepTimerRemainingSec(minutes * 60);
      toast.success(`Sleep timer set for ${minutes} minutes`);
    },
    [volume, setVolume]
  );

  // Sleep timer ticker with 10-second volume fade-out
  useEffect(() => {
    if (!sleepTimer || sleepTimer.mode !== "minutes") return;

    const interval = setInterval(() => {
      const remainingMs = sleepTimer.targetTimestamp - Date.now();
      if (remainingMs <= 0) {
        void pause();
        void setVolume(baseVolumeRef.current);
        setSleepTimerState(null);
        setSleepTimerRemainingSec(null);
        toast.info("Sleep timer ended — playback paused");
      } else {
        const remSec = Math.ceil(remainingMs / 1000);
        setSleepTimerRemainingSec(remSec);

        // Smooth 10s volume fade out
        if (remSec <= 10) {
          const fraction = Math.max(0, remSec / 10);
          const fadedVolume = Math.round(baseVolumeRef.current * fraction);
          if (audioRef.current) audioRef.current.volume = fadedVolume / 100;
          if (ytPlayerRef.current?.setVolume) {
            try {
              ytPlayerRef.current.setVolume(fadedVolume);
            } catch {}
          }
          void spotifyPlayer.setVolume(fadedVolume / 100).catch(() => undefined);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimer, pause, setVolume, spotifyPlayer]);

  // Podcast / general playback speed control
  const setPlaybackSpeed = useCallback((speed: number) => {
    const clamped = Math.max(0.5, Math.min(2.0, speed));
    setPlaybackSpeedState(clamped);
    if (audioRef.current) {
      audioRef.current.playbackRate = clamped;
    }
    if (ytPlayerRef.current?.setPlaybackRate) {
      try {
        ytPlayerRef.current.setPlaybackRate(clamped);
      } catch {}
    }
  }, []);

  // Relative seek (e.g. ±15 seconds for podcasts)
  const seekRelative = useCallback(
    async (offsetSeconds: number) => {
      const newPos = Math.max(0, Math.min(duration || 9999, progress + offsetSeconds));
      await seek(newPos);
    },
    [duration, progress, seek]
  );

  // Foreground / background audio position reconciliation
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && isPlaying) {
        if (playbackMode === "full" && ytPlayerRef.current?.getCurrentTime) {
          try {
            const cur = Math.floor(ytPlayerRef.current.getCurrentTime() || 0);
            if (cur > 0) setProgress(cur);
          } catch {}
        } else if (audioRef.current && (playbackMode === "full" || playbackMode === "preview")) {
          setProgress(Math.round(audioRef.current.currentTime || 0));
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isPlaying, playbackMode]);

  // Smart Queue auto-continuation prefetching when queue has <= 1 track remaining
  useEffect(() => {
    if (
      queue.length <= 1 &&
      isPlaying &&
      repeatMode === "off" &&
      !prefetchingQueueRef.current &&
      currentTrack.id &&
      String(currentTrack.id) !== "fallback-1"
    ) {
      prefetchingQueueRef.current = true;
      const seedId = String(currentTrack.id).replace(/^spotify-/, "");
      trpcUtils.music.smartQueueContinuation
        .fetch({ seedTrackIds: [seedId], count: 5 })
        .then((newTracks) => {
          if (newTracks && newTracks.length > 0) {
            const mapped: PlaybackTrack[] = newTracks.map((t) => ({
              id: t.id,
              title: t.title,
              artist: t.artist,
              album: t.album,
              duration: formatTime((t.durationMs || 180000) / 1000),
              art: t.art,
              audio: t.audio,
              accent: t.accent || "#f5ba42",
              durationMs: t.durationMs,
              storeUrl: t.storeUrl,
              source: "Spotify",
            }));
            setQueue((prev) => {
              const existingIds = new Set(prev.map((x) => String(x.id)));
              const unique = mapped.filter((m) => !existingIds.has(String(m.id)));
              return [...prev, ...unique];
            });
          }
        })
        .catch(() => undefined)
        .finally(() => {
          prefetchingQueueRef.current = false;
        });
    }
  }, [queue.length, isPlaying, repeatMode, currentTrack.id, trpcUtils]);

  const toggleRepeatMode = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === "off") {
        toast.success("Repeat all enabled");
        return "all";
      }
      if (prev === "all") {
        toast.success("Repeat track enabled");
        return "one";
      }
      toast.info("Repeat disabled");
      return "off";
    });
  }, []);

  const addToQueue = useCallback(
    (track: PlaybackTrack) => {
      setQueue((prev) => {
        if (prev.length === 0) {
          return [currentTrack, track];
        }
        return [...prev, track];
      });
      toast.success(`Added "${track.title}" to queue`);
    },
    [currentTrack]
  );

  const playNextInQueue = useCallback(
    (track: PlaybackTrack) => {
      setQueue((prev) => {
        const idx = prev.findIndex((t) => String(t.id) === String(currentTrack.id));
        if (idx >= 0) {
          const copy = [...prev];
          copy.splice(idx + 1, 0, track);
          return copy;
        }
        return [currentTrack, track, ...prev];
      });
      toast.success(`Playing "${track.title}" next`);
    },
    [currentTrack]
  );

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, idx) => idx !== index));
    toast.info("Removed track from queue");
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([currentTrack]);
    toast.info("Queue cleared");
  }, [currentTrack]);

  const shuffleQueue = useCallback(() => {
    setQueue((prev) => {
      if (prev.length <= 1) {
        toast.info("Not enough tracks in queue to shuffle");
        return prev;
      }
      const curIdx = prev.findIndex((t) => String(t.id) === String(currentTrack.id));
      const current = curIdx >= 0 ? prev[curIdx] : currentTrack;
      const others = prev.filter((_, i) => i !== curIdx);
      for (let i = others.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [others[i], others[j]] = [others[j], others[i]];
      }
      toast.success("Upcoming queue shuffled");
      return [current, ...others];
    });
  }, [currentTrack]);

  const skip = useCallback(
    async (direction: 1 | -1) => {
      void spotifyPlayer.activateElement().catch(() => undefined);

      if (sleepTimer?.mode === "track_end" && direction === 1) {
        if (playbackMode === "full" && ytPlayerRef.current?.pauseVideo) {
          ytPlayerRef.current.pauseVideo();
        } else if (audioRef.current) {
          audioRef.current.pause();
        } else if (playbackMode === "spotify") {
          await spotifyPlayer.pause().catch(() => undefined);
        }
        setIsPlaying(false);
        setSleepTimerState(null);
        setSleepTimerRemainingSec(null);
        toast.info("Track ended — sleep timer paused playback");
        return;
      }

      if (repeatMode === "one" && direction === 1) {
        if (playbackMode === "full" && ytPlayerRef.current?.seekTo) {
          ytPlayerRef.current.seekTo(0, true);
          ytPlayerRef.current.playVideo();
        } else if (audioRef.current) {
          audioRef.current.currentTime = 0;
          await audioRef.current.play().catch(() => undefined);
        }
        setProgress(0);
        setIsPlaying(true);
        return;
      }

      const activeQueue = queue.length > 0 ? queue : [currentTrack];
      const curIndex = activeQueue.findIndex((t) => String(t.id) === String(currentTrack.id));

      if (direction === 1) {
        if (curIndex >= 0 && curIndex < activeQueue.length - 1) {
          await playTrack(activeQueue[curIndex + 1]);
        } else if (repeatMode === "all" && activeQueue.length > 0) {
          await playTrack(activeQueue[0]);
        } else {
          // Reached end of queue without repeat: stay at last track
          if (playbackMode === "full" && ytPlayerRef.current?.pauseVideo) {
            ytPlayerRef.current.pauseVideo();
          } else if (audioRef.current) {
            audioRef.current.pause();
          }
          setIsPlaying(false);
        }
      } else {
        if (curIndex > 0) {
          await playTrack(activeQueue[curIndex - 1]);
        } else if (repeatMode === "all" && activeQueue.length > 0) {
          await playTrack(activeQueue[activeQueue.length - 1]);
        } else {
          if (playbackMode === "full" && ytPlayerRef.current?.seekTo) {
            ytPlayerRef.current.seekTo(0, true);
          } else if (audioRef.current) {
            audioRef.current.currentTime = 0;
          }
          setProgress(0);
        }
      }
    },
    [queue, currentTrack, repeatMode, playbackMode, playTrack, sleepTimer, pause, spotifyPlayer]
  );

  useEffect(() => {
    skipRef.current = skip;
  }, [skip]);

  const clearError = useCallback(() => {
    setUserError(null);
  }, []);

  const connectSpotify = useCallback(() => {
    if (typeof window === "undefined") return;
    const returnPath = window.location.pathname + window.location.search;
    window.location.href = `/api/auth/spotify?returnTo=${encodeURIComponent(returnPath)}`;
  }, []);

  // Media Session API & Background Audio Focus for Mobile/Tablet/Desktop lock screen and background streaming
  const backgroundAudioKeeperRef = useRef<HTMLAudioElement | null>(null);
  const preloadAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Attached off-screen keeper audio element to retain native audio focus and OS media pipeline when app is backgrounded
    let bgAudio = document.getElementById("musivo-background-keeper") as HTMLAudioElement;
    if (!bgAudio) {
      bgAudio = document.createElement("audio");
      bgAudio.id = "musivo-background-keeper";
      bgAudio.loop = true;
      bgAudio.volume = 0.001;
      bgAudio.setAttribute("playsinline", "true");
      bgAudio.setAttribute("webkit-playsinline", "true");
      Object.assign(bgAudio.style, {
        position: "fixed",
        bottom: "-100px",
        left: "-100px",
        width: "1px",
        height: "1px",
        opacity: "0.01",
        pointerEvents: "none",
      });
      bgAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
      document.body.appendChild(bgAudio);
    }
    backgroundAudioKeeperRef.current = bgAudio;

    return () => {
      bgAudio.pause();
    };
  }, []);

  // Preload next track audio for seamless, zero-gap background streaming transition
  useEffect(() => {
    if (typeof window === "undefined") return;
    const activeQueue = queue.length > 0 ? queue : [currentTrack];
    const curIndex = activeQueue.findIndex((t) => String(t.id) === String(currentTrack.id));
    const nextTrack =
      curIndex >= 0 && curIndex < activeQueue.length - 1
        ? activeQueue[curIndex + 1]
        : repeatMode === "all" && activeQueue.length > 0
        ? activeQueue[0]
        : null;

    if (nextTrack?.audio) {
      if (!preloadAudioRef.current) {
        const pAudio = document.createElement("audio");
        pAudio.preload = "auto";
        pAudio.setAttribute("playsinline", "true");
        pAudio.setAttribute("webkit-playsinline", "true");
        Object.assign(pAudio.style, {
          position: "fixed",
          bottom: "-100px",
          left: "-100px",
          width: "1px",
          height: "1px",
          opacity: "0.01",
          pointerEvents: "none",
        });
        document.body.appendChild(pAudio);
        preloadAudioRef.current = pAudio;
      }
      preloadAudioRef.current.src = nextTrack.audio;
    }
  }, [currentTrack, queue, repeatMode]);

  // Sync background audio keeper with playing state for full streaming & PWA background playback
  useEffect(() => {
    if (!backgroundAudioKeeperRef.current) return;
    if (isPlaying && (playbackMode === "full" || playbackMode === "preview")) {
      backgroundAudioKeeperRef.current.play().catch(() => undefined);
    } else {
      backgroundAudioKeeperRef.current.pause();
    }
  }, [isPlaying, playbackMode]);

  // Sync track metadata with OS lock screen, notifications, and Control Center
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    try {
      const getAbsoluteUrl = (url?: string | null) => {
        if (!url) return `${window.location.origin}/musivo-logo.png`;
        if (url.startsWith("http://") || url.startsWith("https://")) return url;
        return `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
      };

      const artUrl = getAbsoluteUrl(currentTrack.art);
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title || "Musivo",
        artist: currentTrack.artist || "Music, Reimagined",
        album: currentTrack.album || "Musivo",
        artwork: [
          { src: artUrl, sizes: "96x96", type: "image/jpeg" },
          { src: artUrl, sizes: "128x128", type: "image/jpeg" },
          { src: artUrl, sizes: "192x192", type: "image/jpeg" },
          { src: artUrl, sizes: "256x256", type: "image/jpeg" },
          { src: artUrl, sizes: "384x384", type: "image/jpeg" },
          { src: artUrl, sizes: "512x512", type: "image/jpeg" },
        ],
      });
    } catch (err) {
      console.warn("[MediaSession] Metadata update skipped:", err);
    }
  }, [currentTrack]);

  // Sync playback state with Media Session (playing / paused / none)
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    try {
      if (playbackMode === "idle") {
        navigator.mediaSession.playbackState = "none";
      } else {
        navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
      }
    } catch {}
  }, [isPlaying, playbackMode]);

  // Wire up Media Session action handlers (Lock screen controls & Bluetooth buttons)
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    const actionMap: [MediaSessionAction, MediaSessionActionHandler | null][] = [
      [
        "play",
        async () => {
          if (audioRef.current && (playbackMode === "full" || playbackMode === "preview")) {
            try {
              await audioRef.current.play();
              setIsPlaying(true);
            } catch {
              await resume();
            }
          } else {
            await resume();
          }
        },
      ],
      [
        "pause",
        () => {
          if (audioRef.current) {
            audioRef.current.pause();
          }
          void pause();
        },
      ],
      ["previoustrack", () => void skip(-1)],
      ["nexttrack", () => void skip(1)],
      [
        "seekto",
        (details) => {
          if (typeof details.seekTime === "number") {
            void seek(details.seekTime);
          }
        },
      ],
      [
        "seekbackward",
        (details) => {
          const offset = details.seekOffset || 10;
          void seek(Math.max(0, progress - offset));
        },
      ],
      [
        "seekforward",
        (details) => {
          const offset = details.seekOffset || 10;
          void seek(Math.min(duration || 9999, progress + offset));
        },
      ],
      ["stop", () => void pause()],
    ];

    actionMap.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {}
    });

    return () => {
      actionMap.forEach(([action]) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {}
      });
    };
  }, [resume, pause, skip, seek, progress, duration]);

  // Sync position state
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "mediaSession" in navigator &&
      typeof navigator.mediaSession.setPositionState === "function" &&
      duration > 0
    ) {
      try {
        navigator.mediaSession.setPositionState({
          duration: Math.max(0, duration),
          playbackRate: isPlaying ? 1.0 : 0,
          position: Math.min(Math.max(0, progress), duration),
        });
      } catch {}
    }
  }, [progress, duration, isPlaying]);

  const value = useMemo<PlaybackContextType>(
    () => ({
      currentTrack,
      isPlaying,
      progress,
      duration,
      volume,
      playbackMode,
      spotifyConnectionState: spotifyPlayer.connectionState,
      deviceId: spotifyPlayer.deviceId,
      sdkLoaded: spotifyPlayer.sdkLoaded,
      isPremium: spotifyPlayer.isPremium,
      isSpotifyConnected,
      error: userError || spotifyPlayer.error,
      autoplayBlocked: spotifyPlayer.autoplayFailed,
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
      pause,
      resume,
      seek,
      setVolume,
      skip,
      setQueue,
      clearError,
      connectSpotify,
      sleepTimer,
      sleepTimerRemainingSec,
      setSleepTimer,
      activeEpisodeId,
      setActiveEpisodeId,
      videoMode,
      setVideoMode,
      playbackSpeed,
      setPlaybackSpeed,
      seekRelative,
    }),
    [
      currentTrack,
      isPlaying,
      progress,
      duration,
      volume,
      playbackMode,
      spotifyPlayer.connectionState,
      spotifyPlayer.deviceId,
      spotifyPlayer.sdkLoaded,
      spotifyPlayer.isPremium,
      spotifyPlayer.error,
      spotifyPlayer.autoplayFailed,
      isSpotifyConnected,
      userError,
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
      pause,
      resume,
      seek,
      setVolume,
      skip,
      setQueue,
      clearError,
      connectSpotify,
      sleepTimer,
      sleepTimerRemainingSec,
      setSleepTimer,
      activeEpisodeId,
      videoMode,
      playbackSpeed,
      setPlaybackSpeed,
      seekRelative,
    ]
  );

  return (
    <PlaybackContext.Provider value={value}>
      {children}
    </PlaybackContext.Provider>
  );
}

export function usePlayback() {
  const context = useContext(PlaybackContext);
  if (!context) {
    throw new Error("usePlayback must be used within a PlaybackProvider");
  }
  return context;
}
