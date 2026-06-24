/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SPOTIFY_API_BASE?: string;
  readonly PUBLIC_SPOTIFY_GRAPH_SEED_ARTIST_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
