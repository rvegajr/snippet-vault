import { describe, it, expect } from "vitest";
import { buildApp } from "../../src/server/app.js";
import { createTestApp } from "../helpers/test-app.js";

describe("POST /api/snippets", () => {
  it("returns 201 with id, createdAt, and updatedAt", async () => {
    const { app } = await createTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/snippets",
      payload: {
        title: "Extract ids from array",
        language: "jq",
        body: "map(.id) | .[]",
        tags: ["jq", "shell"],
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(body.title).toBe("Extract ids from array");
    expect(body.language).toBe("jq");
    expect(body.body).toBe("map(.id) | .[]");
    expect(body.tags).toEqual(["jq", "shell"]);
    expect(body.createdAt).toBeTruthy();
    expect(body.updatedAt).toBeTruthy();
    expect(body.createdAt).toBe(body.updatedAt);

    await app.close();
  });

  it("returns 400 when title is missing", async () => {
    const { app } = await createTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/snippets",
      payload: { body: "some code" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: expect.stringMatching(/title/i),
    });

    await app.close();
  });

  it("returns 400 when body is missing", async () => {
    const { app } = await createTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/snippets",
      payload: { title: "No body" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: expect.stringMatching(/body/i),
    });

    await app.close();
  });
});

describe("GET /api/snippets", () => {
  it("returns all snippets as a list", async () => {
    const { app } = await createTestApp();

    await app.inject({
      method: "POST",
      url: "/api/snippets",
      payload: { title: "First", body: "code one" },
    });
    await app.inject({
      method: "POST",
      url: "/api/snippets",
      payload: { title: "Second", body: "code two" },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/snippets",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.snippets).toHaveLength(2);
    expect(body.snippets.map((s: { title: string }) => s.title)).toEqual(
      expect.arrayContaining(["First", "Second"]),
    );

    await app.close();
  });

  it("returns empty list when no snippets exist", async () => {
    const { app } = await createTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/snippets",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ snippets: [] });

    await app.close();
  });
});

describe("GET /api/snippets/:id", () => {
  it("returns a snippet by id", async () => {
    const { app } = await createTestApp();

    const createResponse = await app.inject({
      method: "POST",
      url: "/api/snippets",
      payload: { title: "Lookup", body: "lookup body" },
    });
    const created = createResponse.json();

    const response = await app.inject({
      method: "GET",
      url: `/api/snippets/${created.id}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().id).toBe(created.id);
    expect(response.json().title).toBe("Lookup");

    await app.close();
  });

  it("returns 404 for unknown ids", async () => {
    const { app } = await createTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/snippets/550e8400-e29b-41d4-a716-446655440000",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: "Snippet not found" });

    await app.close();
  });
});

describe("PUT /api/snippets/:id", () => {
  it("updates an existing snippet", async () => {
    const { app } = await createTestApp();

    const createResponse = await app.inject({
      method: "POST",
      url: "/api/snippets",
      payload: { title: "Original", body: "original body" },
    });
    const created = createResponse.json();

    const response = await app.inject({
      method: "PUT",
      url: `/api/snippets/${created.id}`,
      payload: {
        title: "Updated",
        language: "typescript",
        body: "updated body",
        tags: ["ts"],
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.title).toBe("Updated");
    expect(body.language).toBe("typescript");
    expect(body.body).toBe("updated body");
    expect(body.tags).toEqual(["ts"]);
    expect(body.createdAt).toBe(created.createdAt);
    expect(body.updatedAt).not.toBe(created.updatedAt);

    await app.close();
  });

  it("returns 404 for unknown ids", async () => {
    const { app } = await createTestApp();

    const response = await app.inject({
      method: "PUT",
      url: "/api/snippets/550e8400-e29b-41d4-a716-446655440000",
      payload: { title: "Nope", body: "nope" },
    });

    expect(response.statusCode).toBe(404);

    await app.close();
  });
});

describe("DELETE /api/snippets/:id", () => {
  it("returns 204 and subsequent GET returns 404", async () => {
    const { app } = await createTestApp();

    const createResponse = await app.inject({
      method: "POST",
      url: "/api/snippets",
      payload: { title: "To delete", body: "delete me" },
    });
    const created = createResponse.json();

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/api/snippets/${created.id}`,
    });

    expect(deleteResponse.statusCode).toBe(204);
    expect(deleteResponse.body).toBe("");

    const getResponse = await app.inject({
      method: "GET",
      url: `/api/snippets/${created.id}`,
    });

    expect(getResponse.statusCode).toBe(404);

    await app.close();
  });

  it("returns 404 for unknown ids", async () => {
    const { app } = await createTestApp();

    const response = await app.inject({
      method: "DELETE",
      url: "/api/snippets/550e8400-e29b-41d4-a716-446655440000",
    });

    expect(response.statusCode).toBe(404);

    await app.close();
  });
});

describe("persistence", () => {
  it("returns snippet after restarting with the same database", async () => {
    const { app: firstApp, dbPath } = await createTestApp();

    const createResponse = await firstApp.inject({
      method: "POST",
      url: "/api/snippets",
      payload: {
        title: "Persistent snippet",
        body: "still here",
        tags: ["persist"],
      },
    });
    const created = createResponse.json();
    await firstApp.close();

    const secondApp = await buildApp({ dbPath });

    const getResponse = await secondApp.inject({
      method: "GET",
      url: `/api/snippets/${created.id}`,
    });

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json()).toMatchObject({
      id: created.id,
      title: "Persistent snippet",
      body: "still here",
      tags: ["persist"],
    });

    await secondApp.close();
  });
});
