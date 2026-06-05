#!/usr/bin/env bun
/**
 * apply.ts
 *
 * Deterministic apply engine. Reads a keepwright config JSON, substitutes
 * placeholders into every template, and writes each to its destination,
 * idempotently. Before any write, runs an anti-secret scan over the resolved
 * contents and aborts if a forbidden pattern is found.
 *
 * Usage:
 *   bun scripts/apply.ts <config.json> [--repo-path <path>]
 *   npx tsx scripts/apply.ts <config.json> [--repo-path <path>]
 *
 * Output: JSON summary `{ created: [], skipped: [], updated: [] }`.
 */

import {
  existsSync,
  readdirSync,
  readFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { substitute, type KeepwrightConfig } from "./lib/placeholders.ts";
import {
  copyTemplate,
  writeIfAbsent,
  type WriteResult,
} from "./lib/fsx.ts";

const SELF_DIR = dirname(fileURLToPath(import.meta.url));
// scripts/ lives at repo root → plugin root is one level up.
const PLUGIN_ROOT = resolve(SELF_DIR, "..");
const TEMPLATES = join(PLUGIN_ROOT, "templates");

// Forbidden patterns scanned over every resolved file before writing.
//
// The brief's prefixes are anchored to a real token BODY so the scan catches
// leaked credentials without false-positiving on templates that document the
// same prefixes educationally (REVIEW.md, the no-secrets validator, the
// workflow grep strings all mention `pk_live_`, `sk-ant-...` as references).
// This mirrors the body-anchored grep the shipped pr-auto-review workflow uses.
const SECRET_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: "Anthropic key", regex: /sk-ant-(api|oat)[0-9]{2}-[A-Za-z0-9_-]{20,}/ },
  { name: "GitHub PAT", regex: /ghp_[A-Za-z0-9]{30,}/ },
  { name: "Stripe live publishable", regex: /pk_live_[A-Za-z0-9]{20,}/ },
  { name: "Stripe live secret", regex: /sk_live_[A-Za-z0-9]{20,}/ },
  { name: "Supabase management token", regex: /sbp_[a-f0-9]{30,}/ },
  // Real co-author trailer: anchored to line start (a git trailer), not a
  // prefix mentioned inside a grep pattern string.
  { name: "AI co-author trailer", regex: /^Co-Authored-By: Claude/m },
];

interface Summary {
  created: string[];
  skipped: string[];
  updated: string[];
}

function argRepoPath(): string {
  const argv = process.argv.slice(2);
  const i = argv.indexOf("--repo-path");
  if (i !== -1 && argv[i + 1]) return argv[i + 1];
  return process.cwd();
}

function loadConfig(path: string): KeepwrightConfig {
  const raw = readFileSync(path, "utf-8");
  const cfg = JSON.parse(raw) as KeepwrightConfig;
  if (!cfg.project || !cfg.repo || !cfg.stack || !cfg.deploy) {
    throw new Error(
      "config missing required fields (project, repo, stack, deploy)",
    );
  }
  return cfg;
}

/** Scan resolved text for forbidden secret patterns. */
function scanSecrets(text: string, label: string): void {
  for (const p of SECRET_PATTERNS) {
    if (p.regex.test(text)) {
      throw new Error(
        `anti-secret scan blocked ${label}: matched ${p.name} (${p.regex})`,
      );
    }
  }
}

/** List files in a dir (non-recursive); empty array if dir is absent. */
function listDir(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => e.name);
}

/**
 * Build the full (srcTemplate → destRelative) mapping for a config.
 * Deploy is resolved to a single variant by config.deploy.
 */
function buildMapping(config: KeepwrightConfig): { src: string; dest: string }[] {
  const t = (p: string) => join(TEMPLATES, p);
  const pairs: { src: string; dest: string }[] = [];

  // Root docs.
  pairs.push({ src: t("CLAUDE.md.template"), dest: "CLAUDE.md" });
  pairs.push({ src: t("REVIEW.md.template"), dest: "REVIEW.md" });
  pairs.push({ src: t("lefthook.yml.template"), dest: "lefthook.yml" });
  pairs.push({
    src: t("PULL_REQUEST_TEMPLATE.md.template"),
    dest: join(".github", "PULL_REQUEST_TEMPLATE.md"),
  });
  pairs.push({
    src: t("settings.json.template"),
    dest: join(".claude", "settings.json"),
  });
  pairs.push({
    src: t("agents/worker.md.template"),
    dest: join(".claude", "agents", "worker.md"),
  });

  // Rules: NN-*.md.template → .claude/rules/NN-*.md
  for (const f of listDir(t("rules"))) {
    pairs.push({
      src: t(join("rules", f)),
      dest: join(".claude", "rules", f.replace(/\.template$/, "")),
    });
  }

  // Validators: *.ts.template → scripts/validators/*.ts
  for (const f of listDir(t("validators"))) {
    pairs.push({
      src: t(join("validators", f)),
      dest: join("scripts", "validators", f.replace(/\.template$/, "")),
    });
  }

  // Hooks: gen-*.ts.template → scripts/hooks/gen-*.ts
  for (const f of listDir(t("hooks"))) {
    pairs.push({
      src: t(join("hooks", f)),
      dest: join("scripts", "hooks", f.replace(/\.template$/, "")),
    });
  }

  // Shell scripts: *.sh.template → scripts/*.sh
  for (const f of listDir(t("scripts"))) {
    pairs.push({
      src: t(join("scripts", f)),
      dest: join("scripts", f.replace(/\.template$/, "")),
    });
  }

  // Lessons: *.md.template → docs/lessons/*.md (keep filenames)
  for (const f of listDir(t("lessons"))) {
    pairs.push({
      src: t(join("lessons", f)),
      dest: join("docs", "lessons", f.replace(/\.template$/, "")),
    });
  }

  // Workflows (non-deploy): ci, claude-mention, pr-auto-merge, pr-auto-review.
  for (const f of listDir(t("workflows"))) {
    if (!f.endsWith(".yml.template")) continue;
    pairs.push({
      src: t(join("workflows", f)),
      dest: join(".github", "workflows", f.replace(/\.template$/, "")),
    });
  }

  // Deploy: pick the single variant by config.deploy → .github/workflows/deploy.yml
  if (config.deploy !== "none") {
    const variant = t(join("workflows", "deploy", `${config.deploy}.yml.template`));
    if (existsSync(variant)) {
      pairs.push({
        src: variant,
        dest: join(".github", "workflows", "deploy.yml"),
      });
    }
  }

  return pairs;
}

function main(): void {
  const configPath = process.argv[2];
  if (!configPath || configPath.startsWith("--")) {
    console.error(
      JSON.stringify({ error: "usage: apply.ts <config.json> [--repo-path <p>]" }),
    );
    process.exit(2);
  }

  const config = loadConfig(configPath);
  const repoPath = argRepoPath();

  const summary: Summary = { created: [], skipped: [], updated: [] };
  const record = (dest: string, r: WriteResult) => {
    summary[r].push(dest);
  };

  // --- Pass 1: resolve everything in memory + run the anti-secret scan.
  // Abort before ANY write if a forbidden pattern surfaces.
  const mapping = buildMapping(config);
  for (const { src, dest } of mapping) {
    if (!existsSync(src)) continue;
    const resolved = substitute(readFileSync(src, "utf-8"), config);
    scanSecrets(resolved, dest);
  }

  // Orchestration scripts from the plugin root: workflows/*.js → .claude/workflows/
  const orchestrationDir = join(PLUGIN_ROOT, "workflows");
  const jsFiles = listDir(orchestrationDir).filter((f) => f.endsWith(".js"));
  for (const f of jsFiles) {
    const resolved = substitute(
      readFileSync(join(orchestrationDir, f), "utf-8"),
      config,
    );
    scanSecrets(resolved, join(".claude", "workflows", f));
  }

  // --- Pass 2: write idempotently.
  for (const { src, dest } of mapping) {
    if (!existsSync(src)) continue;
    const r = copyTemplate(src, join(repoPath, dest), config);
    record(dest, r);
  }
  for (const f of jsFiles) {
    const resolved = substitute(
      readFileSync(join(orchestrationDir, f), "utf-8"),
      config,
    );
    const dest = join(".claude", "workflows", f);
    const r = writeIfAbsent(join(repoPath, dest), resolved);
    record(dest, r);
  }

  console.log(JSON.stringify(summary, null, 2));
}

main();
