// Force in-memory DB and skip migrations to avoid heavy file IO / migrations during requires
process.env.DB_FILE = ':memory:';
process.env.SKIP_MIGRATIONS = '1';

const modules = [
  '../src/routes/adventures',
  '../src/routes/characters',
  '../src/routes/combat',
  '../src/routes/locations',
  '../src/routes/magicItems',
  '../src/routes/misc',
  '../src/routes/npcs',
  '../src/routes/quests',
  '../src/routes/relationships',
  '../src/routes/sessions',
];

async function run() {
  for (const m of modules) {
    try {
      console.log(`DIAG: about to require ${m}`);
      console.log('DIAG: mem before', process.memoryUsage());
      require(m);
      console.log(`DIAG: loaded ${m}`);
      console.log('DIAG: mem after', process.memoryUsage());
    } catch (err) {
      console.error(`DIAG: error requiring ${m}:`, err);
    }
    // Give a small delay
    await new Promise((res) => setTimeout(res, 200));
  }
  console.log('DIAG: done');
}

run().catch((e) => {
  console.error('DIAG: fatal', e);
  process.exit(1);
});
