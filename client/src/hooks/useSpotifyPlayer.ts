import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

type SpotifySdkPlayer = {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  togglePlay: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  addListener: (event: string, callback: (payload: any) => void) => boolean;
};

declare global {
  interface Window {
    Spotify?: { Player: new (options: { name: string; getOAuthToken: (callback: (token: string) => void) => void; volume?: number }) => SpotifySdkPlayer };
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

const SDK_URL = "https://sdk.scdn.co/spotify-player.js";
const SDK_SELECTOR = 'script[data-musivo-spotify-sdk="true"]';
export type SpotifyConnectionState = "idle" | "authorizing" | "loading" | "connecting" | "ready" | "not_ready" | "error";

export function useSpotifyPlayer(enabled: boolean) {
  const tokenQuery = trpc.spotify.playbackToken.useQuery(undefined, { enabled, staleTime: 45 * 60 * 1000, retry: false });
  const playerRef = useRef<SpotifySdkPlayer | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(Boolean(typeof window !== "undefined" && window.Spotify));
  const [connectionState, setConnectionState] = useState<SpotifyConnectionState>("idle");
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setConnectionState("idle");
      setSdkLoaded(Boolean(window.Spotify));
      return;
    }
    if (tokenQuery.isLoading) {
      setConnectionState("authorizing");
      return;
    }
    if (tokenQuery.error) {
      setConnectionState("error");
      setError(tokenQuery.error.message);
      return;
    }
    if (!tokenQuery.data?.token) return;

    let cancelled = false;
    let script: HTMLScriptElement | null = null;
    setConnectionState("loading");
    setError(null);

    const initialize = () => {
      if (cancelled || !window.Spotify || playerRef.current) return;
      setSdkLoaded(true);
      setConnectionState("connecting");
      const player = new window.Spotify.Player({
        name: "Musivo in-app player",
        volume: 0.72,
        getOAuthToken: (callback) => callback(tokenQuery.data?.token ?? ""),
      });
      player.addListener("ready", ({ device_id }: { device_id: string }) => {
        if (!cancelled) {
          setDeviceId(device_id);
          setConnectionState("ready");
          setError(null);
        }
      });
      player.addListener("not_ready", () => {
        if (!cancelled) {
          setConnectionState("not_ready");
          setIsPlaying(false);
        }
      });
      player.addListener("player_state_changed", (state: { paused?: boolean } | null) => {
        if (!cancelled && state) setIsPlaying(state.paused === false);
      });
      player.addListener("initialization_error", ({ message }: { message: string }) => {
        if (!cancelled) {
          setConnectionState("error");
          setError(message || "Spotify playback could not initialize");
        }
      });
      player.addListener("authentication_error", ({ message }: { message: string }) => {
        if (!cancelled) {
          setConnectionState("error");
          setError(message || "Spotify playback authorization expired");
        }
      });
      player.addListener("account_error", () => {
        if (!cancelled) {
          setConnectionState("error");
          setError("Spotify in-app playback requires a Premium account.");
        }
      });
      player.addListener("playback_error", ({ message }: { message: string }) => {
        if (!cancelled) setError(message || "Spotify could not play this track");
      });
      player.connect().then((connected) => {
        if (!connected && !cancelled) {
          setConnectionState("error");
          setError("Spotify player could not connect in this browser");
        }
      }).catch((connectError: unknown) => {
        if (!cancelled) {
          setConnectionState("error");
          setError(connectError instanceof Error ? connectError.message : "Spotify player could not connect");
        }
      });
      playerRef.current = player;
    };

    const loadSdk = () => {
      if (window.Spotify) {
        setSdkLoaded(true);
        initialize();
        return;
      }
      script = document.querySelector<HTMLScriptElement>(SDK_SELECTOR);
      if (!script) {
        script = document.createElement("script");
        script.src = SDK_URL;
        script.async = true;
        script.dataset.musivoSpotifySdk = "true";
        script.addEventListener("error", () => {
          if (!cancelled) {
            setConnectionState("error");
            setError("Spotify playback SDK could not load in this browser");
          }
        }, { once: true });
        document.head.appendChild(script);
      }
      script.addEventListener("load", initialize, { once: true });
      window.onSpotifyWebPlaybackSDKReady = initialize;
    };

    loadSdk();

    return () => {
      cancelled = true;
      if (window.onSpotifyWebPlaybackSDKReady === initialize) window.onSpotifyWebPlaybackSDKReady = undefined;
      script?.removeEventListener("load", initialize);
      playerRef.current?.disconnect();
      playerRef.current = null;
      setDeviceId(null);
      setIsPlaying(false);
      setConnectionState("idle");
    };
  }, [enabled, tokenQuery.data?.token, tokenQuery.error, tokenQuery.isLoading]);

  async function playTrack(trackId: string) {
    if (tokenQuery.error) throw new Error(tokenQuery.error.message);
    if (!deviceId || !tokenQuery.data?.token) throw new Error(error || "Spotify in-app player is not ready");
    const spotifyId = trackId.replace(/^spotify-/, "");
    const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenQuery.data.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ uris: [`spotify:track:${spotifyId}`] }),
    });
    if (!response.ok) throw new Error(response.status === 403 ? "Spotify requires a Premium account for in-app playback" : "Spotify could not start playback");
    setIsPlaying(true);
  }

  async function setVolume(volume: number) {
    await playerRef.current?.setVolume(Math.max(0, Math.min(1, volume)));
  }

  return {
    isReady: connectionState === "ready",
    isPlaying,
    sdkLoaded,
    deviceId,
    connectionState,
    error: error ?? tokenQuery.error?.message ?? null,
    isLoading: enabled && tokenQuery.isLoading,
    playTrack,
    togglePlay: () => playerRef.current?.togglePlay(),
    pause: () => playerRef.current?.pause(),
    resume: () => playerRef.current?.resume(),
    setVolume,
  };
}
