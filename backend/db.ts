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
    let Database: any;
    try {
      Database = require('better-sqlite3');
  } catch (err: any) {
      // If the native module fails to load (missing prebuilt binaries or incompatible Node version),
      // fall back to a lightweight stub database to avoid crashing the server during development.
      // The stub provides the minimal `prepare/get/all/run` shape used throughout the codebase.
      // Note: this means data will not persist. For real DB usage, install a compatible better-sqlite3 build
      // or run the service in an environment that provides the native binary (Docker or appropriate Node version).
      // eslint-disable-next-line no-console
  console.warn('better-sqlite3 failed to load; falling back to in-memory stub DB. To use the real DB, install a compatible better-sqlite3 binary or switch to an LTS Node version. Error:', err && err.message ? err.message : err);

      const stubPrepare = (sql: string) => ({
        all: (..._args: any[]) => [],
        get: (..._args: any[]) => {
          // Return sensible defaults for common queries
          if (sql.includes('COUNT(*)')) return { c: 0 };
          if (sql.includes('SELECT 1')) return undefined;
          return {};
        },
        run: (..._args: any[]) => ({ changes: 0, lastInsertRowid: 0 })
      });

      const stubDb: any = {
        prepare: stubPrepare,
        exec: (_sql: string) => { /* no-op */ },
        close: () => { /* no-op */ },
        // Migration fix: provide expected properties
        c: stubPrepare,  // Common alias for prepare in migrations
        transaction: (fn: Function) => fn(),  // Simple transaction mock
        pragma: () => ({}) // Pragma queries return empty object
      };

      _db = stubDb as any;
      // ensure migrate is a no-op when using the stub
      migrate = () => { /* no-op */ };
      return _db;
    }

    const DB_PATH = getDbPath();

    // Ensure directory exists where DB will be created (skip for in-memory)
    if (DB_PATH !== ':memory:') {
      const dbDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    }

    try {
      _db = new Database(DB_PATH);
      return _db;
    } catch (instErr: any) {
      console.warn('better-sqlite3 failed to instantiate; falling back to in-memory stub DB. Error:', instErr && instErr.message ? instErr.message : instErr);
      const stubPrepare = (sql: string) => ({
        all: (..._args: any[]) => [],
        get: (..._args: any[]) => {
          // Return sensible defaults for common queries
          if (sql.includes('COUNT(*)')) return { c: 0 };
          if (sql.includes('SELECT 1')) return undefined;
          return {};
        },
        run: (..._args: any[]) => ({ changes: 0, lastInsertRowid: 0 })
      });

      const stubDb: any = {
        prepare: stubPrepare,
        exec: (_sql: string) => { /* no-op */ },
        close: () => { /* no-op */ },
        // Migration fix: provide expected properties
        c: stubPrepare,  // Common alias for prepare in migrations
        transaction: (fn: Function) => fn(),  // Simple transaction mock
        pragma: () => ({}) // Pragma queries return empty object
      };

      _db = stubDb as any;
      migrate = () => { /* no-op */ };
      return _db;
    }
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
