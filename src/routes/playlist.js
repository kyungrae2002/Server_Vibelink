const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticateUser } = require('../middleware/auth');
const { validatePlaylistCreation, validateSeedArtists, validateLimit } = require('../middleware/validation');
const spotifyConfig = require('../config/spotify');

/**
 * @route   POST /api/playlist/create-blend
 * @desc    Create a blend playlist based on two users' common artists
 * @access  Private
 */
router.post('/create-blend', authenticateUser, validatePlaylistCreation, async (req, res) => {
  const { commonArtistIds, playlistName, playlistDescription } = req.body;

  try {
    // Get current user profile
    const profileResponse = await axios.get(`${spotifyConfig.apiBaseUrl}/me`, {
      headers: { 'Authorization': `Bearer ${req.accessToken}` }
    });

    const userId = profileResponse.data.id;

    // Get top tracks from common artists
    const trackPromises = commonArtistIds.slice(0, 10).map(artistId =>
      axios.get(`${spotifyConfig.apiBaseUrl}/artists/${artistId}/top-tracks`, {
        headers: { 'Authorization': `Bearer ${req.accessToken}` },
        params: { market: 'US' }
      }).catch(err => ({ data: { tracks: [] } }))
    );

    const tracksResponses = await Promise.all(trackPromises);

    // Collect tracks (top 3 from each artist)
    const trackUris = [];
    tracksResponses.forEach(response => {
      const tracks = response.data.tracks.slice(0, 3);
      tracks.forEach(track => {
        if (!trackUris.includes(track.uri)) {
          trackUris.push(track.uri);
        }
      });
    });

    if (trackUris.length === 0) {
      return res.status(400).json({
        error: 'No tracks found',
        message: 'Could not find tracks from the common artists'
      });
    }

    // Create playlist
    const createPlaylistResponse = await axios.post(
      `${spotifyConfig.apiBaseUrl}/users/${userId}/playlists`,
      {
        name: playlistName || 'VibeLink Blend Playlist',
        description: playlistDescription || 'A blend playlist created by VibeLink based on shared music taste',
        public: false
      },
      {
        headers: {
          'Authorization': `Bearer ${req.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const playlistId = createPlaylistResponse.data.id;

    // Add tracks to playlist
    await axios.post(
      `${spotifyConfig.apiBaseUrl}/playlists/${playlistId}/tracks`,
      {
        uris: trackUris
      },
      {
        headers: {
          'Authorization': `Bearer ${req.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      message: 'Playlist created successfully',
      playlist: {
        id: playlistId,
        name: createPlaylistResponse.data.name,
        url: createPlaylistResponse.data.external_urls.spotify,
        trackCount: trackUris.length
      }
    });
  } catch (error) {
    console.error('Error creating blend playlist:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to create playlist',
      details: error.response?.data || error.message
    });
  }
});

/**
 * @route   GET /api/playlist/recommendations
 * @desc    Get track recommendations based on seed artists
 * @access  Private
 */
router.get('/recommendations', authenticateUser, validateSeedArtists, validateLimit, async (req, res) => {
  const { seed_artists, limit = 20 } = req.query;

  try {
    const response = await axios.get(`${spotifyConfig.apiBaseUrl}/recommendations`, {
      headers: { 'Authorization': `Bearer ${req.accessToken}` },
      params: {
        seed_artists: seed_artists,
        limit: limit
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching recommendations:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch recommendations',
      details: error.response?.data || error.message
    });
  }
});

/**
 * @route   GET /api/playlist/my-playlists
 * @desc    Get current user's playlists
 * @access  Private
 */
router.get('/my-playlists', authenticateUser, validateLimit, async (req, res) => {
  const limit = req.query.limit || 20;

  try {
    const response = await axios.get(`${spotifyConfig.apiBaseUrl}/me/playlists`, {
      headers: { 'Authorization': `Bearer ${req.accessToken}` },
      params: { limit }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching playlists:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch playlists',
      details: error.response?.data || error.message
    });
  }
});

/**
 * @route   GET /api/playlist/:playlistId
 * @desc    Get specific playlist details
 * @access  Private
 */
router.get('/:playlistId', authenticateUser, async (req, res) => {
  const { playlistId } = req.params;

  try {
    const response = await axios.get(`${spotifyConfig.apiBaseUrl}/playlists/${playlistId}`, {
      headers: { 'Authorization': `Bearer ${req.accessToken}` }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching playlist:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch playlist',
      details: error.response?.data || error.message
    });
  }
});

module.exports = router;
