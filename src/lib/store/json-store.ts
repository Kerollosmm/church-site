// src/lib/store/json-store.ts
// The file-backed store: atomic writes, serialized mutations, seed-on-first-use.
//
// This is the DEFAULT driver, and the reason the portal keeps working with no environment variables
// at all. It is deliberately dependency-free (node:fs only) and server-only.
//
// DURABILITY RULES
//  1. ATOMIC WRITES — every save writes to a temporary file in the same directory and then renames
//     it over the target. A crash mid-write leaves the previous document intact; readers never see a
//     half-written file. (The temp file is in the same directory on purpose: rename is only atomic
//     within one filesystem.)
//  2. SERIALIZED MUTATIONS — read-modify-write cycles run through an in-process queue, so two
//     concurrent server actions cannot interleave and lose one another's change. One mutation =
//     one `rename` = one document version, which is also what keeps a change and its audit entry
//     together.
//  3. NO SILENT RESET — a corrupt or unsupported document raises; it is never quietly replaced by
//     the seed, because that would look like the parish's content had disappeared.
//
// KNOWN LIMIT, STATED PLAINLY: the queue is per PROCESS. Two Node processes sharing one data
// directory (e.g. `next dev` workers) are not coordinated — this is a demo/local driver, and the
// Supabase driver is the multi-writer production path.

import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { StoreError } from "@/lib/store/repository";
import { assertStoreDocument, DEFAULT_STORE_DIR_NAME, STORE_FILE_NAME, type StoreDocument } from "@/lib/store/document";
import { buildSeedDocument, describeSeed } from "@/lib/store/seed";
import { nowIso } from "@/lib/store/audit";

/** Where the JSON store lives: `CHURCH_DATA_DIR` when set, otherwise `<cwd>/.data`. */
export function getStoreDataDir(): string {
  // Read at CALL time (never at import time) so the no-env build stays inert.
  const configured = process.env.CHURCH_DATA_DIR;
  const trimmed = typeof configured === "string" ? configured.trim() : "";
  return trimmed.length > 0 ? path.resolve(trimmed) : path.join(process.cwd(), DEFAULT_STORE_DIR_NAME);
}

/** Absolute path of the store document. */
export function getStoreFilePath(): string {
  return path.join(getStoreDataDir(), STORE_FILE_NAME);
}

// ============================================================================
// Serialization
// ============================================================================

let mutationQueue: Promise<unknown> = Promise.resolve();
let reportedSeed = false;

/**
 * Runs `task` after every previously queued task has settled, and keeps the queue alive even when a
 * task rejects (otherwise one failed write would deadlock every later mutation).
 */
function withMutationLock<T>(task: () => Promise<T>): Promise<T> {
  const run = mutationQueue.then(task, task);
  mutationQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

// ============================================================================
// Read / write
// ============================================================================

async function writeDocument(document: StoreDocument): Promise<void> {
  const directory = getStoreDataDir();
  const target = getStoreFilePath();
  const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;

  await mkdir(directory, { recursive: true });
  await writeFile(temporary, `${JSON.stringify(document, null, 2)}\n`, "utf8");

  // On Windows a rename over an existing file can transiently fail (an indexer or AV scanner holding
  // a handle), so it is retried with a small backoff. There is deliberately NO non-atomic fallback:
  // if the rename cannot be completed the write FAILS, leaving the previous document intact.
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      await rename(temporary, target);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 25 * attempt));
    }
  }

  try {
    await unlink(temporary);
  } catch {
    // Best effort: a leftover temp file is harmless, and the error below is the real problem.
  }

  throw new StoreError("unavailable", "store.write", `Could not replace the store document at ${target}.`, {
    cause: lastError instanceof Error ? lastError.message : String(lastError),
  });
}

/** Reads the document, seeding it on first use. Never rewrites an existing (readable) document. */
async function readDocumentUnsafe(): Promise<StoreDocument> {
  const target = getStoreFilePath();

  try {
    const raw = await readFile(target, "utf8");
    const parsed: unknown = JSON.parse(raw);
    assertStoreDocument(parsed);
    return parsed;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | null)?.code;

    if (code === "ENOENT") {
      const seeded = buildSeedDocument();
      const summary = describeSeed();
      try {
        await writeDocument(seeded);
        if (!reportedSeed) {
          reportedSeed = true;
          console.info("[store] seeded the file-backed store", { path: target, ...summary });
        }
      } catch (writeError) {
        // A read-only filesystem must not take the site down: serve the seeded baseline from memory.
        if (!reportedSeed) {
          reportedSeed = true;
          console.warn("[store] could not persist the seeded store; serving it from memory", {
            path: target,
            reason: writeError instanceof Error ? writeError.message : String(writeError),
          });
        }
      }
      return seeded;
    }

    if (error instanceof StoreError) throw error;
    throw new StoreError("unavailable", "store.read", `Could not read the store document at ${target}.`, {
      cause: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Read-only access to the current document. */
export async function readStoreDocument(): Promise<StoreDocument> {
  return readDocumentUnsafe();
}

/**
 * Runs a read-modify-write cycle inside the mutation queue and persists the result atomically.
 * `mutator` receives the live document and may change it in place; whatever it returns is passed
 * back to the caller. `updatedAt` is stamped by the store, so no caller can forget it.
 */
export async function mutateStoreDocument<T>(
  operation: string,
  mutator: (document: StoreDocument) => T | Promise<T>
): Promise<T> {
  return withMutationLock(async () => {
    const document = await readDocumentUnsafe();
    const result = await mutator(document);
    document.updatedAt = nowIso();
    await writeDocument(document);
    return result;
  });
}
