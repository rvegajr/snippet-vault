import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_DB_PATH, ensureDataDir, initDb } from "./db/init.js";
import { snippetRoutes } from "./routes/snippets.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface AppOptions {
  clientRoot?: string;
  dbPath?: string;
}

export async function buildApp(options: AppOptions = {}) {
  await ensureDataDir();

  const clientRoot =
    options.clientRoot ?? path.join(__dirname, "..", "client");
  const dbPath = options.dbPath ?? DEFAULT_DB_PATH;
  const db = initDb(dbPath);

  const app = Fastify({ logger: false });

  app.decorate("db", db);
  app.addHook("onClose", async () => {
    db.close();
  });

  app.setErrorHandler((error, _request, reply) => {
    if (
      error &&
      typeof error === "object" &&
      "validation" in error &&
      error.validation
    ) {
      const message =
        "message" in error && typeof error.message === "string"
          ? error.message
          : "Validation error";
      return reply.status(400).send({ error: message });
    }

    return reply.status(500).send({ error: "Internal server error" });
  });

  await app.register(snippetRoutes);

  await app.register(fastifyStatic, {
    root: clientRoot,
    prefix: "/",
  });

  return app;
}
