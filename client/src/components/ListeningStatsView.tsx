import React from "react";
import {
  Activity,
  Clock,
  Music,
  Podcast,
  TrendingUp,
  Award,
  Calendar,
  Headphones,
  Sparkles,
  BarChart3,
  Loader2,
  Play,
  History,
  Users,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { usePlayback, PlaybackTrack } from "@/contexts/PlaybackContext";
import { formatTime } from "@/lib/musivo";

export function ListeningStatsView() {
  const { playTrack } = usePlayback();
  const statsQuery = trpc.music.getListeningStats.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const historyQuery = trpc.music.getListeningHistory.useQuery({ limit: 15 });

  const stats = statsQuery.data;
  const history = historyQuery.data || [];

  if (statsQuery.isLoading) {
    return (
      <div className="py-28 flex flex-col items-center justify-center gap-3 text-white/40">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <span className="text-sm font-medium">Computing your listening telemetry...</span>
      </div>
    );
  }

  const todayMin = Math.round((stats?.todayMs || 0) / 60000);
  const weekMin = Math.round((stats?.thisWeekMs || 0) / 60000);
  const monthMin = Math.round((stats?.thisMonthMs || 0) / 60000);
  const yearMin = Math.round((stats?.thisYearMs || 0) / 60000);

  const totalMin = Math.round((stats?.totalListenedMs || 0) / 60000);
  const musicMin = Math.round((stats?.musicMs || 0) / 60000);
  const podcastMin = Math.round((stats?.podcastMs || 0) / 60000);
  const musicPercent = totalMin > 0 ? Math.round((musicMin / totalMin) * 100) : 100;
  const podcastPercent = 100 - musicPercent;

  const maxDailyMin = Math.max(
    1,
    ...(stats?.dailyListening || []).map((d) => d.minutes)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-emerald-900/30 via-black/40 to-purple-950/20 border border-white/10 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide uppercase">
              <Activity className="w-3.5 h-3.5" />
              <span>Real-Time Listening Insights</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Listening Analytics & Trends
            </h1>
            <p className="text-sm text-white/60 max-w-xl">
              Telemetry grounded in verified playback sessions (threshold ≥30s). Discover your
              favorite soundscapes, podcast time, and daily acoustic cadence.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-black/40 border border-white/10 rounded-2xl p-4 self-start md:self-auto shrink-0">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Total Time</p>
              <p className="text-2xl font-black text-white">
                {totalMin >= 60 ? `${(totalMin / 60).toFixed(1)} hrs` : `${totalMin} mins`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] space-y-1">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-xs font-semibold uppercase tracking-wider">Today</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{todayMin} min</p>
          <p className="text-[11px] text-white/50">{stats?.tracksPlayed || 0} active plays</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] space-y-1">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-xs font-semibold uppercase tracking-wider">This Week</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{weekMin} min</p>
          <p className="text-[11px] text-white/50">Last 7 rolling days</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] space-y-1">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-xs font-semibold uppercase tracking-wider">This Month</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">
            {monthMin >= 60 ? `${(monthMin / 60).toFixed(1)} hrs` : `${monthMin} min`}
          </p>
          <p className="text-[11px] text-white/50">Active monthly cycle</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] space-y-1">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-xs font-semibold uppercase tracking-wider">Unique Artists</span>
            <Sparkles className="w-4 h-4 text-pink-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">
            {stats?.uniqueArtistsCount || 0}
          </p>
          <p className="text-[11px] text-white/50">In your sound history</p>
        </div>
      </div>

      {/* 7-Day Bar Chart & Music vs Podcasts Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white tracking-tight">7-Day Activity</h3>
            </div>
            <span className="text-xs text-white/40">Minutes per day</span>
          </div>

          <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-2">
            {(stats?.dailyListening || []).map((day) => {
              const heightPercent = Math.max(8, Math.round((day.minutes / maxDailyMin) * 100));
              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-2 group h-full justify-end"
                >
                  <span className="text-[10px] text-white/40 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    {day.minutes}m
                  </span>
                  <div className="w-full max-w-[36px] bg-white/5 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                    <div
                      className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all duration-500 group-hover:from-emerald-500 group-hover:to-teal-300"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-white/60 group-hover:text-white">
                    {day.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Split: Music vs Podcasts */}
        <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.02] space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold text-white tracking-tight">Content Distribution</h3>
            </div>
            <p className="text-xs text-white/50">
              Breakdown between music and spoken-word podcast episodes.
            </p>

            <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden flex mt-4">
              <div
                className="h-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${musicPercent}%` }}
              />
              <div
                className="h-full bg-purple-500 transition-all duration-500"
                style={{ width: `${podcastPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                  <Music className="w-3.5 h-3.5" />
                  <span>Music</span>
                </div>
                <p className="text-xl font-bold text-white">{musicPercent}%</p>
                <p className="text-[11px] text-white/40">{musicMin} min</p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-purple-400 font-semibold">
                  <Podcast className="w-3.5 h-3.5" />
                  <span>Podcasts</span>
                </div>
                <p className="text-xl font-bold text-white">{podcastPercent}%</p>
                <p className="text-[11px] text-white/40">{podcastMin} min</p>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200">
            Musivo learns from your listening cadence to dynamically adjust AI Mix discoveries.
          </div>
        </div>
      </div>

      {/* Top Artists & Top Tracks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Artists */}
        <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Most Listened Artists</span>
          </h3>

          {(stats?.topArtists || []).length === 0 ? (
            <p className="text-xs text-white/40 py-8 text-center">
              Listen to songs for ≥30s to view your top artists.
            </p>
          ) : (
            <div className="space-y-2">
              {(stats?.topArtists || []).slice(0, 6).map((artist, i) => (
                <div
                  key={artist.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.01] hover:bg-white/[0.04] border border-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 text-xs font-bold text-white/40">{i + 1}</span>
                    <span className="text-sm font-semibold text-white truncate">{artist.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-emerald-400">
                      {artist.totalMinutes} min
                    </span>
                    <p className="text-[10px] text-white/40">{artist.playCount} plays</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Tracks */}
        <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Music className="w-4 h-4 text-amber-400" />
            <span>Top Songs</span>
          </h3>

          {(stats?.topTracks || []).length === 0 ? (
            <p className="text-xs text-white/40 py-8 text-center">
              Keep streaming full songs to populate your top tracks.
            </p>
          ) : (
            <div className="space-y-2">
              {(stats?.topTracks || []).slice(0, 6).map((track, i) => (
                <div
                  key={`${track.title}-${track.artist}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.01] hover:bg-white/[0.04] border border-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 text-xs font-bold text-white/40">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{track.title}</p>
                      <p className="text-xs text-white/50 truncate">{track.artist}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-amber-400">
                      {track.totalMinutes} min
                    </span>
                    <p className="text-[10px] text-white/40">{track.playCount} plays</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Listening Session History */}
      {history.length > 0 && (
        <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-4 h-4 text-purple-400" />
            <span>Recent Listening History</span>
          </h3>

          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.01] hover:bg-white/[0.04] border border-white/5 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-black/40 border border-white/5 text-white/50 shrink-0">
                    {item.contentType === "episode" ? (
                      <Podcast className="w-4 h-4 text-purple-400" />
                    ) : (
                      <Music className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                    <p className="text-xs text-white/50 truncate">{item.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-right">
                  <span className="text-xs font-mono text-white/70">
                    {Math.round(item.listenedMs / 1000)}s
                  </span>
                  <span className="text-[11px] text-white/40">
                    {new Date(item.startedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
