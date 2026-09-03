import { describe, it, expect, beforeEach } from "vitest";
import { createTestApp } from "../helpers/test-app.js";

async function seedSnippets(app: Awaited<ReturnType<typeof createTestApp>>["app"]) {
  await app.inject({
    method: "POST",
    url: "/api/snippets",
    payload: {
      title: "Extract ids from array",
      language: "jq",
      body: "map(.id) | .[]",
      tags: ["jq", "shell"],
    },
  });

  await app.inject({
    method: "POST",
    url: "/api/snippets",
    payload: {
      title: "Hello world",
      language: "javascript",
      body: "console.log('hi')",
      tags: ["js"],
    },
  });
}

describe("GET /api/snippets?q=", () => {
  let app: Awaited<ReturnType<typeof createTestApp>>["app"];

  beforeEach(async () => {
    ({ app } = await createTestApp());
    await seedSnippets(app);
  });

  it("matches snippets by title", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/snippets?q=Extract",
    });

    expect(response.statusCode).toBe(200);
    const { snippets } = response.json();
    expect(snippets).toHaveLength(1);
    expect(snippets[0].title).toBe("Extract ids from array");

    await app.close();
  });

  it("matches snippets by body", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/snippets?q=console",
    });

    expect(response.statusCode).toBe(200);
    const { snippets } = response.json();
    expect(snippets).toHaveLength(1);
    expect(snippets[0].title).toBe("Hello world");

    await app.close();
  });

  it("matches snippets by tag", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/snippets?q=shell",
    });

    expect(response.statusCode).toBe(200);
    const { snippets } = response.json();
    expect(snippets).toHaveLength(1);
    expect(snippets[0].title).toBe("Extract ids from array");

    await app.close();
  });

  it("returns empty list when nothing matches", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/snippets?q=nonexistent-term",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ snippets: [] });

    await app.close();
  });

  it("supports partial-word prefix search", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/snippets?q=ids",
    });

    expect(response.statusCode).toBe(200);
    const { snippets } = response.json();
    expect(snippets).toHaveLength(1);
    expect(snippets[0].title).toBe("Extract ids from array");

    await app.close();
  });
});

describe("GET /api/snippets without q", () => {
  it("returns all snippets ordered by updatedAt descending", async () => {
    const { app } = await createTestApp();

    const first = await app.inject({
      method: "POST",
      url: "/api/snippets",
      payload: { title: "First", body: "one" },
    });
    const firstSnippet = first.json();

    await new Promise((resolve) => setTimeout(resolve, 5));

    const second = await app.inject({
      method: "POST",
      url: "/api/snippets",
      payload: { title: "Second", body: "two" },
    });
    const secondSnippet = second.json();

    const response = await app.inject({
      method: "GET",
      url: "/api/snippets",
    });

    expect(response.statusCode).toBe(200);
    const { snippets } = response.json();
    expect(snippets).toHaveLength(2);
    expect(snippets[0].id).toBe(secondSnippet.id);
    expect(snippets[1].id).toBe(firstSnippet.id);
    expect(snippets[0].updatedAt >= snippets[1].updatedAt).toBe(true);

    await app.close();
  });
});
