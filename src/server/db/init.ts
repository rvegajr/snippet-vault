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

CREATE VIRTUAL TABLE IF NOT EXISTS snippets_fts USING fts5(
  snippet_id UNINDEXED,
  title,
  body,
  tags
);

CREATE TRIGGER IF NOT EXISTS snippets_ai AFTER INSERT ON snippets BEGIN
  INSERT INTO snippets_fts (snippet_id, title, body, tags)
  VALUES (
    new.id,
    new.title,
    new.body,
    (SELECT group_concat(value, ' ') FROM json_each(new.tags))
  );
END;

CREATE TRIGGER IF NOT EXISTS snippets_ad AFTER DELETE ON snippets BEGIN
  DELETE FROM snippets_fts WHERE snippet_id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS snippets_au AFTER UPDATE ON snippets BEGIN
  DELETE FROM snippets_fts WHERE snippet_id = old.id;
  INSERT INTO snippets_fts (snippet_id, title, body, tags)
  VALUES (
    new.id,
    new.title,
    new.body,
    (SELECT group_concat(value, ' ') FROM json_each(new.tags))
  );
END;
`;

function backfillFts(db: Database.Database): void {
  const ftsCount = db
    .prepare("SELECT COUNT(*) AS count FROM snippets_fts")
    .get() as { count: number };
  const snippetCount = db
    .prepare("SELECT COUNT(*) AS count FROM snippets")
    .get() as { count: number };

  if (ftsCount.count === 0 && snippetCount.count > 0) {
    db.exec(`
      INSERT INTO snippets_fts (snippet_id, title, body, tags)
      SELECT
        id,
        title,
        body,
        (SELECT group_concat(value, ' ') FROM json_each(tags))
      FROM snippets;
    `);
  }
}

export function initDb(dbPath: string = DEFAULT_DB_PATH): Database.Database {
  const db = new Database(dbPath);
  db.exec(SCHEMA);
  backfillFts(db);
  return db;
}

export type Db = Database.Database;

function escapeFtsTerm(term: string): string {
  return term.replace(/"/g, '""');
}

export function buildFtsQuery(rawQuery: string): string | null {
  const terms = rawQuery.trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) {
    return null;
  }

  return terms.map((term) => `"${escapeFtsTerm(term)}"*`).join(" AND ");
}
