import { useEffect, useState } from "react";
import { fetchRecentlyPlayed, type RecentlyPlayedPayload } from "./api";

const POLL_INTERVAL_MS = 75_000;
const DEFAULT_LIMIT = 5;

function formatUpdatedAt(isoTime: string): string {
  const timestamp = new Date(isoTime).getTime();
  const deltaSeconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));

  if (deltaSeconds < 60) {
    return `${deltaSeconds}s ago`;
  }

  return `${Math.round(deltaSeconds / 60)}m ago`;
}

function formatRelativeTime(isoTime: string): string {
  const timestamp = new Date(isoTime).getTime();
  const now = Date.now();
  const deltaMinutes = Math.max(1, Math.round((now - timestamp) / 60_000));

  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`;
  }

  const deltaHours = Math.round(deltaMinutes / 60);
  if (deltaHours < 24) {
    return `${deltaHours}h ago`;
  }

  const deltaDays = Math.round(deltaHours / 24);
  return `${deltaDays}d ago`;
}

export default function SpotifyRecentlyPlayed() {
  const [data, setData] = useState<RecentlyPlayedPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isDisposed = false;

    async function load() {
      try {
        const next = await fetchRecentlyPlayed(DEFAULT_LIMIT);
        if (isDisposed) {
          return;
        }
        setData(next);
        setError(null);
      } catch {
        if (isDisposed) {
          return;
        }
        setError("Could not load recent tracks.");
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

  if (isLoading) {
    return (
      <div
        className="rounded-xl border border-white/20 bg-zinc-900/60 p-4"
        aria-live="polite"
      >
        <p className="text-sm uppercase tracking-[0.16em] text-zinc-400">
          Recently Played
        </p>
        <div className="mt-3 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-full animate-pulse rounded bg-zinc-700/60"
            />
          ))}
        </div>
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
          Recently Played
        </p>
        <p className="mt-2 text-sm text-rose-200">{error}</p>
      </div>
    );
  }

  if (!data?.items.length) {
    return (
      <div
        className="rounded-xl border border-white/20 bg-zinc-900/60 p-4"
        aria-live="polite"
      >
        <p className="text-sm uppercase tracking-[0.16em] text-zinc-400">
          Recently Played
        </p>
        <p className="mt-2 text-sm text-zinc-300">No recent listens found.</p>
        {data?.updatedAt ? (
          <p className="mt-3 text-xs text-zinc-500">
            Updated {formatUpdatedAt(data.updatedAt)}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <section
      className="rounded-xl border border-cyan-300/30 bg-cyan-950/20 p-4"
      aria-live="polite"
    >
      <p className="text-sm uppercase tracking-[0.16em] text-cyan-300">
        Recently Played
      </p>
      <ul className="mt-3 space-y-3">
        {data.items.map((item) => (
          <li
            key={`${item.track}-${item.playedAt}`}
            className="flex items-center gap-3"
          >
            {item.albumArt ? (
              <img
                src={item.albumArt}
                alt={`Album art for ${item.track}`}
                width={40}
                height={40}
                className="h-10 w-10 rounded object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-10 w-10 rounded border border-zinc-600 bg-zinc-800" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white">{item.track}</p>
              <p className="truncate text-xs text-zinc-300">{item.artist}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-400">
                {formatRelativeTime(item.playedAt)}
              </p>
              {item.trackUrl ? (
                <a
                  href={item.trackUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-cyan-300 underline-offset-2 hover:underline"
                >
                  Open
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-zinc-400">
        Updated {formatUpdatedAt(data.updatedAt)}
      </p>
    </section>
  );
}
