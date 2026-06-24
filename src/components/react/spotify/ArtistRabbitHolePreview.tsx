import ArtistRabbitHoleGraph from "./ArtistRabbitHoleGraph";

const DEFAULT_ROOT_ARTIST = "4aEnNH9N7w9wA9vJqv4rFH";

export default function ArtistRabbitHolePreview() {
  const initialArtistId =
    import.meta.env.PUBLIC_SPOTIFY_GRAPH_SEED_ARTIST_ID ?? DEFAULT_ROOT_ARTIST;

  return (
    <ArtistRabbitHoleGraph
      initialArtistId={initialArtistId}
      title="Artist Rabbit Holes"
      depth={1}
      limitPerNode={5}
      maxNodes={18}
      compact
      className="mt-6"
    />
  );
}
