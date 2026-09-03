import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { buildApp } from "../../src/server/app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.join(__dirname, "..", "..", "src", "client");

describe("GET /", () => {
  it("returns 200 with the snippet vault UI", async () => {
    const app = await buildApp({ clientRoot });

    const response = await app.inject({
      method: "GET",
      url: "/",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain("Snippet Vault");
    expect(response.body).toContain("Saved snippets");
    expect(response.body).toContain("snippet-list");
    expect(response.body).toContain('id="search"');

    await app.close();
  });
});
