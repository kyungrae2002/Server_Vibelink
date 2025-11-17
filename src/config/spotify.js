const spotifyConfig = {
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:8080/api/auth/callback',
  scopes: [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'playlist-modify-public',
    'playlist-modify-private'
  ],
  apiBaseUrl: 'https://api.spotify.com/v1',
  authBaseUrl: 'https://accounts.spotify.com'
};

module.exports = spotifyConfig;
