# VibeLink Server (Node.js)

A Node.js REST API server that recreates Spotify's "blend" feature, allowing users to share and compare musical preferences.

## Features

- **Spotify OAuth2 Authentication**: Secure login with Spotify accounts
- **User Profile Management**: Access user profiles and music preferences
- **Top Artists & Tracks**: Retrieve users' most listened to artists and tracks
- **Preference Sharing**: Generate shareable links to compare music tastes
- **Artist Comparison**: Analyze and compare musical preferences between users
- **Blend Playlist Creation**: Automatically generate playlists based on shared musical interests
- **Track Recommendations**: Get personalized recommendations based on common artists

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Authentication**: Spotify OAuth2
- **HTTP Client**: Axios
- **Session Management**: express-session
- **Documentation**: Swagger UI

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Spotify Developer Account

## Setup Instructions

### 1. Spotify Developer Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Note your **Client ID** and **Client Secret**
4. Add `http://localhost:8080/api/auth/callback` to your Redirect URIs in the app settings

### 2. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd Server

# Install dependencies
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your Spotify credentials:

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:8080/api/auth/callback

PORT=8080
NODE_ENV=development

SESSION_SECRET=your_random_session_secret_here
```

### 4. Run the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start at `http://localhost:8080`

## API Documentation

Once the server is running, access the interactive API documentation at:
- Swagger UI: `http://localhost:8080/api-docs`

## API Endpoints

### Authentication

- `GET /api/auth/login` - Initiate Spotify OAuth flow
- `GET /api/auth/callback` - OAuth callback handler
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### User

- `GET /api/user/profile` - Get current user's profile
- `GET /api/user/top-artists` - Get user's top artists
- `GET /api/user/top-tracks` - Get user's top tracks
- `GET /api/user/:userId/profile` - Get specific user's profile

### Preference Sharing

- `POST /api/preference/create-link` - Create a preference sharing link
- `GET /api/preference/link/:linkId` - Get preference link details
- `POST /api/preference/accept/:linkId` - Accept and compare preferences
- `GET /api/preference/my-links` - Get all links created by user

### Playlist

- `POST /api/playlist/create-blend` - Create a blend playlist
- `GET /api/playlist/recommendations` - Get track recommendations
- `GET /api/playlist/my-playlists` - Get user's playlists
- `GET /api/playlist/:playlistId` - Get specific playlist details

## Usage Flow

1. **Authentication**:
   - User visits `/api/auth/login`
   - Redirected to Spotify for authorization
   - Callback returns access token

2. **Create Preference Link**:
   - POST to `/api/preference/create-link`
   - Receive shareable link

3. **Share & Compare**:
   - Share link with friends
   - They POST to `/api/preference/accept/:linkId`
   - Receive comparison results showing common artists and match percentage

4. **Create Blend Playlist**:
   - Use common artist IDs from comparison
   - POST to `/api/playlist/create-blend`
   - Playlist created in Spotify account

## Query Parameters

### Top Artists/Tracks
- `time_range`: `short_term` (4 weeks), `medium_term` (6 months), `long_term` (all time)
- `limit`: Number of results (default: 20)

### Recommendations
- `seed_artists`: Comma-separated artist IDs
- `limit`: Number of recommendations (default: 20)

## Project Structure

```
Server/
├── src/
│   ├── config/
│   │   └── spotify.js          # Spotify API configuration
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── user.js              # User profile routes
│   │   ├── preference.js        # Preference sharing routes
│   │   └── playlist.js          # Playlist management routes
│   └── index.js                 # Main server file
├── .env.example                 # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## Data Storage

Currently, preference links and user data are stored in-memory using JavaScript Maps. For production use, implement a proper database (MongoDB, PostgreSQL, etc.).

## Error Handling

All endpoints include comprehensive error handling with appropriate HTTP status codes:
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error

## Security Notes

- Never commit `.env` file to version control
- Keep your Spotify Client Secret secure
- Use HTTPS in production
- Implement rate limiting for production use
- Consider using a database for session storage in production

## Development

```bash
# Install nodemon for development
npm install -D nodemon

# Run with auto-reload
npm run dev
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC

## Support

For issues and questions, please create an issue in the repository.

## Acknowledgments

- Based on the original [VibeLink Spring Boot Server](https://github.com/Vibe-Link-KHU/Vibelink_Server)
- Built with Spotify Web API
