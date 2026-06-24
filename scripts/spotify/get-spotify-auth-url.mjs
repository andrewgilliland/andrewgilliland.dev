import crypto from "node:crypto";

const clientId = process.env.SPOTIFY_CLIENT_ID;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
const scopes =
  process.env.SPOTIFY_SCOPES ??
  "user-read-currently-playing user-read-recently-played user-read-playback-state";
const state = process.env.SPOTIFY_STATE ?? crypto.randomBytes(16).toString("hex");

if (!clientId || !redirectUri) {
  console.error("Missing required env vars.");
  console.error("Required: SPOTIFY_CLIENT_ID, SPOTIFY_REDIRECT_URI");
  process.exit(1);
}

const authUrl = new URL("https://accounts.spotify.com/authorize");
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("client_id", clientId);
authUrl.searchParams.set("scope", scopes);
authUrl.searchParams.set("redirect_uri", redirectUri);
authUrl.searchParams.set("state", state);
authUrl.searchParams.set("show_dialog", "true");

console.log("Spotify OAuth URL:");
console.log(authUrl.toString());
console.log("");
console.log("State:", state);
console.log("Save this state and verify it matches in the callback URL.");
