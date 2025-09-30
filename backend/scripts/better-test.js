console.log('BETTER_TEST: mem start', process.memoryUsage());

try {
  console.log('BETTER_TEST: before require');
  const Better = require('better-sqlite3');
  console.log('BETTER_TEST: after require', process.memoryUsage());

  console.log('BETTER_TEST: instantiating DB');
  const db = new Better(':memory:');
  console.log('BETTER_TEST: after new DB', process.memoryUsage());

  // Do a quick query
  const rows = db.prepare('SELECT 1 as v').all();
  console.log('BETTER_TEST: query result', rows, process.memoryUsage());

  db.close();
  console.log('BETTER_TEST: closed DB', process.memoryUsage());
} catch (err) {
  console.error('BETTER_TEST: error', err && err.stack ? err.stack : err);
}

console.log('BETTER_TEST: done');
