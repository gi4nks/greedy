process.env.DB_FILE=':memory:';
process.env.SKIP_MIGRATIONS='1';

console.log('DIAG_DIST PID', process.pid);

try {
  console.log('DIAG_DIST: mem before', process.memoryUsage());
  const appModule = require('../dist/src/app.js');
  console.log('DIAG_DIST: required app.js');
  console.log('DIAG_DIST: mem after app require', process.memoryUsage());

  console.log('DIAG_DIST: about to require adventures route');
  console.log('DIAG_DIST: mem before require advent', process.memoryUsage());
  const adv = require('../dist/src/routes/adventures.js');
  console.log('DIAG_DIST: loaded adventures', !!adv);
  console.log('DIAG_DIST: mem after adv', process.memoryUsage());
} catch (e) {
  console.error('DIAG_DIST: error', e && e.stack ? e.stack : e);
}

console.log('DIAG_DIST: done');
