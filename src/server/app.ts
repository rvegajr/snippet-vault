import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureDataDir } from "./db/init.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface AppOptions {
  clientRoot?: string;
}

export async function buildApp(options: AppOptions = {}) {
  await ensureDataDir();

  const clientRoot =
    options.clientRoot ?? path.join(__dirname, "..", "client");

  const app = Fastify({ logger: false });

  await app.register(fastifyStatic, {
    root: clientRoot,
    prefix: "/",
  });

  return app;
}
