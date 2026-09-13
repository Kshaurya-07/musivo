import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

type SpotifySdkPlayer = {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  togglePlay: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
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

export function useSpotifyPlayer(enabled: boolean) {
  const tokenQuery = trpc.spotify.playbackToken.useQuery(undefined, { enabled, staleTime: 45 * 60 * 1000, retry: false });
  const playerRef = useRef<SpotifySdkPlayer | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !tokenQuery.data?.token) return;
    let cancelled = false;
    let script: HTMLScriptElement | null = null;

    const initialize = () => {
      if (cancelled || !window.Spotify || playerRef.current) return;
      const player = new window.Spotify.Player({
        name: "Musivo in-app player",
        volume: 0.72,
        getOAuthToken: (callback) => callback(tokenQuery.data?.token ?? ""),
      });
      player.addListener("ready", ({ device_id }: { device_id: string }) => {
        if (!cancelled) {
          setDeviceId(device_id);
          setIsReady(true);
          setError(null);
        }
      });
      player.addListener("not_ready", () => {
        if (!cancelled) setIsReady(false);
      });
      player.addListener("initialization_error", ({ message }: { message: string }) => {
        if (!cancelled) setError(message || "Spotify playback could not initialize");
      });
      player.addListener("authentication_error", ({ message }: { message: string }) => {
        if (!cancelled) setError(message || "Spotify playback authorization expired");
      });
      player.addListener("account_error", () => {
        if (!cancelled) setError("Spotify in-app playback requires a Premium account.");
      });
      player.addListener("playback_error", ({ message }: { message: string }) => {
        if (!cancelled) setError(message || "Spotify could not play this track");
      });
      player.connect().then((connected) => {
        if (!connected && !cancelled) setError("Spotify player could not connect in this browser");
      }).catch((connectError: unknown) => {
        if (!cancelled) setError(connectError instanceof Error ? connectError.message : "Spotify player could not connect");
      });
      playerRef.current = player;
    };

    const loadSdk = () => {
      if (window.Spotify) {
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
          if (!cancelled) setError("Spotify playback SDK could not load in this browser");
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
      setIsReady(false);
    };
  }, [enabled, tokenQuery.data?.token]);

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
  }

  return {
    isReady,
    error,
    isLoading: enabled && tokenQuery.isLoading,
    playTrack,
    togglePlay: () => playerRef.current?.togglePlay(),
    pause: () => playerRef.current?.pause(),
    resume: () => playerRef.current?.resume(),
  };
}
