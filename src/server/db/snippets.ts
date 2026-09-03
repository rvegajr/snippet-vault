import { randomUUID } from "node:crypto";
import { buildFtsQuery, type Db } from "./init.js";
import {
  rowToSnippet,
  type CreateSnippetInput,
  type Snippet,
  type SnippetRow,
  type UpdateSnippetInput,
} from "../types/snippet.js";

const SNIPPET_SELECT = `
  SELECT s.id, s.title, s.language, s.body, s.tags, s.created_at, s.updated_at
  FROM snippets s
`;

export function listSnippets(db: Db, query?: string): Snippet[] {
  const trimmed = query?.trim();
  if (!trimmed) {
    const rows = db
      .prepare(`${SNIPPET_SELECT} ORDER BY s.updated_at DESC`)
      .all() as SnippetRow[];
    return rows.map(rowToSnippet);
  }

  const ftsQuery = buildFtsQuery(trimmed);
  if (!ftsQuery) {
    return [];
  }

  const rows = db
    .prepare(
      `${SNIPPET_SELECT}
       JOIN snippets_fts ON s.id = snippets_fts.snippet_id
       WHERE snippets_fts MATCH ?
       ORDER BY s.updated_at DESC`,
    )
    .all(ftsQuery) as SnippetRow[];

  return rows.map(rowToSnippet);
}

export function getSnippetById(db: Db, id: string): Snippet | null {
  const row = db
    .prepare(`${SNIPPET_SELECT} WHERE s.id = ?`)
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
