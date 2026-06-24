/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import SpotifyRecentlyPlayed from "./SpotifyRecentlyPlayed";
import { fetchRecentlyPlayed } from "./api";

vi.mock("./api", () => ({
  fetchRecentlyPlayed: vi.fn(),
}));

const mockFetchRecentlyPlayed = vi.mocked(fetchRecentlyPlayed);

describe("SpotifyRecentlyPlayed", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders recently played items", async () => {
    mockFetchRecentlyPlayed.mockResolvedValueOnce({
      updatedAt: new Date().toISOString(),
      items: [
        {
          track: "Peg",
          artist: "Steely Dan",
          albumArt: "https://example.com/peg.jpg",
          trackUrl: "https://open.spotify.com/track/peg",
          playedAt: new Date(Date.now() - 10 * 60_000).toISOString(),
        },
        {
          track: "Rosanna",
          artist: "Toto",
          albumArt: null,
          trackUrl: null,
          playedAt: new Date(Date.now() - 40 * 60_000).toISOString(),
        },
      ],
    });

    render(<SpotifyRecentlyPlayed />);

    expect(await screen.findByText("Peg")).toBeTruthy();
    expect(screen.getByText("Steely Dan")).toBeTruthy();
    expect(screen.getByText("Rosanna")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open" })).toBeTruthy();
  });

  it("renders empty state", async () => {
    mockFetchRecentlyPlayed.mockResolvedValueOnce({
      updatedAt: new Date().toISOString(),
      items: [],
    });

    render(<SpotifyRecentlyPlayed />);

    expect(await screen.findByText("No recent listens found.")).toBeTruthy();
  });

  it("renders error state", async () => {
    mockFetchRecentlyPlayed.mockRejectedValueOnce(new Error("boom"));

    render(<SpotifyRecentlyPlayed />);

    await waitFor(() => {
      expect(screen.getByText("Could not load recent tracks.")).toBeTruthy();
    });
  });
});
