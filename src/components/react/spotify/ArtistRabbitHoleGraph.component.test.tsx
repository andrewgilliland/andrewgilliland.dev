/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import ArtistRabbitHoleGraph from "./ArtistRabbitHoleGraph";
import { fetchArtistGraph } from "./api";

vi.mock("./api", () => ({
  fetchArtistGraph: vi.fn(),
}));

const mockFetchArtistGraph = vi.mocked(fetchArtistGraph);

describe("ArtistRabbitHoleGraph", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders graph details for loaded artist graph", async () => {
    mockFetchArtistGraph.mockResolvedValueOnce({
      rootArtistId: "root",
      rootArtistName: "Steely Dan",
      depth: 1,
      nodes: [
        {
          id: "root",
          name: "Steely Dan",
          image: null,
          genres: ["yacht rock"],
          popularity: 80,
          externalUrl: "https://open.spotify.com/artist/root",
        },
        {
          id: "related-1",
          name: "Boz Scaggs",
          image: null,
          genres: ["soft rock"],
          popularity: 70,
          externalUrl: "https://open.spotify.com/artist/related-1",
        },
      ],
      edges: [{ source: "root", target: "related-1" }],
      warnings: [],
      updatedAt: new Date().toISOString(),
    });

    render(<ArtistRabbitHoleGraph initialArtistId="root" />);

    expect(await screen.findByText("Selected Artist")).toBeTruthy();
    expect(screen.getAllByText("Steely Dan").length).toBeGreaterThan(0);
    expect(screen.getByText("2 artists")).toBeTruthy();
  });

  it("renders error state when API call fails", async () => {
    mockFetchArtistGraph.mockRejectedValueOnce(new Error("boom"));

    render(<ArtistRabbitHoleGraph initialArtistId="root" />);

    await waitFor(() => {
      expect(
        screen.getByText("Could not load artist graph right now."),
      ).toBeTruthy();
    });
  });
});
