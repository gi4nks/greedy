// Small script to exercise the db proxy and run the same query used by the characters route
process.env.DB_FILE = ':memory:';
process.env.SKIP_MIGRATIONS = '1';

console.log('DB_QUERY: mem start', process.memoryUsage());

const { db } = require('../dist/db.js');

try {
  console.log('DB_QUERY: before prepare', process.memoryUsage());
  const rows = db.prepare('SELECT * FROM characters').all();
  console.log('DB_QUERY: after query', process.memoryUsage());
  console.log('DB_QUERY: rows length', Array.isArray(rows) ? rows.length : typeof rows);
} catch (err) {
  console.error('DB_QUERY: error', err && err.stack ? err.stack : err);
}

console.log('DB_QUERY: done', process.memoryUsage());
