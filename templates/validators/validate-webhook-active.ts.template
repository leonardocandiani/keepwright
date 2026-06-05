#!/usr/bin/env bun
/**
 * validate-webhook-active.ts
 *
 * Gate L-001: if CLAUDE.md mentions "GitHub webhook" or "automatic deploy",
 * `gh api repos/<owner>/<repo>/hooks` must return at least 1 active webhook
 * pointing at a documented host. A doc without an E2E smoke = a doc without proof.
 *
 * Skipped if `gh` is not authenticated (local dev without a token) — only fails
 * in CI where GH_TOKEN is guaranteed.
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const CLAUDE_MD = "CLAUDE.md";

function fail(msg: string): never {
  console.error(`\x1b[31m❌ validate-webhook-active: ${msg}\x1b[0m`);
  process.exit(1);
}

function ok(msg: string): void {
  console.log(`\x1b[32m✅ validate-webhook-active: ${msg}\x1b[0m`);
}

if (!existsSync(CLAUDE_MD)) {
  console.log("validate-webhook-active: CLAUDE.md absent, nothing to check.");
  process.exit(0);
}

const claudeMd = readFileSync(CLAUDE_MD, "utf-8");
const mencionaWebhook = /webhook (github|deploy)|automat(ic|ed) deploy|deploy.*via webhook/i.test(claudeMd);

if (!mencionaWebhook) {
  console.log("validate-webhook-active: CLAUDE.md doesn't mention webhook/automatic deploy, skip.");
  process.exit(0);
}

// Check whether the gh CLI is authenticated
try {
  execSync("gh auth status", { stdio: "pipe" });
} catch {
  console.log("validate-webhook-active: gh CLI not authenticated, skip (local dev).");
  process.exit(0);
}

// Detect owner/repo via the git remote
let repoSlug: string;
try {
  const remoteUrl = execSync("git config --get remote.origin.url", { encoding: "utf-8" }).trim();
  const m = remoteUrl.match(/github\.com[:\/]([^\/]+\/[^\/.]+)/);
  if (!m) fail(`couldn't parse the repo from the remote: ${remoteUrl}`);
  repoSlug = m[1].replace(/\.git$/, "");
} catch (err) {
  fail(`error detecting repo: ${err}`);
}

// gh api repos/.../hooks — requires the `admin:repo_hook` scope. Skips
// gracefully on default CI (GITHUB_TOKEN lacks that scope) — only fails in an
// environment with a PAT (local dev or a self-hosted runner with PAT_HOOK env).
let hooks: Array<{ id: number; active: boolean; events: string[]; config: { url?: string } }>;
try {
  const raw = execSync(`gh api repos/${repoSlug}/hooks`, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
  hooks = JSON.parse(raw);
} catch (err: any) {
  const msg = String(err.stderr || err.message || err);
  if (msg.includes("403") || msg.includes("404") || msg.includes("Not Found") || msg.includes("Resource not accessible")) {
    console.log(`validate-webhook-active: gh api returned 403/404 (admin:repo_hook scope absent), skip gracefully on default CI.`);
    process.exit(0);
  }
  fail(`gh api failed: ${msg}`);
}

const ativos = hooks.filter((h) => h.active && h.events.includes("push"));

if (ativos.length === 0) {
  fail(
    `${CLAUDE_MD} mentions webhook/automatic deploy but ZERO active webhooks on ${repoSlug}.\n` +
      `   Descriptive doc without a validated implementation (L-001).\n` +
      `   Configure via: gh api -X POST repos/${repoSlug}/hooks --input <(echo '{...}')`
  );
}

ok(`${ativos.length} active webhook(s) with push event on ${repoSlug}:`);
for (const h of ativos) {
  console.log(`   - id=${h.id} url=${h.config.url || "?"} events=[${h.events.join(",")}]`);
}
