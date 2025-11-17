const express = require('express');
const router = express.Router();
const querystring = require('querystring');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const spotifyConfig = require('../config/spotify');

/**
 * @route   GET /api/auth/login
 * @desc    Initiate Spotify OAuth flow
 * @access  Public
 */
router.get('/login', (req, res) => {
  const state = uuidv4();
  req.session.state = state;

  const authUrl = `${spotifyConfig.authBaseUrl}/authorize?` + querystring.stringify({
    response_type: 'code',
    client_id: spotifyConfig.clientId,
    scope: spotifyConfig.scopes.join(' '),
    redirect_uri: spotifyConfig.redirectUri,
    state: state
  });

  res.redirect(authUrl);
});

/**
 * @route   GET /api/auth/callback
 * @desc    Spotify OAuth callback
 * @access  Public
 */
router.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.session.state || null;

  if (state === null || state !== storedState) {
    return res.status(400).json({ error: 'State mismatch' });
  }

  req.session.state = null;

  try {
    const tokenResponse = await axios({
      method: 'post',
      url: `${spotifyConfig.authBaseUrl}/api/token`,
      data: querystring.stringify({
        code: code,
        redirect_uri: spotifyConfig.redirectUri,
        grant_type: 'authorization_code'
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(
          spotifyConfig.clientId + ':' + spotifyConfig.clientSecret
        ).toString('base64')
      }
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Store tokens in session
    req.session.accessToken = access_token;
    req.session.refreshToken = refresh_token;

    // Get user profile
    const userResponse = await axios.get(`${spotifyConfig.apiBaseUrl}/me`, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    req.session.userId = userResponse.data.id;

    res.json({
      message: 'Authentication successful',
      user: {
        id: userResponse.data.id,
        display_name: userResponse.data.display_name,
        email: userResponse.data.email,
        images: userResponse.data.images
      }
    });
  } catch (error) {
    console.error('Error during authentication:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Authentication failed',
      details: error.response?.data || error.message
    });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Private
 */
router.post('/refresh', async (req, res) => {
  const refreshToken = req.session.refreshToken || req.body.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token available' });
  }

  try {
    const tokenResponse = await axios({
      method: 'post',
      url: `${spotifyConfig.authBaseUrl}/api/token`,
      data: querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(
          spotifyConfig.clientId + ':' + spotifyConfig.clientSecret
        ).toString('base64')
      }
    });

    const { access_token, expires_in } = tokenResponse.data;
    req.session.accessToken = access_token;

    res.json({
      access_token: access_token,
      expires_in: expires_in
    });
  } catch (error) {
    console.error('Error refreshing token:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Token refresh failed',
      details: error.response?.data || error.message
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports = router;
