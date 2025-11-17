const express = require('express');
const router = express.Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { authenticateUser } = require('../middleware/auth');
const spotifyConfig = require('../config/spotify');

// In-memory storage for preference links (in production, use a database)
const preferenceLinks = new Map();
const userPreferences = new Map();

/**
 * @route   POST /api/preference/create-link
 * @desc    Create a preference sharing link
 * @access  Private
 */
router.post('/create-link', authenticateUser, async (req, res) => {
  try {
    // Get user's profile and top artists
    const [profileResponse, artistsResponse] = await Promise.all([
      axios.get(`${spotifyConfig.apiBaseUrl}/me`, {
        headers: { 'Authorization': `Bearer ${req.accessToken}` }
      }),
      axios.get(`${spotifyConfig.apiBaseUrl}/me/top/artists`, {
        headers: { 'Authorization': `Bearer ${req.accessToken}` },
        params: { limit: 50, time_range: 'medium_term' }
      })
    ]);

    const userId = profileResponse.data.id;
    const linkId = uuidv4();

    // Store preference data
    const preferenceData = {
      linkId,
      userId,
      userName: profileResponse.data.display_name,
      userImage: profileResponse.data.images?.[0]?.url || null,
      topArtists: artistsResponse.data.items,
      createdAt: new Date(),
      acceptedBy: []
    };

    preferenceLinks.set(linkId, preferenceData);
    userPreferences.set(userId, artistsResponse.data.items);

    res.json({
      linkId,
      shareUrl: `${req.protocol}://${req.get('host')}/api/preference/accept/${linkId}`,
      message: 'Preference link created successfully'
    });
  } catch (error) {
    console.error('Error creating preference link:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to create preference link',
      details: error.response?.data || error.message
    });
  }
});

/**
 * @route   GET /api/preference/link/:linkId
 * @desc    Get preference link details
 * @access  Public
 */
router.get('/link/:linkId', (req, res) => {
  const { linkId } = req.params;
  const linkData = preferenceLinks.get(linkId);

  if (!linkData) {
    return res.status(404).json({ error: 'Preference link not found' });
  }

  res.json({
    linkId: linkData.linkId,
    userName: linkData.userName,
    userImage: linkData.userImage,
    createdAt: linkData.createdAt,
    topArtistsCount: linkData.topArtists.length
  });
});

/**
 * @route   POST /api/preference/accept/:linkId
 * @desc    Accept a preference sharing link and compare
 * @access  Private
 */
router.post('/accept/:linkId', authenticateUser, async (req, res) => {
  const { linkId } = req.params;
  const linkData = preferenceLinks.get(linkId);

  if (!linkData) {
    return res.status(404).json({ error: 'Preference link not found' });
  }

  try {
    // Get accepting user's profile and top artists
    const [profileResponse, artistsResponse] = await Promise.all([
      axios.get(`${spotifyConfig.apiBaseUrl}/me`, {
        headers: { 'Authorization': `Bearer ${req.accessToken}` }
      }),
      axios.get(`${spotifyConfig.apiBaseUrl}/me/top/artists`, {
        headers: { 'Authorization': `Bearer ${req.accessToken}` },
        params: { limit: 50, time_range: 'medium_term' }
      })
    ]);

    const acceptingUserId = profileResponse.data.id;
    const acceptingUserArtists = artistsResponse.data.items;

    // Store accepting user's preferences
    userPreferences.set(acceptingUserId, acceptingUserArtists);

    // Add to accepted list
    if (!linkData.acceptedBy.find(u => u.userId === acceptingUserId)) {
      linkData.acceptedBy.push({
        userId: acceptingUserId,
        userName: profileResponse.data.display_name,
        acceptedAt: new Date()
      });
    }

    // Compare artists
    const comparison = compareArtists(linkData.topArtists, acceptingUserArtists);

    res.json({
      message: 'Preference link accepted',
      comparison: comparison,
      originalUser: {
        id: linkData.userId,
        name: linkData.userName
      },
      acceptingUser: {
        id: acceptingUserId,
        name: profileResponse.data.display_name
      }
    });
  } catch (error) {
    console.error('Error accepting preference link:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to accept preference link',
      details: error.response?.data || error.message
    });
  }
});

/**
 * @route   GET /api/preference/my-links
 * @desc    Get all preference links created by user
 * @access  Private
 */
router.get('/my-links', authenticateUser, async (req, res) => {
  try {
    const profileResponse = await axios.get(`${spotifyConfig.apiBaseUrl}/me`, {
      headers: { 'Authorization': `Bearer ${req.accessToken}` }
    });

    const userId = profileResponse.data.id;
    const userLinks = Array.from(preferenceLinks.values())
      .filter(link => link.userId === userId)
      .map(link => ({
        linkId: link.linkId,
        createdAt: link.createdAt,
        acceptedByCount: link.acceptedBy.length,
        acceptedBy: link.acceptedBy
      }));

    res.json(userLinks);
  } catch (error) {
    console.error('Error fetching user links:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch user links',
      details: error.response?.data || error.message
    });
  }
});

/**
 * Helper function to compare artists between two users
 */
function compareArtists(artists1, artists2) {
  const artistIds1 = new Set(artists1.map(a => a.id));
  const artistIds2 = new Set(artists2.map(a => a.id));

  const commonArtists = artists1.filter(artist => artistIds2.has(artist.id));
  const uniqueToUser1 = artists1.filter(artist => !artistIds2.has(artist.id));
  const uniqueToUser2 = artists2.filter(artist => !artistIds1.has(artist.id));

  const matchPercentage = (commonArtists.length / Math.max(artists1.length, artists2.length)) * 100;

  return {
    commonArtists: commonArtists,
    commonCount: commonArtists.length,
    uniqueToUser1: uniqueToUser1.slice(0, 10),
    uniqueToUser2: uniqueToUser2.slice(0, 10),
    matchPercentage: matchPercentage.toFixed(2),
    totalUser1Artists: artists1.length,
    totalUser2Artists: artists2.length
  };
}

module.exports = router;
