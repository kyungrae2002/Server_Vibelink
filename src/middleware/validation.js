/**
 * Input validation middleware
 */

const VALID_TIME_RANGES = ['short_term', 'medium_term', 'long_term'];

/**
 * Validate time_range query parameter
 */
const validateTimeRange = (req, res, next) => {
  const { time_range } = req.query;

  if (time_range && !VALID_TIME_RANGES.includes(time_range)) {
    return res.status(400).json({
      error: 'Invalid time_range',
      message: `time_range must be one of: ${VALID_TIME_RANGES.join(', ')}`
    });
  }

  next();
};

/**
 * Validate limit query parameter
 */
const validateLimit = (req, res, next) => {
  const { limit } = req.query;

  if (limit) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
      return res.status(400).json({
        error: 'Invalid limit',
        message: 'limit must be a number between 1 and 50'
      });
    }
    req.query.limit = limitNum;
  }

  next();
};

/**
 * Sanitize string input to prevent XSS
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/[<>]/g, '') // Remove < and > characters
    .trim()
    .substring(0, 500); // Limit length
};

/**
 * Validate and sanitize playlist creation request
 */
const validatePlaylistCreation = (req, res, next) => {
  const { commonArtistIds, playlistName, playlistDescription } = req.body;

  if (!commonArtistIds || !Array.isArray(commonArtistIds)) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'commonArtistIds must be an array'
    });
  }

  if (commonArtistIds.length === 0) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'commonArtistIds array must not be empty'
    });
  }

  if (commonArtistIds.length > 50) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'commonArtistIds array must not exceed 50 items'
    });
  }

  // Sanitize playlist name and description
  if (playlistName) {
    req.body.playlistName = sanitizeString(playlistName);
  }

  if (playlistDescription) {
    req.body.playlistDescription = sanitizeString(playlistDescription);
  }

  next();
};

/**
 * Validate seed_artists query parameter
 */
const validateSeedArtists = (req, res, next) => {
  const { seed_artists } = req.query;

  if (!seed_artists) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'seed_artists parameter is required (comma-separated artist IDs)'
    });
  }

  const artistIds = seed_artists.split(',');
  if (artistIds.length > 5) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Maximum 5 seed artists allowed'
    });
  }

  next();
};

module.exports = {
  validateTimeRange,
  validateLimit,
  validatePlaylistCreation,
  validateSeedArtists,
  sanitizeString
};
