// Lightweight diagnostic: require compiled JS modules from dist to reduce overhead
process.env.DB_FILE = ':memory:';
process.env.SKIP_MIGRATIONS = '1';

const modules = [
  './dist/src/routes/adventures.js',
  './dist/src/routes/characters.js',
  './dist/src/routes/combat.js',
  './dist/src/routes/locations.js',
  './dist/src/routes/magicItems.js',
  './dist/src/routes/misc.js',
  './dist/src/routes/npcs.js',
  './dist/src/routes/quests.js',
  './dist/src/routes/relationships.js',
  './dist/src/routes/sessions.js',
];

console.log('DIAG_NODE PID', process.pid);

(async function run(){
  for (const m of modules) {
    try {
      console.log(`DIAG: about to require ${m}`);
      console.log('DIAG: mem before', process.memoryUsage());
      require(m);
      console.log(`DIAG: loaded ${m}`);
      console.log('DIAG: mem after', process.memoryUsage());
    } catch (err) {
      console.error(`DIAG: error requiring ${m}:`, err && err.stack ? err.stack : err);
    }
    await new Promise(res => setTimeout(res, 200));
  }
  console.log('DIAG: done');
})().catch(e=>{
  console.error('DIAG: fatal', e);
  process.exit(1);
});
