import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";

// Local dev falls back to a project-relative folder (gitignored); the
// Railway app service has FILE_STORAGE_DIR=/data pointing at its
// persistent volume, since Object storage / SharePoint isn't wired up yet.
const STORAGE_DIR = process.env.FILE_STORAGE_DIR || path.join(process.cwd(), ".storage");

export async function saveFile(subpath: string, buffer: Buffer): Promise<string> {
  // STORAGE_DIR resolves from an env var at runtime (the Railway volume
  // mount, outside the project tree) — turbopackIgnore stops Next's static
  // analysis from tracing the whole project as a filesystem dependency.
  const fullPath = path.join(/* turbopackIgnore: true */ STORAGE_DIR, subpath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);
  return fullPath;
}

export async function readStoredFile(storagePath: string): Promise<Buffer> {
  return readFile(storagePath);
}
