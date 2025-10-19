import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use database from DATA_DIR environment variable or default path
// DATA_DIR should be relative to project root, not this file
const projectRoot = path.resolve(__dirname, "../../../");
const dataDir = process.env.DATA_DIR 
  ? path.resolve(projectRoot, process.env.DATA_DIR)
  : path.resolve(__dirname, "./database");
const dbPath = path.join(dataDir, "campaign.db");

// Ensure the database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
