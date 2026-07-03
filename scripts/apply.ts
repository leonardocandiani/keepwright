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
 * Append a (src → dest) pair for every file in a template subdir, stripping the
 * trailing `.template`. `keep` (optional) filters which files map — e.g.
 * workflows take only `*.yml.template`.
 */
function mapDir(
  pairs: { src: string; dest: string }[],
  srcSubdir: string,
  destDir: string,
  keep?: (f: string) => boolean,
): void {
  for (const f of listDir(join(TEMPLATES, srcSubdir))) {
    if (keep && !keep(f)) continue;
    pairs.push({
      src: join(TEMPLATES, srcSubdir, f),
      dest: join(destDir, f.replace(/\.template$/, "")),
    });
  }
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

  // Commands: *.md.template → .claude/commands/*.md. Project-scoped slash
  // commands the target repo owns (e.g. pr-review). The PR auto-review
  // workflow invokes `/pr-review` on a clean runner, which only resolves it
  // when the command lives in the checkout and the action loads it with
  // `--setting-sources project`. Without this the runner answers "Unknown
  // command" and the review is silently mute.
  mapDir(pairs, "commands", join(".claude", "commands"));

  // Rules: NN-*.md.template → .claude/rules/NN-*.md
  mapDir(pairs, "rules", join(".claude", "rules"));

  // Validators: *.ts.template → scripts/validators/*.ts
  mapDir(pairs, "validators", join("scripts", "validators"));

  // Hooks: gen-*.ts.template → scripts/hooks/gen-*.ts
  mapDir(pairs, "hooks", join("scripts", "hooks"));

  // Shell scripts: *.sh.template → scripts/*.sh
  mapDir(pairs, "scripts", "scripts");

  // Lessons: *.md.template → docs/lessons/*.md (keep filenames)
  mapDir(pairs, "lessons", join("docs", "lessons"));

  // Workflows (non-deploy): ci, claude-mention, pr-auto-merge, pr-auto-review.
  mapDir(pairs, "workflows", join(".github", "workflows"), (f) =>
    f.endsWith(".yml.template"),
  );

  // Issue templates: *.template → .github/ISSUE_TEMPLATE/* (bug_report, feature_request, config)
  mapDir(
    pairs,
    join(".github", "ISSUE_TEMPLATE"),
    join(".github", "ISSUE_TEMPLATE"),
  );

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
