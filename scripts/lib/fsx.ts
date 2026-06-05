/**
 * fsx.ts
 *
 * Idempotent filesystem helpers. node:fs/node:path only — runs under both bun
 * and node/tsx with no external deps.
 *
 * Idempotency contract:
 *   - writeIfAbsent never clobbers a file the user may have edited; it reports
 *     'created' or 'skipped'.
 *   - writeAlways overwrites (use only for derived/generated artifacts that the
 *     user is never expected to hand-edit).
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";

import { substitute, type KeepwrightConfig } from "./placeholders.ts";

export type WriteResult = "created" | "skipped" | "updated";

/** Ensure the directory exists (recursive). No-op if already there. */
export function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

/**
 * Write `content` to `path` only if the file does not already exist.
 * Returns 'created' when written, 'skipped' when the file was already present.
 */
export function writeIfAbsent(path: string, content: string): WriteResult {
  if (existsSync(path)) return "skipped";
  ensureDir(dirname(path));
  writeFileSync(path, content, "utf-8");
  return "created";
}

/**
 * Write `content` to `path` unconditionally. Returns 'created' if the file is
 * new, 'updated' if it already existed (regardless of prior content).
 */
export function writeAlways(path: string, content: string): WriteResult {
  const existed = existsSync(path);
  ensureDir(dirname(path));
  writeFileSync(path, content, "utf-8");
  return existed ? "updated" : "created";
}

/**
 * Read a template, substitute placeholders, write idempotently.
 * Default mode is absent-only (the user owns the installed copy). Pass
 * `{ always: true }` for derived files that should track the template.
 */
export function copyTemplate(
  srcTemplate: string,
  destPath: string,
  config: KeepwrightConfig,
  opts: { always?: boolean } = {},
): WriteResult {
  const raw = readFileSync(srcTemplate, "utf-8");
  const resolved = substitute(raw, config);
  return opts.always
    ? writeAlways(destPath, resolved)
    : writeIfAbsent(destPath, resolved);
}
