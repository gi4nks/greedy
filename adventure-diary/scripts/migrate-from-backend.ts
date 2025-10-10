#!/usr/bin/env tsx
/**
 * Migration script to transfer data from the old backend database
 * to the new Next.js adventure-diary database
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Database paths
const backendDbPath = path.resolve('../backend/data/campaign.db');
const newDbPath = path.resolve('./app/database/campaign.db');

// Ensure new database directory exists
const dbDir = path.dirname(newDbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

async function migrateData() {
  console.log('🚀 Starting data migration from backend to Next.js app...');

  // Check if old database exists
  if (!fs.existsSync(backendDbPath)) {
    console.log('⚠️  Backend database not found, skipping migration');
    return;
  }

  const oldDb = new Database(backendDbPath, { readonly: true });
  const newDb = new Database(newDbPath);

  try {
    // Get current schema info
    const tables = oldDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[];
    console.log(`📋 Found ${tables.length} tables in old database:`, tables.map(t => t.name).join(', '));

    // Migration counters
    let totalRecords = 0;
    let migratedRecords = 0;

    // Migrate each table
    for (const table of tables) {
      const tableName = table.name;
      
      // Skip migration tracking tables
      if (tableName === 'schema_migrations') continue;

      try {
        // Check if table exists in new database
        const newTableExists = newDb.prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name = ?"
        ).get(tableName);

        if (!newTableExists) {
          console.log(`⚠️  Table '${tableName}' doesn't exist in new database, skipping...`);
          continue;
        }

        // Get all records from old table
        const records = oldDb.prepare(`SELECT * FROM ${tableName}`).all() as Record<string, any>[];
        totalRecords += records.length;

        if (records.length === 0) {
          console.log(`  ℹ️  Table '${tableName}' is empty`);
          continue;
        }

        console.log(`📄 Migrating ${records.length} records from '${tableName}'...`);

        // Get column names from the first record
        const columns = Object.keys(records[0]);
        const placeholders = columns.map(() => '?').join(', ');
        const columnNames = columns.join(', ');

        // Prepare insert statement
        const insertStmt = newDb.prepare(
          `INSERT OR REPLACE INTO ${tableName} (${columnNames}) VALUES (${placeholders})`
        );

        // Insert records in batches
        newDb.transaction(() => {
          for (const record of records) {
            try {
              const values = columns.map(col => record[col]);
              insertStmt.run(...values);
              migratedRecords++;
            } catch (error) {
              console.error(`    ❌ Failed to migrate record from ${tableName}:`, error);
            }
          }
        })();

        console.log(`  ✅ Successfully migrated ${records.length} records from '${tableName}'`);

      } catch (error) {
        console.error(`❌ Error migrating table '${tableName}':`, error);
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log(`📊 Total records processed: ${totalRecords}`);
    console.log(`✅ Records successfully migrated: ${migratedRecords}`);
    console.log(`❌ Failed migrations: ${totalRecords - migratedRecords}`);

    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const newTables = newDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[];
    
    for (const table of newTables) {
      const count = newDb.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get() as { count: number };
      console.log(`  📋 ${table.name}: ${count.count} records`);
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    oldDb.close();
    newDb.close();
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateData().catch(console.error);
}

export { migrateData };