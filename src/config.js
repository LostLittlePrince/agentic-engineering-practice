const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || 'dev-key';
const DB_PATH = process.env.NODE_ENV === 'test' ? ':memory:' : (process.env.DB_PATH || 'taskr.db');

module.exports = { PORT, API_KEY, DB_PATH };
