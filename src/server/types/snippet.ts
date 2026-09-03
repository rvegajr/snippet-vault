export interface Snippet {
  id: string;
  title: string;
  language: string | null;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSnippetInput {
  title: string;
  language?: string;
  body: string;
  tags?: string[];
}

export type UpdateSnippetInput = CreateSnippetInput;

export interface SnippetRow {
  id: string;
  title: string;
  language: string | null;
  body: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

export function rowToSnippet(row: SnippetRow): Snippet {
  return {
    id: row.id,
    title: row.title,
    language: row.language,
    body: row.body,
    tags: JSON.parse(row.tags) as string[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
