import { useEffect, useRef, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";

export type SpotifySdkTrack = {
  uri: string;
  id: string;
  name: string;
  artists: Array<{ uri?: string; name: string }>;
  album: {
    uri?: string;
    name: string;
    images: Array<{ url: string; height?: number; width?: number }>;
  };
  duration_ms: number;
};

export type SpotifySdkPlaybackState = {
  context: {
    uri: string | null;
    metadata: Record<string, unknown> | null;
  };
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: SpotifySdkTrack;
    previous_tracks: SpotifySdkTrack[];
    next_tracks: SpotifySdkTrack[];
  };
};

export type SpotifySdkPlayer = {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  addListener: (event: string, callback: (payload: any) => void) => boolean;
  removeListener: (event: string, callback?: (payload: any) => void) => boolean;
  getCurrentState: () => Promise<SpotifySdkPlaybackState | null>;
  setVolume: (volume: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  togglePlay: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  previousTrack: () => Promise<void>;
  nextTrack: () => Promise<void>;
  activateElement?: () => Promise<void>;
};

declare global {
  interface Window {
    Spotify?: {
      Player: new (options: {
        name: string;
        getOAuthToken: (callback: (token: string) => void) => void;
        volume?: number;
      }) => SpotifySdkPlayer;
    };
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

const SDK_URL = "https://sdk.scdn.co/spotify-player.js";
const SDK_SELECTOR = 'script[data-musivo-spotify-sdk="true"]';

export type SpotifyConnectionState =
  | "idle"
  | "authorizing"
  | "loading"
  | "connecting"
  | "ready"
  | "not_ready"
  | "error";

export type SpotifyPlayerTrackState = {
  id: string;
  uri: string;
  title: string;
  artist: string;
  album: string;
  art: string;
  durationMs: number;
  positionMs: number;
};

export interface UseSpotifyPlayerOptions {
  enabled: boolean;
  initialVolume?: number; // 0.0 to 1.0
  onStateChange?: (state: SpotifySdkPlaybackState | null) => void;
}

export function useSpotifyPlayer({
  enabled,
  initialVolume = 0.5,
  onStateChange,
}: UseSpotifyPlayerOptions) {
  const trpcUtils = trpc.useUtils();
  const playerRef = useRef<SpotifySdkPlayer | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const [deviceId, setDeviceIdState] = useState<string | null>(null);

  const setDeviceId = useCallback((id: string | null) => {
    deviceIdRef.current = id;
    setDeviceIdState(id);
  }, []);

  const [sdkLoaded, setSdkLoaded] = useState(
    Boolean(typeof window !== "undefined" && window.Spotify)
  );
  const [connectionState, setConnectionState] =
    useState<SpotifyConnectionState>("idle");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoplayFailed, setAutoplayFailed] = useState(false);
  const [currentTrack, setCurrentTrack] =
    useState<SpotifyPlayerTrackState | null>(null);
  const [playbackState, setPlaybackState] =
    useState<SpotifySdkPlaybackState | null>(null);

  // Helper to dynamically get the freshest OAuth access token from the backend
  const getFreshToken = useCallback(async (): Promise<string> => {
    try {
      const data = await trpcUtils.spotify.playbackToken.fetch();
      if (!data?.token) {
        throw new Error("No Spotify playback token returned by server");
      }
      return data.token;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to obtain Spotify token";
      setError(msg);
      throw err;
    }
  }, [trpcUtils]);

  useEffect(() => {
    if (!enabled) {
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }
      setDeviceId(null);
      setIsPlaying(false);
      setCurrentTrack(null);
      setPlaybackState(null);
      setConnectionState("idle");
      return;
    }

    let cancelled = false;
    let script: HTMLScriptElement | null = null;
    setConnectionState("loading");
    setError(null);

    const initializePlayer = () => {
      if (cancelled || !window.Spotify || playerRef.current) return;
      setSdkLoaded(true);
      setConnectionState("connecting");

      try {
        const player = new window.Spotify.Player({
          name: "Musivo",
          volume: initialVolume,
          getOAuthToken: (callback) => {
            getFreshToken()
              .then((token) => callback(token))
              .catch((err) => {
                console.error("[Musivo Spotify SDK] getOAuthToken error:", err);
                if (!cancelled) {
                  setConnectionState("error");
                  setError(err instanceof Error ? err.message : "Token refresh failed");
                }
              });
          },
        });

        player.addListener("ready", ({ device_id }: { device_id: string }) => {
          if (cancelled) return;
          console.log("[Musivo Spotify SDK] Ready with Device ID:", device_id);
          setDeviceId(device_id);
          setConnectionState("ready");
          setIsPremium(true);
          setError(null);
        });

        player.addListener("not_ready", ({ device_id }: { device_id: string }) => {
          if (cancelled) return;
          console.warn("[Musivo Spotify SDK] Device not ready:", device_id);
          setConnectionState("not_ready");
          setIsPlaying(false);
        });

        player.addListener("player_state_changed", (state: SpotifySdkPlaybackState | null) => {
          if (cancelled) return;
          setPlaybackState(state);
          onStateChange?.(state);

          if (!state) {
            setIsPlaying(false);
            return;
          }

          setIsPlaying(!state.paused);

          const track = state.track_window?.current_track;
          if (track) {
            setCurrentTrack({
              id: track.id,
              uri: track.uri,
              title: track.name,
              artist: track.artists?.map((a) => a.name).filter(Boolean).join(", ") || "Unknown artist",
              album: track.album?.name || "Single",
              art: track.album?.images?.[0]?.url || "",
              durationMs: state.duration || track.duration_ms || 0,
              positionMs: state.position || 0,
            });
          }
        });

        player.addListener("initialization_error", ({ message }: { message: string }) => {
          if (cancelled) return;
          console.error("[Musivo Spotify SDK] Initialization error:", message);
          setConnectionState("error");
          setError(message || "Spotify playback initialization failed");
        });

        player.addListener("authentication_error", ({ message }: { message: string }) => {
          if (cancelled) return;
          console.error("[Musivo Spotify SDK] Authentication error:", message);
          setConnectionState("error");
          setError(message || "Spotify authorization expired. Please reconnect.");
        });

        player.addListener("account_error", ({ message }: { message: string }) => {
          if (cancelled) return;
          console.warn("[Musivo Spotify SDK] Account info (standard tier):", message);
          setIsPremium(false);
          setConnectionState("ready");
          setError("Spotify Premium is required for full-track web playback.");
        });

        player.addListener("playback_error", ({ message }: { message: string }) => {
          if (cancelled) return;
          console.error("[Musivo Spotify SDK] Playback error:", message);
          setError(message || "Playback error occurred");
        });

        player.addListener("autoplay_failed", () => {
          if (cancelled) return;
          console.warn("[Musivo Spotify SDK] Autoplay failed - user interaction required");
          setAutoplayFailed(true);
        });

        player
          .connect()
          .then((connected) => {
            if (!connected && !cancelled) {
              setConnectionState("error");
              setError("Spotify player could not connect in this browser.");
            }
          })
          .catch((connectError: unknown) => {
            if (!cancelled) {
              setConnectionState("error");
              setError(
                connectError instanceof Error
                  ? connectError.message
                  : "Spotify player connection failed"
              );
            }
          });

        playerRef.current = player;
      } catch (initErr) {
        console.error("[Musivo Spotify SDK] Failed to create player instance:", initErr);
        if (!cancelled) {
          setConnectionState("error");
          setError("Failed to create Spotify Web Playback SDK instance");
        }
      }
    };

    const loadSdkScript = () => {
      if (window.Spotify) {
        setSdkLoaded(true);
        initializePlayer();
        return;
      }

      script = document.querySelector<HTMLScriptElement>(SDK_SELECTOR);
      if (!script) {
        script = document.createElement("script");
        script.src = SDK_URL;
        script.async = true;
        script.dataset.musivoSpotifySdk = "true";
        script.addEventListener(
          "error",
          () => {
            if (!cancelled) {
              setConnectionState("error");
              setError("Spotify Web Playback SDK script failed to load");
            }
          },
          { once: true }
        );
        document.head.appendChild(script);
      }

      const prevCallback = window.onSpotifyWebPlaybackSDKReady;
      window.onSpotifyWebPlaybackSDKReady = () => {
        prevCallback?.();
        initializePlayer();
      };
    };

    loadSdkScript();

    return () => {
      cancelled = true;
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }
      setDeviceId(null);
      setIsPlaying(false);
      setConnectionState("idle");
    };
  }, [enabled, initialVolume, getFreshToken]);

  // Transfer playback to this SDK device
  const transferPlayback = useCallback(
    async (play = false): Promise<void> => {
      if (!deviceId) throw new Error("Spotify player device is not ready yet");
      const token = await getFreshToken();
      const response = await fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play,
        }),
      });
      if (!response.ok && response.status !== 204) {
        const errorText = await response.text().catch(() => "");
        throw new Error(
          response.status === 403
            ? "PREMIUM_REQUIRED"
            : `Failed to transfer playback to Musivo (${response.status}): ${errorText}`
        );
      }
    },
    [deviceId, getFreshToken]
  );

  // Play a specific Spotify track by Spotify ID or full Spotify URI
  const playTrack = useCallback(
    async (trackIdOrUri: string, contextUri?: string): Promise<void> => {
      // If deviceId is not yet cached, wait up to 4 seconds if player is connecting/loading
      let activeDeviceId = deviceIdRef.current || deviceId;
      if (!activeDeviceId && (connectionState === "connecting" || connectionState === "loading" || connectionState === "ready")) {
        const start = Date.now();
        while (!activeDeviceId && Date.now() - start < 4000) {
          await new Promise((r) => setTimeout(r, 200));
          activeDeviceId = deviceIdRef.current || deviceId;
        }
      }

      if (!activeDeviceId) {
        if (isPremium === false) {
          throw new Error("PREMIUM_REQUIRED");
        }
        throw new Error(error || "Spotify Web Playback device is not ready");
      }
      const token = await getFreshToken();
      const rawId = trackIdOrUri
        .replace(/^spotify-/, "")
        .replace(/^spotify:track:/, "");
      const trackUri = rawId.startsWith("spotify:")
        ? rawId
        : `spotify:track:${rawId}`;

      const body: Record<string, unknown> = contextUri
        ? { context_uri: contextUri, offset: { uri: trackUri } }
        : { uris: [trackUri] };

      const url = `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(
        activeDeviceId
      )}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok && response.status !== 204) {
        if (response.status === 403) {
          setIsPremium(false);
          setError("Spotify Premium is required for full-track web playback.");
          throw new Error("PREMIUM_REQUIRED");
        }
        if (response.status === 404) {
          // Device might need explicit transfer first
          await transferPlayback(false);
          await new Promise((r) => setTimeout(r, 350));
          const retryRes = await fetch(url, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          });
          if (!retryRes.ok && retryRes.status !== 204) {
            if (retryRes.status === 403) {
              setIsPremium(false);
              throw new Error("PREMIUM_REQUIRED");
            }
            throw new Error(`Spotify playback request failed with ${retryRes.status}`);
          }
        } else {
          const errorMsg = await response.text().catch(() => "");
          throw new Error(`Spotify playback error (${response.status}): ${errorMsg}`);
        }
      }

      setIsPlaying(true);
      setAutoplayFailed(false);
    },
    [deviceId, error, isPremium, connectionState, getFreshToken, transferPlayback]
  );

  const pause = useCallback(async () => {
    await playerRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(async () => {
    await playerRef.current?.resume();
    setIsPlaying(true);
  }, []);

  const togglePlay = useCallback(async () => {
    await playerRef.current?.togglePlay();
  }, []);

  const seek = useCallback(async (positionMs: number) => {
    await playerRef.current?.seek(Math.max(0, Math.floor(positionMs)));
  }, []);

  const setVolume = useCallback(async (volumeFraction: number) => {
    const clamped = Math.max(0, Math.min(1, volumeFraction));
    await playerRef.current?.setVolume(clamped);
  }, []);

  const nextTrack = useCallback(async () => {
    await playerRef.current?.nextTrack();
  }, []);

  const previousTrack = useCallback(async () => {
    await playerRef.current?.previousTrack();
  }, []);

  const activateElement = useCallback(async () => {
    if (typeof playerRef.current?.activateElement === "function") {
      await playerRef.current.activateElement();
    }
  }, []);

  const getCurrentState = useCallback(async () => {
    if (!playerRef.current) return null;
    return await playerRef.current.getCurrentState();
  }, []);

  return {
    player: playerRef.current,
    isReady: connectionState === "ready",
    isPlaying,
    isPremium,
    sdkLoaded,
    deviceId,
    connectionState,
    error,
    autoplayFailed,
    currentTrack,
    playbackState,
    playTrack,
    transferPlayback,
    pause,
    resume,
    togglePlay,
    seek,
    setVolume,
    nextTrack,
    previousTrack,
    activateElement,
    getCurrentState,
  };
}
