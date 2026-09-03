import type { FastifyInstance } from "fastify";
import type { Db } from "../db/init.js";
import * as snippetsDb from "../db/snippets.js";
import type {
  CreateSnippetInput,
  UpdateSnippetInput,
} from "../types/snippet.js";

const snippetBodySchema = {
  type: "object",
  required: ["title", "body"],
  additionalProperties: false,
  properties: {
    title: { type: "string", minLength: 1, maxLength: 200 },
    language: { type: "string", maxLength: 50 },
    body: { type: "string", minLength: 1 },
    tags: {
      type: "array",
      items: { type: "string" },
    },
  },
} as const;

const snippetResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    language: { type: ["string", "null"] },
    body: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
  },
} as const;

const idParamSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", format: "uuid" },
  },
} as const;

declare module "fastify" {
  interface FastifyInstance {
    db: Db;
  }
}

const listQuerySchema = {
  type: "object",
  properties: {
    q: { type: "string" },
  },
} as const;

export async function snippetRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/api/snippets",
    {
      schema: {
        querystring: listQuerySchema,
        response: {
          200: {
            type: "object",
            properties: {
              snippets: {
                type: "array",
                items: snippetResponseSchema,
              },
            },
          },
        },
      },
    },
    async (request) => {
      const { q } = request.query as { q?: string };
      return { snippets: snippetsDb.listSnippets(app.db, q) };
    },
  );

  app.get(
    "/api/snippets/:id",
    {
      schema: {
        params: idParamSchema,
        response: {
          200: snippetResponseSchema,
          404: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const snippet = snippetsDb.getSnippetById(app.db, id);

      if (!snippet) {
        return reply.status(404).send({ error: "Snippet not found" });
      }

      return snippet;
    },
  );

  app.post(
    "/api/snippets",
    {
      schema: {
        body: snippetBodySchema,
        response: {
          201: snippetResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const snippet = snippetsDb.createSnippet(
        app.db,
        request.body as CreateSnippetInput,
      );
      return reply.status(201).send(snippet);
    },
  );

  app.put(
    "/api/snippets/:id",
    {
      schema: {
        params: idParamSchema,
        body: snippetBodySchema,
        response: {
          200: snippetResponseSchema,
          404: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const snippet = snippetsDb.updateSnippet(
        app.db,
        id,
        request.body as UpdateSnippetInput,
      );

      if (!snippet) {
        return reply.status(404).send({ error: "Snippet not found" });
      }

      return snippet;
    },
  );

  app.delete(
    "/api/snippets/:id",
    {
      schema: {
        params: idParamSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const deleted = snippetsDb.deleteSnippet(app.db, id);

      if (!deleted) {
        return reply.status(404).send({ error: "Snippet not found" });
      }

      return reply.status(204).send();
    },
  );
}
