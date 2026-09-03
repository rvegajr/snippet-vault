import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildApp, type AppOptions } from "../../src/server/app.js";

export function createTestDbPath(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "snippet-vault-test-"));
  return path.join(dir, "snippets.db");
}

export async function createTestApp(options: AppOptions = {}) {
  const dbPath = options.dbPath ?? createTestDbPath();
  const app = await buildApp({ ...options, dbPath });
  return { app, dbPath };
}
