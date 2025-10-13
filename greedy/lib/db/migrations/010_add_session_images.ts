import { Database } from "better-sqlite3";

export function up(db: Database) {
  // Add images field to sessions table
  db.exec(`
    ALTER TABLE sessions 
    ADD COLUMN images TEXT
  `);
}
