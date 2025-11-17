const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticateUser } = require('../middleware/auth');
const { validateTimeRange, validateLimit } = require('../middleware/validation');
const { createSpotifyClient } = require('../utils/spotify-client');
const spotifyConfig = require('../config/spotify');

/**
 * @route   GET /api/user/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    const spotifyClient = createSpotifyClient(req.session);
    const response = await spotifyClient.get('/me');

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching profile:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch profile',
      details: error.response?.data || error.message
    });
  }
});

/**
 * @route   GET /api/user/top-artists
 * @desc    Get user's top artists
 * @access  Private
 */
router.get('/top-artists', authenticateUser, validateTimeRange, validateLimit, async (req, res) => {
  const timeRange = req.query.time_range || 'medium_term'; // short_term, medium_term, long_term
  const limit = req.query.limit || 20;

  try {
    const response = await axios.get(`${spotifyConfig.apiBaseUrl}/me/top/artists`, {
      headers: { 'Authorization': `Bearer ${req.accessToken}` },
      params: {
        time_range: timeRange,
        limit: limit
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching top artists:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch top artists',
      details: error.response?.data || error.message
    });
  }
});

/**
 * @route   GET /api/user/top-tracks
 * @desc    Get user's top tracks
 * @access  Private
 */
router.get('/top-tracks', authenticateUser, validateTimeRange, validateLimit, async (req, res) => {
  const timeRange = req.query.time_range || 'medium_term';
  const limit = req.query.limit || 20;

  try {
    const response = await axios.get(`${spotifyConfig.apiBaseUrl}/me/top/tracks`, {
      headers: { 'Authorization': `Bearer ${req.accessToken}` },
      params: {
        time_range: timeRange,
        limit: limit
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching top tracks:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch top tracks',
      details: error.response?.data || error.message
    });
  }
});

/**
 * @route   GET /api/user/:userId/profile
 * @desc    Get specific user's profile by ID
 * @access  Private
 */
router.get('/:userId/profile', authenticateUser, async (req, res) => {
  const { userId } = req.params;

  try {
    const response = await axios.get(`${spotifyConfig.apiBaseUrl}/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${req.accessToken}` }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching user profile:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch user profile',
      details: error.response?.data || error.message
    });
  }
});

module.exports = router;
