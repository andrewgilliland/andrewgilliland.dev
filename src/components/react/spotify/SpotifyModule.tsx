import SpotifyNowPlaying from "./SpotifyNowPlaying";
import SpotifyRecentlyPlayed from "./SpotifyRecentlyPlayed";

export default function SpotifyModule() {
  return (
    <div className="spotify-module-grid grid grid-cols-1 gap-4 lg:grid-cols-5">
      <div data-spotify-card className="lg:col-span-2">
        <SpotifyNowPlaying />
      </div>
      <div data-spotify-card className="lg:col-span-3">
        <SpotifyRecentlyPlayed />
      </div>
    </div>
  );
}
