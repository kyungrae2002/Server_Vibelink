/**
 * Spotify API client with automatic token refresh
 */
const axios = require('axios');
const querystring = require('querystring');
const spotifyConfig = require('../config/spotify');

/**
 * Create an axios instance for Spotify API calls with automatic token refresh
 * @param {Object} session - Express session object
 * @returns {Object} Axios instance
 */
function createSpotifyClient(session) {
  const client = axios.create({
    baseURL: spotifyConfig.apiBaseUrl
  });

  // Request interceptor to add authorization header
  client.interceptors.request.use(
    (config) => {
      if (session.accessToken) {
        config.headers['Authorization'] = `Bearer ${session.accessToken}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle token expiration
  client.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // If error is 401 and we haven't retried yet
      if (error.response?.status === 401 && !originalRequest._retry && session.refreshToken) {
        originalRequest._retry = true;

        try {
          // Refresh the access token
          const tokenResponse = await axios({
            method: 'post',
            url: `${spotifyConfig.authBaseUrl}/api/token`,
            data: querystring.stringify({
              grant_type: 'refresh_token',
              refresh_token: session.refreshToken
            }),
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': 'Basic ' + Buffer.from(
                spotifyConfig.clientId + ':' + spotifyConfig.clientSecret
              ).toString('base64')
            }
          });

          const { access_token } = tokenResponse.data;
          session.accessToken = access_token;

          // Update the authorization header with new token
          originalRequest.headers['Authorization'] = `Bearer ${access_token}`;

          // Retry the original request
          return client(originalRequest);
        } catch (refreshError) {
          // If refresh fails, clear session and reject
          session.destroy();
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
}

/**
 * Make a Spotify API request with automatic token refresh
 * @param {Object} session - Express session object
 * @param {String} method - HTTP method (get, post, etc.)
 * @param {String} url - API endpoint
 * @param {Object} options - Additional axios options
 * @returns {Promise} Response data
 */
async function spotifyRequest(session, method, url, options = {}) {
  const client = createSpotifyClient(session);
  const response = await client[method](url, options);
  return response.data;
}

module.exports = {
  createSpotifyClient,
  spotifyRequest
};
