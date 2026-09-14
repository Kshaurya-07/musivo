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

  // Setup preview HTMLAudioElement
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration((prevDuration) => {
          if (prevDuration && prevDuration > 30) return prevDuration;
          const audioSec = Math.round(audioRef.current?.duration || 0);
          return audioSec || prevDuration || 0;
        });
      }
    };

    const handleTimeUpdate = () => {
      if (audioRef.current && playbackMode === "preview") {
        setProgress(Math.round(audioRef.current.currentTime || 0));
      }
    };

    const handleEnded = () => {
      if (playbackMode === "preview") {
        if (!isSpotifyConnected) {
          toast.info("Preview ended. Sign in with Spotify to stream the full-length song!", {
            action: {
              label: "Sign in with Spotify",
              onClick: () => {
                window.location.href = "/api/auth/spotify";
              },
            },
            duration: 8000,
          });
        }
        void skipRef.current(1);
      }
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      audio.src = "";
    };
  }, [playbackMode, isSpotifyConnected]);

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

      let playTarget = track;
      const initialDuration = parseDuration(playTarget.durationMs || playTarget.duration);

      // 1. Primary path: Spotify Web Playback SDK (if Spotify is connected)
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
            console.warn(
              "[Musivo] Spotify Web Playback SDK fallback to full length stream:",
              err
            );
          }
        }
      }

      // 2. Full-Length Audio Stream (Streams the complete full length song!)
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

      // 3. Fallback path: Preview audio via HTMLAudioElement
      if (playTarget.audio) {
        if (spotifyPlayer.isPlaying) void spotifyPlayer.pause().catch(() => undefined);
        if (ytPlayerRef.current?.pauseVideo) ytPlayerRef.current.pauseVideo();

        setCurrentTrack(playTarget);
        setProgress(0);
        setDuration(initialDuration || 0);
        setPlaybackMode("preview");
        setIsPlaying(true);
        setUserError(null);

        if (audioRef.current) {
          audioRef.current.src = playTarget.audio;
          audioRef.current.volume = volume / 100;
          try {
            await audioRef.current.play();
          } catch {
            setIsPlaying(false);
          }
        }
        return;
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
      await spotifyPlayer.pause();
    } else if (playbackMode === "full" && ytPlayerRef.current?.pauseVideo) {
      ytPlayerRef.current.pauseVideo();
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  }, [playbackMode, spotifyPlayer]);

  const resume = useCallback(async () => {
    if (playbackMode === "spotify") {
      await spotifyPlayer.resume();
      setIsPlaying(true);
    } else if (playbackMode === "full" && ytPlayerRef.current?.playVideo) {
      ytPlayerRef.current.playVideo();
      setIsPlaying(true);
    } else if (audioRef.current && currentTrack.audio) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    }
  }, [playbackMode, spotifyPlayer, currentTrack]);

  const togglePlay = useCallback(async () => {
    if (isPlaying) {
      await pause();
    } else {
      if (playbackMode === "idle") {
        await playTrack(currentTrack);
      } else {
        await resume();
      }
    }
  }, [isPlaying, pause, resume, playbackMode, playTrack, currentTrack]);

  const seek = useCallback(
    async (seconds: number) => {
      const safeSeconds = Math.max(0, seconds);
      setProgress(safeSeconds);

      if (playbackMode === "spotify") {
        spotifyStateRef.current.positionMs = safeSeconds * 1000;
        spotifyStateRef.current.timestamp = Date.now();
        await spotifyPlayer.seek(safeSeconds * 1000);
      } else if (playbackMode === "full" && ytPlayerRef.current?.seekTo) {
        ytPlayerRef.current.seekTo(safeSeconds, true);
      } else if (audioRef.current) {
        audioRef.current.currentTime = safeSeconds;
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
    [queue, currentTrack, repeatMode, playbackMode, playTrack]
  );

  useEffect(() => {
    skipRef.current = skip;
  }, [skip]);

  const clearError = useCallback(() => {
    setUserError(null);
  }, []);

  const connectSpotify = useCallback(() => {
    window.location.href = "/api/auth/spotify";
  }, []);

  // Media Session API & Background Audio Focus for Mobile/Tablet/Desktop lock screen and background streaming
  const backgroundAudioKeeperRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Hidden whisper audio element to retain native audio focus and OS media pipeline when app is backgrounded
    const bgAudio = new Audio();
    bgAudio.loop = true;
    bgAudio.volume = 0.01;
    bgAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
    backgroundAudioKeeperRef.current = bgAudio;

    return () => {
      bgAudio.pause();
      bgAudio.src = "";
    };
  }, []);

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
      const artUrl = currentTrack.art || "/musivo-logo.png";
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

  // Sync playback state with Media Session
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    try {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    } catch {}
  }, [isPlaying]);

  // Wire up Media Session action handlers (Lock screen controls & Bluetooth buttons)
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    const actionMap: [MediaSessionAction, MediaSessionActionHandler | null][] = [
      ["play", () => void resume()],
      ["pause", () => void pause()],
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
