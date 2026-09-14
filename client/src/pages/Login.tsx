import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [returnTo, setReturnTo] = useState<string>("/");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    const spotifyStatus = params.get("spotify");
    const msg = params.get("message");

    if (err) {
      setErrorMessage(err);
    } else if (spotifyStatus === "error") {
      setErrorMessage(msg || "Spotify authentication failed. Please check Developer Dashboard or try again.");
    } else if (spotifyStatus === "denied") {
      setErrorMessage(msg || "Spotify authorization was cancelled.");
    }

    const ret = params.get("returnTo");
    if (ret && ret.startsWith("/")) {
      setReturnTo(ret);
    }
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`;
  };

  const handleSpotifyLogin = () => {
    window.location.href = `/api/auth/spotify?returnTo=${encodeURIComponent(returnTo)}`;
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0d0a07] px-4 text-white selection:bg-[#f5ba42] selection:text-black">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#f5ba42]/[0.08] blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-amber-600/[0.06] blur-[100px]" />

      {/* Back button */}
      <button
        type="button"
        onClick={() => setLocation(returnTo)}
        className="group absolute left-6 top-6 flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#18120c]/80 px-4 py-2 text-xs font-semibold text-[#a89885] backdrop-blur-md transition-all hover:border-[#f5ba42]/40 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        <span>Back to Musivo</span>
      </button>

      {/* Main card */}
      <div className="relative w-full max-w-md rounded-3xl border border-white/[0.09] bg-[#18120c]/90 p-8 shadow-2xl backdrop-blur-2xl sm:p-10">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#f5ba42]/30 bg-[#f5ba42]/10 shadow-[0_0_30px_rgba(245,186,66,0.2)]">
            <span className="flex h-3 w-3 items-center justify-center">
              <span className="h-3 w-3 animate-ping rounded-full bg-[#f5ba42] opacity-75" />
              <span className="absolute h-3 w-3 rounded-full bg-[#f5ba42]" />
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#faf5ee] sm:text-4xl">
            Welcome to Musivo
          </h1>
          <p className="mt-2 text-sm text-[#a89885]">
            Sign in to continue listening
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-center text-xs font-medium text-rose-300">
            {errorMessage}
          </div>
        )}

        {/* Auth Buttons */}
        <div className="space-y-3.5">
          {/* Continue with Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="group relative flex w-full items-center justify-center gap-3 rounded-2xl border border-white/[0.12] bg-[#22180e] px-5 py-3.5 text-sm font-semibold text-[#faf5ee] shadow-sm transition-all hover:border-white/25 hover:bg-[#2c2014] active:scale-[0.99]"
          >
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.02h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.02c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.12C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.59H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.41l4.04-3.12z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.59l4.04 3.12c.95-2.83 3.6-4.96 6.72-4.96z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Continue with Spotify */}
          <button
            type="button"
            onClick={handleSpotifyLogin}
            className="group relative flex w-full items-center justify-center gap-3 rounded-2xl border border-[#1DB954]/40 bg-[#1DB954]/15 px-5 py-3.5 text-sm font-semibold text-[#faf5ee] shadow-sm transition-all hover:border-[#1DB954] hover:bg-[#1DB954]/25 active:scale-[0.99]"
          >
            <svg className="h-5 w-5 fill-[#1DB954]" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.66.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            <span>Continue with Spotify</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="w-full border-t border-white/[0.08]" />
          <span className="absolute bg-[#18120c] px-3 text-[11px] font-medium uppercase tracking-wider text-[#7d6e5c]">
            or
          </span>
        </div>

        {/* Explore Preview Mode */}
        <button
          type="button"
          onClick={() => setLocation(returnTo)}
          className="w-full rounded-2xl border border-white/[0.06] bg-transparent py-2.5 text-center text-xs font-semibold text-[#a89885] transition-colors hover:border-white/[0.12] hover:text-white"
        >
          Explore in preview mode without signing in
        </button>

        {/* Footer features */}
        <div className="mt-8 flex items-center justify-center gap-4 border-t border-white/[0.06] pt-6 text-[11px] text-[#7d6e5c]">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-[#f5ba42]" />
            Encrypted tokens
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-[#f5ba42]" />
            Spotify Web Playback
          </span>
        </div>
      </div>
    </div>
  );
}
