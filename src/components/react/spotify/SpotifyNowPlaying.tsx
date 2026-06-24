import { useEffect, useMemo, useState } from "react";
import { fetchNowPlaying, type NowPlayingPayload } from "./api";

const POLL_INTERVAL_MS = 25_000;

function formatUpdatedAt(isoTime: string): string {
  const timestamp = new Date(isoTime).getTime();
  const deltaSeconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));

  if (deltaSeconds < 60) {
    return `${deltaSeconds}s ago`;
  }

  return `${Math.round(deltaSeconds / 60)}m ago`;
}

export default function SpotifyNowPlaying() {
  const [data, setData] = useState<NowPlayingPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isDisposed = false;

    async function load() {
      try {
        const next = await fetchNowPlaying();
        if (isDisposed) {
          return;
        }
        setData(next);
        setError(null);
      } catch {
        if (isDisposed) {
          return;
        }
        setError("Spotify is unavailable right now.");
      } finally {
        if (!isDisposed) {
          setIsLoading(false);
        }
      }
    }

    void load();
    const id = window.setInterval(load, POLL_INTERVAL_MS);

    return () => {
      isDisposed = true;
      window.clearInterval(id);
    };
  }, []);

  const progress = useMemo(() => {
    if (!data?.durationMs || !data.progressMs) {
      return 0;
    }

    return Math.min(
      100,
      Math.max(0, (data.progressMs / data.durationMs) * 100),
    );
  }, [data?.durationMs, data?.progressMs]);

  if (isLoading) {
    return (
      <div
        className="rounded-xl border border-white/20 bg-zinc-900/60 p-4"
        aria-live="polite"
      >
        <p className="text-sm uppercase tracking-[0.16em] text-zinc-400">
          Now Playing
        </p>
        <div className="mt-3 h-5 w-44 animate-pulse rounded bg-zinc-700/70" />
        <div className="mt-2 h-4 w-56 animate-pulse rounded bg-zinc-700/50" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-xl border border-rose-300/40 bg-rose-950/30 p-4"
        aria-live="polite"
      >
        <p className="text-sm uppercase tracking-[0.16em] text-rose-300">
          Now Playing
        </p>
        <p className="mt-2 text-sm text-rose-200">{error}</p>
      </div>
    );
  }

  if (!data?.isPlaying || !data.track || !data.artist) {
    return (
      <div
        className="rounded-xl border border-white/20 bg-zinc-900/60 p-4"
        aria-live="polite"
      >
        <p className="text-sm uppercase tracking-[0.16em] text-zinc-400">
          Now Playing
        </p>
        <p className="mt-2 text-sm text-zinc-300">
          Nothing live right now. Check back soon.
        </p>
        {data?.updatedAt ? (
          <p className="mt-3 text-xs text-zinc-500">
            Updated {formatUpdatedAt(data.updatedAt)}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <article
      className="rounded-xl border border-emerald-300/30 bg-emerald-950/20 p-4"
      aria-live="polite"
    >
      <p className="text-sm uppercase tracking-[0.16em] text-emerald-300">
        Now Playing
      </p>
      <div className="mt-3 flex items-center gap-3">
        {data.albumArt ? (
          <img
            src={data.albumArt}
            alt={`Album art for ${data.track}`}
            width={64}
            height={64}
            className="h-16 w-16 rounded-md object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-16 w-16 rounded-md border border-zinc-600 bg-zinc-800" />
        )}
        <div className="min-w-0">
          <p className="truncate text-base font-medium text-white">
            {data.track}
          </p>
          <p className="truncate text-sm text-zinc-300">{data.artist}</p>
        </div>
      </div>

      <div className="mt-4 h-1.5 w-full rounded bg-zinc-800">
        <div
          className="h-1.5 rounded bg-emerald-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {data.trackUrl ? (
        <a
          href={data.trackUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex text-sm font-medium text-emerald-300 underline-offset-4 hover:underline"
        >
          Open in Spotify
        </a>
      ) : null}

      <p className="mt-3 text-xs text-zinc-400">
        Updated {formatUpdatedAt(data.updatedAt)}
      </p>
    </article>
  );
}
