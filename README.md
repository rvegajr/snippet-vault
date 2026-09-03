# Snippet Vault

A local-first web app where a developer saves, tags, and instantly searches code snippets — running entirely on their own machine. No accounts, no cloud, no network required after install.

Useful snippets often end up scattered across gists, Slack messages, and shell history. Snippet Vault gives you one place, one search box, results as you type, and copy with one click.

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or later
- npm (included with Node.js)

## Getting started

```bash
git clone https://github.com/rvegajr/snippet-vault.git
cd snippet-vault
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Data is stored locally in `./data/snippets.db` and persists between restarts.

## Example workflow

1. Run `npm run dev` and open `http://localhost:3000`.
2. Paste a `jq` command into the body field, title it **Extract ids from array**, and tag it `jq, shell`.
3. Click **Save snippet**.
4. Tomorrow, type `ids` in the search box — the snippet appears while you are still typing.
5. Click **Copy**, paste into your terminal, done.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Build and start the local server (default port 3000) |
| `npm run build` | Compile server and client to `dist/` |
| `npm test` | Run the test suite |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |

Set a custom port with `PORT=4000 npm run dev`.

## API

JSON endpoints under `/api/snippets`:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/snippets?q=` | List or search snippets |
| `GET` | `/api/snippets/:id` | Get one snippet |
| `POST` | `/api/snippets` | Create a snippet |
| `PUT` | `/api/snippets/:id` | Update a snippet |
| `DELETE` | `/api/snippets/:id` | Delete a snippet |

Validation errors return `400` with `{ "error": "message" }`.

## License

MIT
