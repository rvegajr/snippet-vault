import { buildApp } from "./app.js";

const PORT = Number(process.env.PORT) || 3000;

const app = await buildApp();

await app.listen({ port: PORT, host: "127.0.0.1" });

console.log(`Snippet Vault running at http://localhost:${PORT}`);
