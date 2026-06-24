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

let cachedToken: { value: string; expiresAt: number } | null = null;

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
