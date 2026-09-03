# Snippet Vault — Product Specification

## 1. Summary

Snippet Vault is a local-first web application for developers who want one place to save, organize, and instantly retrieve code snippets. The user runs a single Node process on their machine, opens a browser tab, and manages snippets with titles, languages, tags, and searchable bodies—no accounts, no cloud, no network required after install. Data persists in a SQLite file in the project directory and survives restarts.

## 2. Core user flows

1. Start the app with one command, open `http://localhost:<port>` in a browser, and see an empty snippet list ready for use.
2. Create a snippet by entering a title, optional language, body text, and comma- or space-separated tags, then save it to local storage.
3. Edit an existing snippet's title, language, body, or tags and save the changes.
4. Delete a snippet the user no longer needs, with confirmation before permanent removal.
5. Type in the search box and see matching snippets update in real time as results are ranked across title, body, and tags.
6. Click a copy button on any snippet to copy its body text to the clipboard for pasting elsewhere.
7. Close the browser and restart the app; all previously saved snippets load from the SQLite database unchanged.

## 3. Non-goals for v1

- **Authentication or multi-user support** — single developer, single machine, no login.
- **Network sync, cloud backup, or remote API** — everything runs and stores data locally.
- **Syntax highlighting** — plain monospace text for snippet bodies (deferred to later).
- **GitHub gist import** — no external integrations (deferred to later).
- **Keyboard-only navigation** — mouse and keyboard both work; no vim-style keybindings (deferred to later).
- **Export/import as JSON** — no bulk data portability UI (deferred to later).
- **Mobile-optimized or native apps** — desktop browser only.
- **Snippet versioning or history** — edits overwrite; no undo stack beyond browser defaults.
- **File attachments or binary content** — text snippets only.
- **Paid services, API keys, or secrets** — none required to run locally.
- **Production deployment guides** — local dev use only; no Docker/K8s/Vercel instructions in v1.

## 4. Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Language | **TypeScript** (Node.js 20+) | Type safety, excellent tooling, ubiquitous in JS ecosystems. |
| HTTP server | **Fastify** | Lightweight, fast JSON API, built-in schema validation, and `inject()` for tests without binding a port. |
| Storage | **SQLite via `better-sqlite3`** + **FTS5** | Zero-config local file DB with native full-text search; file lives at `./data/snippets.db`. |
| Frontend | **Vanilla HTML/CSS/TypeScript** (bundled with **esbuild**) | No React/Vue overhead; small bundle, fast to ship; server serves static assets from `dist/client`. |
| Test runner | **Vitest** | Fast, native ESM/TS support, shares config with type checking workflow. |
| Linting | **ESLint** + **typescript-eslint** | Standard TS lint pipeline. |
| Validation | **Fastify JSON Schema** (or **Zod** at boundaries if preferred) | Request/response contracts enforced at the API layer. |

**One-sentence rationale:** Node.js with TypeScript, Fastify, better-sqlite3 (FTS5), esbuild, and Vitest minimizes dependencies while delivering a typed JSON API, native SQLite full-text search, and fast end-to-end tests without a running server.

## 5. Architecture

### Directory layout

```
snippet-vault/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── eslint.config.js
├── README.md
├── SPEC.md
├── ROADMAP.md
├── data/                    # gitignored; created on first run
│   └── snippets.db
├── src/
│   ├── server/
│   │   ├── index.ts         # process entry; starts Fastify, ensures data/ exists
│   │   ├── app.ts           # Fastify instance, plugins, route registration
│   │   ├── db/
│   │   │   ├── init.ts      # schema migration, FTS5 setup
│   │   │   └── snippets.ts  # CRUD + search queries
│   │   └── routes/
│   │       └── snippets.ts  # /api/snippets handlers
│   └── client/
│       ├── index.html
│       ├── main.ts          # UI logic: list, form, search, copy
│       └── styles.css
├── dist/                    # gitignored; build output
│   ├── server/
│   └── client/
└── tests/
    ├── api/
    │   └── snippets.test.ts
    └── helpers/
        └── test-app.ts      # Fastify inject helper, temp DB
```

### Main modules

- **`src/server/app.ts`** — Creates the Fastify app, registers static file serving for the client, mounts `/api/snippets` routes, and exposes the app for tests via export (no listen in test mode).
- **`src/server/db/`** — Owns the SQLite connection, schema (`snippets` table + `snippets_fts` FTS5 virtual table), and all data access. No SQL in route handlers.
- **`src/server/routes/snippets.ts`** — Thin HTTP layer: parse/validate input, call db module, return JSON.
- **`src/client/main.ts`** — Single-page UI: fetches `/api/snippets`, debounced search query param, inline create/edit form, copy via `navigator.clipboard.writeText`.

### Data flow

```
Browser (main.ts)
  │  fetch GET/POST/PUT/DELETE /api/snippets[?q=]
  ▼
Fastify routes (snippets.ts)
  │  validate body/params
  ▼
DB module (snippets.ts)
  │  better-sqlite3 queries / FTS5 MATCH
  ▼
data/snippets.db
```

On startup, `index.ts` ensures `data/` exists, runs `init.ts` to create tables if missing, then listens on `PORT` (default `3000`). The client is served as static files from `dist/client`; API and UI share the same origin so no CORS configuration is needed.

## 6. Data model

### Entity: `Snippet`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` (UUID v4) | yes | Primary key; generated server-side on create. |
| `title` | `string` | yes | Max 200 chars; indexed for FTS. |
| `language` | `string` | no | Free-text label (e.g. `"javascript"`, `"shell"`, `"jq"`); max 50 chars. |
| `body` | `string` | yes | Snippet source text; indexed for FTS. |
| `tags` | `string[]` | no | Stored as JSON array in SQLite; flattened into FTS index for search. |
| `createdAt` | ISO 8601 string | yes | Set on create; immutable. |
| `updatedAt` | ISO 8601 string | yes | Set on create and every update. |

### Storage notes

- Relational table `snippets` holds all fields; `tags` column stores `JSON.stringify(string[])`.
- FTS5 virtual table `snippets_fts` indexes `title`, `body`, and a space-joined `tags` column; kept in sync via triggers on insert/update/delete.
- Search query: `GET /api/snippets?q=<term>` runs FTS5 `MATCH` when `q` is non-empty; returns all snippets ordered by `updatedAt` desc when `q` is empty.

### API contract (JSON)

**Snippet object** (response shape):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Extract ids from array",
  "language": "jq",
  "body": "map(.id) | .[]",
  "tags": ["jq", "shell"],
  "createdAt": "2026-03-01T10:00:00.000Z",
  "updatedAt": "2026-03-01T10:00:00.000Z"
}
```

**Endpoints:**

| Method | Path | Body | Response |
|--------|------|------|----------|
| `GET` | `/api/snippets?q=` | — | `200` `{ "snippets": Snippet[] }` |
| `GET` | `/api/snippets/:id` | — | `200` Snippet or `404` |
| `POST` | `/api/snippets` | `{ title, language?, body, tags? }` | `201` Snippet |
| `PUT` | `/api/snippets/:id` | `{ title, language?, body, tags? }` | `200` Snippet or `404` |
| `DELETE` | `/api/snippets/:id` | — | `204` or `404` |

Validation errors return `400` with `{ "error": "message" }`. Unexpected server errors return `500`.

## 7. Quality bar

Every milestone is complete only when **all** of the following commands succeed from a fresh clone (after `npm install`):

| Command | Expectation |
|---------|-------------|
| `npm install` | Installs dependencies with no errors. |
| `npm run lint` | ESLint passes with zero errors. |
| `npm run typecheck` | `tsc --noEmit` passes with zero errors. |
| `npm test` | Vitest suite passes (unit + API integration tests). |
| `npm run build` | Compiles server and client to `dist/` with no errors. |
| `npm run dev` | Starts the server; `GET http://localhost:3000/` returns `200`; `GET http://localhost:3000/api/snippets` returns `200` with `{ "snippets": [] }` on empty DB. |

These commands are fixed for the entire project. Do not remove or weaken them in later milestones.
