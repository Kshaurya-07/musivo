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
import { formatTime, getNextTrackIndex } from "@/lib/musivo";
import {
  useSpotifyPlayer,
  SpotifyConnectionState,
} from "@/hooks/useSpotifyPlayer";
import { toast } from "sonner";

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

export type PlaybackMode = "spotify" | "preview" | "idle";

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
  playTrack: (track: PlaybackTrack, newQueue?: PlaybackTrack[]) => Promise<void>;
  togglePlay: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (seconds: number) => Promise<void>;
  setVolume: (volumePercent: number) => Promise<void>;
  skip: (direction: 1 | -1) => Promise<void>;
  setQueue: (queue: PlaybackTrack[]) => void;
  clearError: () => void;
}

const fallbackDefaultTrack: PlaybackTrack = {
  id: "fallback-1",
  title: "Midnight City",
  artist: "M83",
  album: "Hurry Up, We're Dreaming",
  duration: "4:03",
  art: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=85",
  audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  accent: "#d8ff57",
  badge: "MADE FOR YOU",
  durationMs: 243000,
  source: "fallback",
};

const PlaybackContext = createContext<PlaybackContextType | null>(null);

export function PlaybackProvider({ children }: { children: React.ReactNode }) {
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
  const [userError, setUserError] = useState<string | null>(null);

  // Hidden HTML5 audio element for preview/demo tracks
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
        setDuration(Math.round(audioRef.current.duration || 0));
      }
    };

    const handleTimeUpdate = () => {
      if (audioRef.current && playbackMode === "preview") {
        setProgress(Math.round(audioRef.current.currentTime || 0));
      }
    };

    const handleEnded = () => {
      if (playbackMode === "preview") {
        void skip(1);
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
  }, [playbackMode]);

  // Skip track forward or backward
  const skip = useCallback(
    async (direction: 1 | -1) => {
      const activeQueue = queue.length > 0 ? queue : [currentTrack];
      const nextIndex = getNextTrackIndex(activeQueue, currentTrack.id, direction);
      if (nextIndex >= 0 && activeQueue[nextIndex]) {
        await playTrack(activeQueue[nextIndex]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queue, currentTrack]
  );

  // Play a track
  const playTrack = useCallback(
    async (track: PlaybackTrack, newQueue?: PlaybackTrack[]) => {
      if (newQueue && newQueue.length > 0) {
        setQueue(newQueue);
      }

      const isSpotifyTrack =
        String(track.id).startsWith("spotify-") ||
        track.source === "Spotify" ||
        Boolean(track.storeUrl?.includes("spotify.com"));

      // 1. Primary path: Spotify Web Playback SDK
      if (isSpotifyConnected && isSpotifyTrack) {
        try {
          // Pause HTML audio preview if playing
          if (audioRef.current) {
            audioRef.current.pause();
          }

          setCurrentTrack(track);
          setProgress(0);
          setDuration(
            track.durationMs ? Math.round(track.durationMs / 1000) : 0
          );
          setPlaybackMode("spotify");
          setUserError(null);

          // Start playback via SDK
          await spotifyPlayer.playTrack(String(track.id));
          setIsPlaying(true);
          return;
        } catch (err: unknown) {
          console.warn(
            "[Musivo] Spotify Web Playback SDK could not play track; checking fallback:",
            err
          );
          const message =
            err instanceof Error
              ? err.message
              : "Spotify playback failed to start.";

          setUserError(message);

          // Non-breaking message for Premium requirement
          if (
            message.includes("Premium") ||
            spotifyPlayer.isPremium === false
          ) {
            toast.error(
              "Spotify in-app playback requires Spotify Premium. Falling back to preview audio where available."
            );
          } else {
            toast.info(message);
          }

          // If track has a preview URL, fall through to preview player
          if (!track.audio) {
            setIsPlaying(false);
            return;
          }
        }
      }

      // 2. Fallback path: Preview audio via HTMLAudioElement
      if (track.audio) {
        // Pause Spotify SDK if active
        if (spotifyPlayer.isPlaying) {
          void spotifyPlayer.pause().catch(() => undefined);
        }

        setCurrentTrack(track);
        setProgress(0);
        setDuration(0);
        setPlaybackMode("preview");
        setIsPlaying(true);
        setUserError(null);

        if (audioRef.current) {
          audioRef.current.src = track.audio;
          audioRef.current.volume = volume / 100;
          try {
            await audioRef.current.play();
          } catch {
            console.warn("[Musivo] Preview autoplay blocked by browser");
            setIsPlaying(false);
            toast.info("Click play to allow playback in this browser.");
          }
        }
        return;
      }

      // 3. No playback available
      setCurrentTrack(track);
      setIsPlaying(false);
      if (!isSpotifyConnected) {
        toast.info("Connect Spotify to play full tracks in Musivo.");
      } else {
        toast.info("This track does not have an in-app audio stream.");
      }
    },
    [isSpotifyConnected, spotifyPlayer, volume]
  );

  const pause = useCallback(async () => {
    if (playbackMode === "spotify") {
      await spotifyPlayer.pause();
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  }, [playbackMode, spotifyPlayer]);

  const resume = useCallback(async () => {
    if (playbackMode === "spotify") {
      await spotifyPlayer.resume();
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
      await spotifyPlayer.setVolume(clamped / 100);
    },
    [spotifyPlayer]
  );

  const clearError = useCallback(() => {
    setUserError(null);
  }, []);

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
      playTrack,
      togglePlay,
      pause,
      resume,
      seek,
      setVolume,
      skip,
      setQueue,
      clearError,
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
      playTrack,
      togglePlay,
      pause,
      resume,
      seek,
      setVolume,
      skip,
      clearError,
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
