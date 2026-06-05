#!/usr/bin/env bun
/**
 * validate-no-secrets.ts
 *
 * Blocks commits/merges with hardcoded tokens. Known patterns:
 *
 * - pk_live_, sk_live_ (Stripe, etc)
 * - sbp_ (Supabase management)
 * - EAA{60+} (Meta long-lived)
 * - ghp_, gho_, ghu_, ghs_, ghr_ (GitHub tokens)
 * - sk-ant- (Anthropic)
 * - sk-proj- (OpenAI project keys)
 * - xoxb-, xoxp- (Slack)
 *
 * Runs in CI and pre-commit. Exit 1 if it finds a violation.
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const ROOT = decodeURIComponent(new URL("../..", import.meta.url).pathname);

const SECRET_PATTERNS = [
  { name: "Stripe live key",        regex: /\b(pk|sk)_live_[A-Za-z0-9]{20,}\b/g },
  { name: "Supabase management token", regex: /\bsbp_[a-f0-9]{30,}\b/g },
  { name: "Meta long-lived token",  regex: /\bEAA[A-Za-z0-9_-]{80,}\b/g },
  { name: "GitHub token",           regex: /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b/g },
  { name: "Anthropic API key",      regex: /\bsk-ant-[A-Za-z0-9-]{50,}\b/g },
  { name: "OpenAI project key",     regex: /\bsk-proj-[A-Za-z0-9_-]{30,}\b/g },
  { name: "Slack bot/user token",   regex: /\bxox[bp]-[A-Za-z0-9-]{10,}\b/g },
  { name: "AWS access key",         regex: /\bAKIA[0-9A-Z]{16}\b/g },
];

const IGNORE_DIRS = new Set([
  ".git", "node_modules", ".next", ".vercel", "dist", "build",
  "__pycache__", ".venv", ".cache", "coverage", "_assets", ".b64",
]);

// Ignore files that typically contain base64 (encoded images) — common false positive
const IGNORE_FILES_REGEX = /\.(b64|asset|jpg|png|jpeg|gif|webp|svg)\.?(ts|js)?$/i;

const TEXT_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".py", ".sh", ".md", ".yml", ".yaml", ".json", ".env", ".sql", ".env.example"]);

interface Hit {
  file: string;
  line: number;
  pattern: string;
  preview: string;
}

async function walk(dir: string, hits: Hit[] = []): Promise<Hit[]> {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch { return hits; }

  for (const e of entries) {
    if (IGNORE_DIRS.has(e.name)) continue;
    if (IGNORE_FILES_REGEX.test(e.name)) continue;
    const full = join(dir, e.name);

    if (e.isDirectory()) {
      await walk(full, hits);
      continue;
    }
    const ext = e.name.substring(e.name.lastIndexOf("."));
    if (!TEXT_EXTS.has(ext) && !e.name.startsWith(".env")) continue;

    try {
      const content = await readFile(full, "utf-8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        for (const p of SECRET_PATTERNS) {
          p.regex.lastIndex = 0;
          const m = p.regex.exec(lines[i]);
          if (m) {
            hits.push({
              file: relative(ROOT, full),
              line: i + 1,
              pattern: p.name,
              preview: m[0].substring(0, 25) + "...",
            });
          }
        }
      }
    } catch { /* ignore binary */ }
  }
  return hits;
}

async function main() {
  const hits = await walk(ROOT);

  // .env.example may have placeholders (does not block)
  const filtered = hits.filter((h) => !h.file.includes(".env.example") && !h.file.includes(".env.local.example"));

  if (filtered.length === 0) {
    console.log("✅ validate-no-secrets: no hardcoded token detected.");
    process.exit(0);
  }

  console.error(`❌ validate-no-secrets: ${filtered.length} possible hardcoded tokens:`);
  for (const h of filtered) {
    console.error(`   ${h.file}:${h.line}  (${h.pattern})`);
    console.error(`      ${h.preview}`);
  }
  console.error("\nMove to .env (gitignored) or Supabase secrets / Vercel env vars.");
  process.exit(1);
}

main();
