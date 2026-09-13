export type CatalogTrack = {
  id: number;
  title: string;
  artist: string;
  album: string;
};

export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export function matchesTrackQuery(track: CatalogTrack, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return `${track.title} ${track.artist} ${track.album}`.toLowerCase().includes(normalized);
}

export function getNextTrackIndex<T extends { id: number }>(tracks: T[], currentId: number, direction: 1 | -1) {
  if (tracks.length === 0) return -1;
  const currentIndex = tracks.findIndex((track) => track.id === currentId);
  const safeIndex = currentIndex < 0 ? 0 : currentIndex;
  return (safeIndex + direction + tracks.length) % tracks.length;
}
