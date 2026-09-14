export type CatalogTrack = {
  id: number | string;
  title: string;
  artist: string;
  album: string;
};

export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export function parseDuration(duration: string | number | null | undefined): number {
  if (typeof duration === "number" && Number.isFinite(duration) && duration > 0) {
    return duration > 1000 ? Math.round(duration / 1000) : Math.round(duration);
  }
  if (typeof duration === "string") {
    const clean = duration.trim();
    if (!clean || clean.toLowerCase() === "preview") return 0;
    const parts = clean.split(":").map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
  }
  return 0;
}

export function matchesTrackQuery(track: CatalogTrack, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return `${track.title} ${track.artist} ${track.album}`.toLowerCase().includes(normalized);
}

export function getNextTrackIndex<T extends { id: number | string }>(tracks: T[], currentId: number | string, direction: 1 | -1) {
  if (tracks.length === 0) return -1;
  const currentIndex = tracks.findIndex((track) => track.id === currentId);
  const safeIndex = currentIndex < 0 ? 0 : currentIndex;
  return (safeIndex + direction + tracks.length) % tracks.length;
}
