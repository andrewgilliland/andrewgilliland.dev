/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import SpotifyNowPlaying from "./SpotifyNowPlaying";
import { fetchNowPlaying } from "./api";

vi.mock("./api", () => ({
  fetchNowPlaying: vi.fn(),
}));

const mockFetchNowPlaying = vi.mocked(fetchNowPlaying);

describe("SpotifyNowPlaying", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders playing state with progress and link", async () => {
    mockFetchNowPlaying.mockResolvedValueOnce({
      isPlaying: true,
      track: "Kid Charlemagne",
      artist: "Steely Dan",
      albumArt: "https://example.com/album.jpg",
      progressMs: 30_000,
      durationMs: 60_000,
      trackUrl: "https://open.spotify.com/track/123",
      updatedAt: new Date().toISOString(),
    });

    render(<SpotifyNowPlaying />);

    expect(await screen.findByText("Kid Charlemagne")).toBeTruthy();
    expect(screen.getByText("Steely Dan")).toBeTruthy();

    const link = screen.getByRole("link", { name: "Open in Spotify" });
    expect(link.getAttribute("href")).toBe(
      "https://open.spotify.com/track/123",
    );

    const progressBar = link.parentElement?.querySelector(
      "div[style]",
    ) as HTMLDivElement;
    expect(progressBar?.style.width).toBe("50%");
  });

  it("renders idle state when nothing is playing", async () => {
    mockFetchNowPlaying.mockResolvedValueOnce({
      isPlaying: false,
      track: null,
      artist: null,
      albumArt: null,
      progressMs: null,
      durationMs: null,
      trackUrl: null,
      updatedAt: new Date().toISOString(),
    });

    render(<SpotifyNowPlaying />);

    expect(
      await screen.findByText("Nothing live right now. Check back soon."),
    ).toBeTruthy();
  });

  it("renders API error state", async () => {
    mockFetchNowPlaying.mockRejectedValueOnce(new Error("boom"));

    render(<SpotifyNowPlaying />);

    await waitFor(() => {
      expect(
        screen.getByText("Spotify is unavailable right now."),
      ).toBeTruthy();
    });
  });
});
