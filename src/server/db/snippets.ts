import { randomUUID } from "node:crypto";
import type { Db } from "./init.js";
import {
  rowToSnippet,
  type CreateSnippetInput,
  type Snippet,
  type SnippetRow,
  type UpdateSnippetInput,
} from "../types/snippet.js";

export function listSnippets(db: Db): Snippet[] {
  const rows = db
    .prepare(
      "SELECT id, title, language, body, tags, created_at, updated_at FROM snippets ORDER BY updated_at DESC",
    )
    .all() as SnippetRow[];

  return rows.map(rowToSnippet);
}

export function getSnippetById(db: Db, id: string): Snippet | null {
  const row = db
    .prepare(
      "SELECT id, title, language, body, tags, created_at, updated_at FROM snippets WHERE id = ?",
    )
    .get(id) as SnippetRow | undefined;

  return row ? rowToSnippet(row) : null;
}

export function createSnippet(db: Db, input: CreateSnippetInput): Snippet {
  const now = new Date().toISOString();
  const snippet: Snippet = {
    id: randomUUID(),
    title: input.title,
    language: input.language ?? null,
    body: input.body,
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(
    `INSERT INTO snippets (id, title, language, body, tags, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    snippet.id,
    snippet.title,
    snippet.language,
    snippet.body,
    JSON.stringify(snippet.tags),
    snippet.createdAt,
    snippet.updatedAt,
  );

  return snippet;
}

export function updateSnippet(
  db: Db,
  id: string,
  input: UpdateSnippetInput,
): Snippet | null {
  const existing = getSnippetById(db, id);
  if (!existing) {
    return null;
  }

  const updatedAt = new Date().toISOString();
  const snippet: Snippet = {
    ...existing,
    title: input.title,
    language: input.language ?? null,
    body: input.body,
    tags: input.tags ?? [],
    updatedAt,
  };

  db.prepare(
    `UPDATE snippets
     SET title = ?, language = ?, body = ?, tags = ?, updated_at = ?
     WHERE id = ?`,
  ).run(
    snippet.title,
    snippet.language,
    snippet.body,
    JSON.stringify(snippet.tags),
    snippet.updatedAt,
    id,
  );

  return snippet;
}

export function deleteSnippet(db: Db, id: string): boolean {
  const result = db.prepare("DELETE FROM snippets WHERE id = ?").run(id);
  return result.changes > 0;
}
