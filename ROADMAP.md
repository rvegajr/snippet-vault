# Snippet Vault — Roadmap

## M1: Walking skeleton
Status: [x] done
Goal: Scaffold the project with TypeScript, Fastify, Vitest, ESLint, and esbuild; prove the pipeline with one end-to-end test and a dev server that returns 200 on `/`.
Acceptance:
- [x] `npm install` completes without errors
- [x] `npm run lint` passes
- [x] `npm run typecheck` passes
- [x] `npm test` passes with at least one real test (e.g. `GET /` returns 200 via Fastify `inject()`)
- [x] `npm run build` produces output in `dist/`
- [x] `npm run dev` starts the server and `GET http://localhost:3000/` returns 200
- [x] `README.md` documents clone, install, and `npm run dev` commands
Notes:
- No snippet features yet. Serve a placeholder `index.html` ("Snippet Vault — coming soon").
- Create `data/` directory logic stubbed but DB not required until M2.
- Add `.gitignore` for `node_modules/`, `dist/`, and `data/`.
- Server entry bundled with esbuild into a single `dist/server/index.js` (avoids missing module errors for `db/init.ts`).

## M2: SQLite schema and snippet CRUD API
Status: [~] in progress
Goal: Persist snippets in `./data/snippets.db` and expose full create, read, update, delete via `/api/snippets`.
Acceptance:
- [ ] `npm test` includes API tests for POST, GET (list + by id), PUT, and DELETE on `/api/snippets`
- [ ] Creating a snippet via `POST /api/snippets` returns `201` with `id`, `createdAt`, and `updatedAt`
- [ ] `GET /api/snippets/:id` returns `404` for unknown ids
- [ ] Deleting a snippet returns `204`; subsequent GET returns `404`
- [ ] Restarting the server after a create still returns the snippet (persistence verified in test or manual check)
Notes:
- `snippets` table and UUID generation live in `src/server/db/`.
- Validate required fields (`title`, `body`); return `400` on invalid input.

## M3: Full-text search API
Status: [ ] todo
Goal: Add FTS5-backed search so `GET /api/snippets?q=<term>` filters across title, body, and tags.
Acceptance:
- [ ] `npm test` includes search tests: matching title, body, and tag each return the snippet
- [ ] Search with no match returns `{ "snippets": [] }`
- [ ] `GET /api/snippets` with no `q` param returns all snippets ordered by `updatedAt` descending
- [ ] Partial-word prefix search works (e.g. `q=ids` matches title "Extract ids from array")
Notes:
- FTS5 virtual table + triggers to stay synced with `snippets`.
- Tags stored as JSON array; flattened into FTS index on write.

## M4: Snippet list and create/edit UI
Status: [ ] todo
Goal: Build the browser UI to list snippets, create new ones, edit existing ones, and delete with confirmation.
Acceptance:
- [ ] `npm run build && npm run dev` serves a page at `/` showing the snippet list (empty state when none)
- [ ] User can submit a form with title, language, body, and tags; new snippet appears in the list without manual refresh
- [ ] Clicking a snippet opens edit mode; saving updates the list item
- [ ] Delete button prompts for confirmation, then removes the snippet from the list
- [ ] `npm test` still passes (no regressions)
Notes:
- Vanilla TS in `src/client/main.ts`; no frontend framework.
- Tags input: comma-separated string converted to array before POST/PUT.

## M5: Live search and copy-to-clipboard
Status: [ ] todo
Goal: Wire the search box to the API with debounced queries as the user types, and add a one-click copy button on every snippet.
Acceptance:
- [ ] Typing in the search box filters results without pressing Enter (debounced fetch to `/api/snippets?q=`)
- [ ] Clearing the search box restores the full snippet list
- [ ] Each snippet card has a Copy button that copies the snippet `body` to the clipboard
- [ ] `npm test` includes at least one test covering search API behavior used by the UI
Notes:
- Use `navigator.clipboard.writeText`; show brief "Copied!" feedback on success.
- Debounce interval: ~200 ms.

## M6: Polish and release readiness
Status: [ ] todo
Goal: Harden error states, finalize README, and verify the full app from a fresh clone.
Acceptance:
- [ ] `README.md` includes: description, prerequisites (Node 20+), install, dev, build, test, and lint commands, plus the example workflow from SPEC.md
- [ ] API returns structured `{ "error": "..." }` for validation failures; UI displays user-visible error messages
- [ ] Empty search with no snippets shows a helpful empty state (not a blank page)
- [ ] Fresh-clone verification passes: `git clone … && npm install && npm run lint && npm run typecheck && npm test && npm run build && npm run dev` — then create, search, and copy a snippet manually
- [ ] All quality-bar commands from SPEC.md §7 pass
Notes:
- This is the last milestone before v1 is considered complete.
- Do not add nice-to-have features (syntax highlighting, gist import, keyboard nav, JSON export) — those remain post-v1.
