import path from "node:path";
import { mkdir } from "node:fs/promises";
import Database from "better-sqlite3";

export const DATA_DIR = path.join(process.cwd(), "data");
export const DEFAULT_DB_PATH = path.join(DATA_DIR, "snippets.db");

export async function ensureDataDir(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS snippets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  language TEXT,
  body TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export function initDb(dbPath: string = DEFAULT_DB_PATH): Database.Database {
  const db = new Database(dbPath);
  db.exec(SCHEMA);
  return db;
}

export type Db = Database.Database;
