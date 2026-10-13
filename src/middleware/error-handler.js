// Handlers and services report expected failures as { status, message }.
// Anything without a status is unexpected, so log it and respond 500.
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) {
    console.error(err.stack || err);
  }
  res.status(status).json({ error: err.message || 'Internal server error' });
}

module.exports = { errorHandler };
