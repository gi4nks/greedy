import path from 'path';
import fs from 'fs';

// Exports: db (object with prepare/run/get/all), migrate() function
let db: any;
let migrate: () => void;

// If running tests and USE_REAL_DB is not set, provide a lightweight stub
if (process.env.NODE_ENV === 'test' && process.env.USE_REAL_DB !== '1') {
  const stubPrepare = (sql: string) => ({
    all: (..._args: any[]) => [],
    get: (..._args: any[]) => undefined,
    run: (..._args: any[]) => ({ changes: 0, lastInsertRowid: 0 })
  });

  const stubDb: any = {
    prepare: stubPrepare,
    exec: (_sql: string) => { /* no-op */ },
    close: () => { /* no-op */ }
  };

  db = stubDb;
  migrate = () => { /* no-op */ };

} else {
  // Real DB implementation (lazy init)
  // Import inside block to avoid loading native modules during tests unless desired

  type DatabaseType = any;
  let _db: DatabaseType | null = null;

  function getDbPath() {
    return process.env.DB_FILE === ':memory:'
      ? ':memory:'
      : (process.env.DB_FILE ? path.resolve(process.env.DB_FILE) : path.join(__dirname, 'campaign.db'));
  }

  function initDb(): DatabaseType {
    if (_db) return _db;

    // Import inside function to avoid loading native modules at module load time
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Database = require('better-sqlite3');

    const DB_PATH = getDbPath();

    // Ensure directory exists where DB will be created (skip for in-memory)
    if (DB_PATH !== ':memory:') {
      const dbDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    }

    _db = new Database(DB_PATH);
    return _db;
  }

  db = new Proxy({} as any, {
    get(_, prop: string) {
      const real = initDb();
      // @ts-ignore
      const val = (real as any)[prop];
      if (typeof val === 'function') return val.bind(real);
      return val;
    }
  });

  migrate = () => {
    const realDb = initDb();

    realDb.prepare(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT,
        executed_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    const migrationsDir = path.join(__dirname, 'src', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter((file: string) => file.endsWith('.ts') || file.endsWith('.js'))
      .sort();

    for (const file of migrationFiles) {
      const version = parseInt(path.basename(file, path.extname(file)).split('_')[0]);
      const applied = realDb.prepare('SELECT 1 FROM schema_migrations WHERE version = ?').get(version);
      if (applied) continue;
      const migrationPath = path.join(migrationsDir, file);
      const migration = require(migrationPath).default;
      if (migration && typeof migration.up === 'function') {
        migration.up(realDb);
        realDb.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(version, file);
      } else {
        throw new Error(`Invalid migration file: ${file}`);
      }
    }
  };
}

export { db, migrate };
export default db;
