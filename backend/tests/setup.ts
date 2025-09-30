// Test setup: set test environment and default DB to in-memory to avoid file IO
// during tests. We intentionally do NOT run migrations here to avoid heavy
// work when Jest spawns worker processes in parallel. Integration tests that
// require schema should run migrations explicitly or set SKIP_MIGRATIONS.

process.env.NODE_ENV = 'test';
process.env.DB_FILE = ':memory:';
process.env.SKIP_MIGRATIONS = '1';