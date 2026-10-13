const { API_KEY } = require('../config');

// TODO: replace with real JWT validation

function authenticate(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey === API_KEY) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

module.exports = { authenticate };
