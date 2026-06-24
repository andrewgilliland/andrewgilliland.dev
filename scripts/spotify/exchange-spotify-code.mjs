const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
const code = process.env.SPOTIFY_AUTH_CODE;

if (!clientId || !clientSecret || !redirectUri || !code) {
  console.error("Missing required env vars.");
  console.error(
    "Required: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI, SPOTIFY_AUTH_CODE",
  );
  process.exit(1);
}

const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

const body = new URLSearchParams({
  grant_type: "authorization_code",
  code,
  redirect_uri: redirectUri,
});

const response = await fetch("https://accounts.spotify.com/api/token", {
  method: "POST",
  headers: {
    Authorization: `Basic ${basicAuth}`,
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body,
});

const payload = await response.json();

if (!response.ok) {
  console.error("Spotify token exchange failed:");
  console.error(JSON.stringify(payload, null, 2));
  process.exit(1);
}

console.log("Token exchange successful.");
console.log("Scope:", payload.scope ?? "(none)");
console.log("Expires in:", payload.expires_in ?? "(unknown)");

if (!payload.refresh_token) {
  console.log("");
  console.log("No refresh_token returned.");
  console.log(
    "Spotify can omit refresh_token on repeated approvals. Re-run auth with show_dialog=true and approve again.",
  );
  process.exit(1);
}

console.log("");
console.log("Refresh token:");
console.log(payload.refresh_token);
console.log("");
console.log("Next step (worker secrets):");
console.log("npx wrangler secret put SPOTIFY_CLIENT_ID");
console.log("npx wrangler secret put SPOTIFY_CLIENT_SECRET");
console.log("npx wrangler secret put SPOTIFY_REFRESH_TOKEN");
