interface Env {
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
  SPOTIFY_REFRESH_TOKEN: string;
  ALLOWED_ORIGIN?: string;
}

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
}

interface NowPlayingPayload {
  isPlaying: boolean;
  track: string | null;
  artist: string | null;
  albumArt: string | null;
  progressMs: number | null;
  durationMs: number | null;
  trackUrl: string | null;
  updatedAt: string;
}

interface RecentlyPlayedPayload {
  items: Array<{
    track: string;
    artist: string;
    albumArt: string | null;
    trackUrl: string | null;
    playedAt: string;
  }>;
  updatedAt: string;
}

interface ArtistGraphNode {
  id: string;
  name: string;
  image: string | null;
  genres: string[];
  popularity: number;
  externalUrl: string | null;
}

interface ArtistGraphEdge {
  source: string;
  target: string;
}

interface ArtistGraphPayload {
  rootArtistId: string;
  rootArtistName: string | null;
  depth: number;
  nodes: ArtistGraphNode[];
  edges: ArtistGraphEdge[];
  warnings: string[];
  updatedAt: string;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

const DEFAULT_GRAPH_DEPTH = 2;
const MAX_GRAPH_DEPTH = 2;
const DEFAULT_LIMIT_PER_NODE = 6;
const MAX_LIMIT_PER_NODE = 10;

function corsHeaders(origin: string): Headers {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
  headers.set("Vary", "Origin");
  return headers;
}

function responseJson(
  body: unknown,
  status: number,
  cacheControl: string,
  origin: string,
): Response {
  const headers = corsHeaders(origin);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", cacheControl);
  return new Response(JSON.stringify(body), { status, headers });
}

async function getAccessToken(env: Env): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < cachedToken.expiresAt) {
    return cachedToken.value;
  }

  const credentials = btoa(
    `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`,
  );
  const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: env.SPOTIFY_REFRESH_TOKEN,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Token refresh failed (${tokenResponse.status})`);
  }

  const payload = (await tokenResponse.json()) as SpotifyTokenResponse;
  cachedToken = {
    value: payload.access_token,
    expiresAt: now + (payload.expires_in - 45) * 1000,
  };

  return payload.access_token;
}

async function spotifyGet<T>(
  env: Env,
  path: string,
): Promise<{ status: number; data: T | null }> {
  const token = await getAccessToken(env);
  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 204) {
    return { status: 204, data: null };
  }

  if (!response.ok) {
    throw new Error(`Spotify request failed (${response.status})`);
  }

  return {
    status: response.status,
    data: (await response.json()) as T,
  };
}

function mapNowPlaying(data: any): NowPlayingPayload {
  if (!data || !data.item) {
    return {
      isPlaying: false,
      track: null,
      artist: null,
      albumArt: null,
      progressMs: null,
      durationMs: null,
      trackUrl: null,
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    isPlaying: Boolean(data.is_playing),
    track: data.item?.name ?? null,
    artist: Array.isArray(data.item?.artists)
      ? data.item.artists.map((a: any) => a.name).join(", ")
      : null,
    albumArt:
      data.item?.album?.images?.[1]?.url ??
      data.item?.album?.images?.[0]?.url ??
      null,
    progressMs: typeof data.progress_ms === "number" ? data.progress_ms : null,
    durationMs:
      typeof data.item?.duration_ms === "number" ? data.item.duration_ms : null,
    trackUrl: data.item?.external_urls?.spotify ?? null,
    updatedAt: new Date().toISOString(),
  };
}

function mapRecentlyPlayed(data: any): RecentlyPlayedPayload {
  const items = Array.isArray(data?.items) ? data.items : [];

  return {
    items: items.map((item: any) => ({
      track: item.track?.name ?? "Unknown Track",
      artist: Array.isArray(item.track?.artists)
        ? item.track.artists.map((a: any) => a.name).join(", ")
        : "Unknown Artist",
      albumArt:
        item.track?.album?.images?.[2]?.url ??
        item.track?.album?.images?.[1]?.url ??
        item.track?.album?.images?.[0]?.url ??
        null,
      trackUrl: item.track?.external_urls?.spotify ?? null,
      playedAt: item.played_at ?? new Date().toISOString(),
    })),
    updatedAt: new Date().toISOString(),
  };
}

function mapArtistNode(artist: any): ArtistGraphNode {
  return {
    id: String(artist?.id ?? ""),
    name: String(artist?.name ?? "Unknown Artist"),
    image:
      artist?.images?.[2]?.url ??
      artist?.images?.[1]?.url ??
      artist?.images?.[0]?.url ??
      null,
    genres: Array.isArray(artist?.genres)
      ? artist.genres.filter((g: unknown) => typeof g === "string")
      : [],
    popularity: typeof artist?.popularity === "number" ? artist.popularity : 0,
    externalUrl:
      typeof artist?.external_urls?.spotify === "string"
        ? artist.external_urls.spotify
        : null,
  };
}

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value ?? String(fallback));
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(1, Math.floor(parsed));
}

function normalizeArtistId(raw: string | null): string | null {
  if (!raw) {
    return null;
  }
  const trimmed = raw.trim();
  if (!/^[A-Za-z0-9]{10,32}$/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

async function buildArtistGraph(
  env: Env,
  rootArtistId: string,
  depth: number,
  limitPerNode: number,
): Promise<ArtistGraphPayload> {
  const warnings: string[] = [];
  const nodeMap = new Map<string, ArtistGraphNode>();
  const edgeMap = new Map<string, ArtistGraphEdge>();

  const rootArtist = await spotifyGet<any>(env, `/artists/${rootArtistId}`);
  if (!rootArtist.data) {
    throw new Error("Could not load root artist.");
  }

  const mappedRoot = mapArtistNode(rootArtist.data);
  nodeMap.set(mappedRoot.id, mappedRoot);

  const queue: Array<{ id: string; level: number }> = [
    { id: mappedRoot.id, level: 0 },
  ];
  const expanded = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    if (current.level >= depth || expanded.has(current.id)) {
      continue;
    }

    expanded.add(current.id);

    try {
      const relatedResponse = await spotifyGet<any>(
        env,
        `/artists/${current.id}/related-artists`,
      );

      const relatedArtists = Array.isArray(relatedResponse.data?.artists)
        ? relatedResponse.data.artists.slice(0, limitPerNode)
        : [];

      for (const artist of relatedArtists) {
        const mapped = mapArtistNode(artist);
        if (!mapped.id) {
          continue;
        }

        if (!nodeMap.has(mapped.id)) {
          nodeMap.set(mapped.id, mapped);
        }

        const edgeKey = `${current.id}->${mapped.id}`;
        if (!edgeMap.has(edgeKey)) {
          edgeMap.set(edgeKey, {
            source: current.id,
            target: mapped.id,
          });
        }

        if (current.level + 1 <= depth && !expanded.has(mapped.id)) {
          queue.push({ id: mapped.id, level: current.level + 1 });
        }
      }
    } catch (error) {
      warnings.push(
        `Failed to expand related artists for ${current.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return {
    rootArtistId: mappedRoot.id,
    rootArtistName: mappedRoot.name,
    depth,
    nodes: Array.from(nodeMap.values()),
    edges: Array.from(edgeMap.values()),
    warnings,
    updatedAt: new Date().toISOString(),
  };
}

async function handleNowPlaying(request: Request, env: Env): Promise<Response> {
  const origin = env.ALLOWED_ORIGIN ?? "*";
  const cache = caches.default;
  const cacheKey = new Request(request.url, request);
  const cached = await cache.match(cacheKey);

  if (cached) {
    const headers = corsHeaders(origin);
    cached.headers.forEach((value, key) => headers.set(key, value));
    return new Response(cached.body, { status: cached.status, headers });
  }

  const result = await spotifyGet<any>(env, "/me/player/currently-playing");
  const payload =
    result.status === 204 ? mapNowPlaying(null) : mapNowPlaying(result.data);
  const response = responseJson(payload, 200, "public, max-age=20", origin);
  await cache.put(cacheKey, response.clone());
  return response;
}

async function handleRecentlyPlayed(
  request: Request,
  env: Env,
): Promise<Response> {
  const origin = env.ALLOWED_ORIGIN ?? "*";
  const cache = caches.default;
  const url = new URL(request.url);
  const limitValue = Number(url.searchParams.get("limit") ?? "5");
  const limit = Number.isFinite(limitValue)
    ? Math.min(20, Math.max(1, limitValue))
    : 5;

  const cacheKey = new Request(`${url.origin}${url.pathname}?limit=${limit}`);
  const cached = await cache.match(cacheKey);

  if (cached) {
    const headers = corsHeaders(origin);
    cached.headers.forEach((value, key) => headers.set(key, value));
    return new Response(cached.body, { status: cached.status, headers });
  }

  const result = await spotifyGet<any>(
    env,
    `/me/player/recently-played?limit=${limit}`,
  );
  const payload = mapRecentlyPlayed(result.data);
  const response = responseJson(payload, 200, "public, max-age=120", origin);
  await cache.put(cacheKey, response.clone());
  return response;
}

async function handleArtistGraph(
  request: Request,
  env: Env,
): Promise<Response> {
  const origin = env.ALLOWED_ORIGIN ?? "*";
  const url = new URL(request.url);
  const artistId = normalizeArtistId(url.searchParams.get("artistId"));

  if (!artistId) {
    return responseJson(
      {
        error: "artistId is required and must be alphanumeric.",
      },
      400,
      "no-store",
      origin,
    );
  }

  const requestedDepth = parsePositiveInt(
    url.searchParams.get("depth"),
    DEFAULT_GRAPH_DEPTH,
  );
  const depth = Math.min(requestedDepth, MAX_GRAPH_DEPTH);

  const requestedLimit = parsePositiveInt(
    url.searchParams.get("limitPerNode"),
    DEFAULT_LIMIT_PER_NODE,
  );
  const limitPerNode = Math.min(requestedLimit, MAX_LIMIT_PER_NODE);

  const cache = caches.default;
  const cacheKey = new Request(
    `${url.origin}${url.pathname}?artistId=${artistId}&depth=${depth}&limitPerNode=${limitPerNode}`,
  );
  const cached = await cache.match(cacheKey);

  if (cached) {
    const headers = corsHeaders(origin);
    cached.headers.forEach((value, key) => headers.set(key, value));
    return new Response(cached.body, { status: cached.status, headers });
  }

  const payload = await buildArtistGraph(env, artistId, depth, limitPerNode);
  const response = responseJson(payload, 200, "public, max-age=600", origin);
  await cache.put(cacheKey, response.clone());
  return response;
}

function missingSecret(env: Env): string | null {
  if (!env.SPOTIFY_CLIENT_ID) return "SPOTIFY_CLIENT_ID";
  if (!env.SPOTIFY_CLIENT_SECRET) return "SPOTIFY_CLIENT_SECRET";
  if (!env.SPOTIFY_REFRESH_TOKEN) return "SPOTIFY_REFRESH_TOKEN";
  return null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = env.ALLOWED_ORIGIN ?? "*";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const absentSecret = missingSecret(env);
    if (absentSecret) {
      return responseJson(
        {
          error: `Missing worker secret: ${absentSecret}`,
        },
        500,
        "no-store",
        origin,
      );
    }

    try {
      if (request.method !== "GET") {
        return responseJson(
          { error: "Method not allowed" },
          405,
          "no-store",
          origin,
        );
      }

      if (url.pathname === "/api/spotify/now-playing") {
        return await handleNowPlaying(request, env);
      }

      if (url.pathname === "/api/spotify/recently-played") {
        return await handleRecentlyPlayed(request, env);
      }

      if (url.pathname === "/api/spotify/artist-graph") {
        return await handleArtistGraph(request, env);
      }

      if (url.pathname === "/api/spotify/health") {
        return responseJson({ ok: true }, 200, "no-store", origin);
      }

      return responseJson({ error: "Not found" }, 404, "no-store", origin);
    } catch (error) {
      return responseJson(
        {
          error: "Spotify proxy failure",
          message: error instanceof Error ? error.message : String(error),
        },
        502,
        "no-store",
        origin,
      );
    }
  },
};
