const authenticateUser = (req, res, next) => {
  const accessToken = req.session.accessToken || req.headers.authorization?.replace('Bearer ', '');

  if (!accessToken) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No access token provided'
    });
  }

  req.accessToken = accessToken;
  next();
};

module.exports = { authenticateUser };
