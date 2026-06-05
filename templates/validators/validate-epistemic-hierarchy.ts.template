#!/usr/bin/env bun
/**
 * validate-epistemic-hierarchy.ts
 *
 * Gate: detects language suggesting a hierarchy inversion (P5 refuting P1)
 * in the PR title/body/commits. Phrases like "ZERO bugs detected", "the code
 * is 100% correct", "the hypothesis without evidence proved unfounded" — when
 * used without surgical empirical evidence, are attempts to close an
 * investigation prematurely.
 *
 * Legitimate bypass: a markdown blockquote `>` + adjacent evidence OR an
 * inline comment `// epistemic-hierarchy: ignore <reason>` within a 3-line
 * window.
 *
 * Runs in commit-msg via lefthook + in PR auto-review via env vars
 * (PR_TITLE, PR_BODY, COMMIT_MESSAGES).
 */

const PATTERNS_RUINS = [
  /ZERO bugs (detected|found|identified)/i,
  /architectural pattern is (100%|totally|completely) correct/i,
  /briefing based on an empirically refuted premise/i,
  /hypothesis without evidence proved unfounded/i,
  /bug doesn't exist — maybe you're confusing/i,
  /if you had a bug in production, send me the symptom/i,
];

function ignoreAdjacent(text: string, hitIdx: number): boolean {
  // Looks 3 lines back and 3 lines forward; if there's an ignore comment OR an
  // adjacent blockquote `>` with evidence (numbers, dates, paths), accepts it.
  const lines = text.split("\n");
  const upToHit = text.substring(0, hitIdx).split("\n").length - 1;
  const start = Math.max(0, upToHit - 3);
  const end = Math.min(lines.length, upToHit + 4);
  const window = lines.slice(start, end).join("\n");

  if (/\/\/\s*epistemic-hierarchy:\s*ignore/.test(window)) return true;
  // markdown blockquote + evidence (paths, timestamps, SHAs, numbers)
  const hasBlockquote = />\s+/.test(window);
  const hasEvidence = /\b(\d{4}-\d{2}-\d{2}|[a-f0-9]{7,40}|\/[a-z][\w\-\/.]+\.(ts|tsx|js|md|sql))\b/.test(window);
  if (hasBlockquote && hasEvidence) return true;

  return false;
}

function scanText(text: string, source: string): string[] {
  const violations: string[] = [];
  for (const re of PATTERNS_RUINS) {
    const m = re.exec(text);
    if (!m) continue;
    if (ignoreAdjacent(text, m.index)) continue;
    violations.push(`[${source}] line "${m[0]}" without adjacent surgical evidence`);
  }
  return violations;
}

// Inputs: env vars (CI) or commit-msg file (lefthook)
const PR_TITLE = process.env.PR_TITLE || "";
const PR_BODY = process.env.PR_BODY || "";
const COMMIT_MESSAGES = process.env.COMMIT_MESSAGES || "";

let commitMsg = "";
if (process.argv[2]) {
  try {
    commitMsg = readFileSync(process.argv[2], "utf-8");
  } catch {}
}

const allText = [PR_TITLE, PR_BODY, COMMIT_MESSAGES, commitMsg].join("\n---\n");

if (!allText.trim()) {
  console.log("validate-epistemic-hierarchy: no input (no env vars or file), skip.");
  process.exit(0);
}

const violations = scanText(allText, "input");

if (violations.length > 0) {
  console.error("\x1b[31m❌ validate-epistemic-hierarchy: hierarchy-inversion language detected\x1b[0m");
  console.error("");
  console.error("P5 (abstract audit) NEVER refutes P1 (reported symptom). The patterns below");
  console.error("suggest closing an investigation prematurely without empirical evidence:");
  console.error("");
  for (const v of violations) console.error(`   - ${v}`);
  console.error("");
  console.error("Bypass: a blockquote `>` + adjacent evidence (path/SHA/timestamp) OR");
  console.error("a comment `// epistemic-hierarchy: ignore <reason>` within a 3-line window.");
  console.error("See `.claude/rules/03-epistemic-hierarchy.md`.");
  process.exit(1);
}

console.log("\x1b[32m✅ validate-epistemic-hierarchy: zero violations detected.\x1b[0m");
