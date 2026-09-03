import path from "node:path";
import { mkdir } from "node:fs/promises";

export const DATA_DIR = path.join(process.cwd(), "data");

export async function ensureDataDir(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
}
