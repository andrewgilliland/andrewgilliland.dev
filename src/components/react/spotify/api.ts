export interface NowPlayingPayload {
  isPlaying: boolean;
  track: string | null;
  artist: string | null;
  albumArt: string | null;
  progressMs: number | null;
  durationMs: number | null;
  trackUrl: string | null;
  updatedAt: string;
}

export interface RecentlyPlayedItem {
  track: string;
  artist: string;
  albumArt: string | null;
  trackUrl: string | null;
  playedAt: string;
}

export interface RecentlyPlayedPayload {
  items: RecentlyPlayedItem[];
  updatedAt: string;
}

export interface ArtistGraphNode {
  id: string;
  name: string;
  image: string | null;
  genres: string[];
  popularity: number;
  externalUrl: string | null;
}

export interface ArtistGraphEdge {
  source: string;
  target: string;
}

export interface ArtistGraphPayload {
  rootArtistId: string;
  rootArtistName: string | null;
  depth: number;
  nodes: ArtistGraphNode[];
  edges: ArtistGraphEdge[];
  warnings: string[];
  updatedAt: string;
}

const DEFAULT_BASE = "";

function getBaseUrl(): string {
  return (import.meta.env.PUBLIC_SPOTIFY_API_BASE ?? DEFAULT_BASE).replace(
    /\/$/,
    "",
  );
}

function buildUrl(path: string): string {
  const baseUrl = getBaseUrl();
  return baseUrl ? `${baseUrl}${path}` : path;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Spotify API error (${response.status})`);
  }

  return (await response.json()) as T;
}

export function fetchNowPlaying(): Promise<NowPlayingPayload> {
  return fetchJson<NowPlayingPayload>("/api/spotify/now-playing");
}

export function fetchRecentlyPlayed(limit = 5): Promise<RecentlyPlayedPayload> {
  return fetchJson<RecentlyPlayedPayload>(
    `/api/spotify/recently-played?limit=${encodeURIComponent(String(limit))}`,
  );
}

export function fetchArtistGraph(
  artistId: string,
  depth = 2,
  limitPerNode = 6,
): Promise<ArtistGraphPayload> {
  const params = new URLSearchParams({
    artistId,
    depth: String(depth),
    limitPerNode: String(limitPerNode),
  });

  return fetchJson<ArtistGraphPayload>(
    `/api/spotify/artist-graph?${params.toString()}`,
  );
}
