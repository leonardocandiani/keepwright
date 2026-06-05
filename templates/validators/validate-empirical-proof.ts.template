#!/usr/bin/env bun
/**
 * validate-empirical-proof.ts — Empirical Proof Before Merge (EPP).
 *
 * Principle: every FUNCTIONAL change (code that alters runtime behavior) MUST
 * carry empirical evidence that it WORKS against a real environment, captured in
 * the PR BEFORE merge. "The code is correct" (P4/P5 — reading/logic) is not
 * enough; you need P1/P2/P3 (a tested symptom, a log, real state, or command
 * output against real data).
 *
 * Third leg of the empirical tripod:
 *   - Analysis before execution → guards the INPUT (read before you touch).
 *   - Epistemic Hierarchy        → guards the VERDICT (P1 > P5).
 *   - Empirical Proof Before Merge → guards the RESULT (prove it runs).
 *
 * Strictness: HARD only for FUNCTIONAL changes. Docs/refactor/style/workflow/
 * config are auto-exempt (no runtime behavior to prove).
 *
 * Inputs (env):
 *   - FILES_CHANGED: diff files (newline/comma separated). Without it the
 *     validator SKIPs. CI and lefthook set it via `git diff --name-only`.
 *   - PR_BODY: the PR body. Present in CI (HARD gate). Absent on pre-push
 *     (no PR yet) → REMINDER mode (exit 0, warn only).
 *   - COMMIT_MESSAGES: commit messages (detects bypass).
 *   - FUNCTIONAL_GLOBS (optional): CSV of path prefixes treated as functional.
 *     Overrides DEFAULT_PREFIXES. The setup tunes this per stack.
 *
 * Legitimate bypass: inline `# empirical-proof: ignore <reason>` in PR_BODY or a
 * commit (e.g. a purely mechanical functional change). Requires reviewer sign-off.
 *
 * See `.claude/rules/08-empirical-proof.md` + `REVIEW.md §2.X`.
 */

const FILES_CHANGED = process.env.FILES_CHANGED || "";
const PR_BODY = process.env.PR_BODY || "";
const COMMIT_MESSAGES = process.env.COMMIT_MESSAGES || "";

// Without a file list we can't tell if the PR touches functional code → controlled SKIP.
if (!FILES_CHANGED.trim()) {
  console.log("[validate-empirical-proof] SKIP — FILES_CHANGED empty (no diff context).");
  console.log('  CI/pre-push should set it via: FILES_CHANGED="$(git diff --name-only origin/main...HEAD)".');
  process.exit(0);
}

// Split on newline/comma (NOT space — would break paths with spaces).
// Normalize a leading "./" so it doesn't escape the ^ anchor of FUNCTIONAL_RE.
const files = FILES_CHANGED.split(/[\n,]+/).map((f: string) => f.trim().replace(/^\.\//, "")).filter(Boolean);

// FUNCTIONAL prefixes — change runtime behavior. CUSTOMIZE for your project:
// the setup tunes this list (or set FUNCTIONAL_GLOBS) per the detected structure.
// Default covers common code directories.
const DEFAULT_PREFIXES = [
  "src/", "lib/", "app/", "api/", "server/", "services/", "service/",
  "components/", "pages/", "routes/", "handlers/", "controllers/",
  "models/", "domain/", "core/", "internal/", "pkg/", "cmd/", "packages/",
  "functions/", "supabase/functions/", "cli/", "bin/", "shared/", "workers/",
  "jobs/", "schemas/", "prompts/", "agents/",
];
const prefixes = (process.env.FUNCTIONAL_GLOBS || process.env.FUNCIONAL_GLOBS || "").trim()
  ? (process.env.FUNCTIONAL_GLOBS || process.env.FUNCIONAL_GLOBS)!.split(",").map((s: string) => s.trim()).filter(Boolean)
  : DEFAULT_PREFIXES;
const FUNCTIONAL_RE = new RegExp(
  "^(" + prefixes.map((p: string) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")",
);
const functional = files.filter((f: string) => FUNCTIONAL_RE.test(f));
const touchesFunctional = functional.length > 0;

if (!touchesFunctional) {
  console.log("[validate-empirical-proof] SKIP — PR does not touch functional code.");
  console.log(`  Files: ${files.slice(0, 8).join(", ")}${files.length > 8 ? ` (+${files.length - 8})` : ""}`);
  console.log("  Docs/refactor/scripts/workflow/config are exempt (no behavior to prove).");
  process.exit(0);
}

// Inline bypass (softens the gate when documented). Strip markdown code blocks
// first — otherwise a `# empirical-proof: ignore` pasted inside a snippet would
// pass without a conscious reviewer sign-off.
const BYPASS_RE = /#\s*empirical-proof:\s*ignore\b/i;
const prBodyNoFences = PR_BODY.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");
const hasBypass = BYPASS_RE.test(prBodyNoFences) || BYPASS_RE.test(COMMIT_MESSAGES);

// REMINDER mode: pre-push (no PR_BODY yet). Doesn't block, just warns.
if (!PR_BODY.trim()) {
  console.log("[validate-empirical-proof] REMINDER — PR touches functional code:");
  functional.slice(0, 10).forEach((f: string) => console.log(`    ${f}`));
  console.log("");
  console.log("  When you open the PR, include the 'EMPIRICAL VALIDATION (real environment)' section with:");
  console.log("    - what you tested (command/flow) + environment (staging/preview/prod/local) + the real output pasted;");
  console.log("    - the profiles tested when behavior varies by actor.");
  console.log("  The gate becomes HARD in CI (with a PR body). exit=0 here (pre-push).");
  process.exit(0);
}

// HARD mode: CI (PR_BODY present). Requires the section + evidence.
if (hasBypass) {
  console.log("[validate-empirical-proof] BYPASS — '# empirical-proof: ignore' present. Gate softened (reviewer validates the reason).");
  process.exit(0);
}

const violations: string[] = [];

// P1: the "EMPIRICAL VALIDATION" section is present.
const hasSection = /EMPIRICAL\s+VALIDATION/i.test(PR_BODY);
if (!hasSection) {
  console.error("[P1] FAIL: PR touches functional code but has NO 'EMPIRICAL VALIDATION' section.");
  console.error(`       Functional files: ${functional.slice(0, 6).join(", ")}${functional.length > 6 ? "…" : ""}`);
  console.error("       Add '## EMPIRICAL VALIDATION (real environment)' with what you tested + environment + real output.");
  violations.push("P1");
} else {
  console.log("[P1] OK: PR has an 'EMPIRICAL VALIDATION' section.");

  // P2: concrete evidence inside the section (not a placeholder, not a promise).
  // Extract the section text up to the NEXT line starting with a `##+` header
  // (with or without a space) — closes the leak where a later `####` let
  // another section's evidence get absorbed into an empty VALIDATION.
  const m = PR_BODY.match(/EMPIRICAL\s+VALIDATION[\s\S]*?(?=\n#{2,6}|$)/i);
  const section = m ? m[0] : "";

  // A statement of future intent is NOT proof ("will test", "haven't run yet").
  const futureIntent = /\b(will\s+(?:test|run|validate|verify)|going\s+to\s+(?:test|run|validate)|haven'?t\s+(?:tested|run|validated|verified)\s+yet|to\s+be\s+(?:tested|validated)|pending\s+test|tbd|todo:?\s*test|test(?:ed)?\s+(?:it\s+)?later|validate\s+later)\b/i.test(section);

  // STRONG data: robust proof that stamps the result.
  const strongData =
    /```/.test(section) ||                                  // pasted code/output block
    /\d+\/\d+/.test(section) ||                             // counts like 13/13
    /→/.test(section) ||                                    // result (X → Y)
    /\b(log|output|query|curl|psql|select\b|count\b|render|stdout|response|status=)\b/i.test(section);
  // WEAK data: a number + a resource noun.
  const weakData =
    /\b\d+\s*(result|match|items?|row|record|line|user|order|request|response|route|test|case|byte|module|replica)/i.test(section);
  const hasData = strongData || weakData;

  if (!hasData) {
    console.error("[P2] FAIL: 'EMPIRICAL VALIDATION' section has no concrete evidence (looks like a placeholder).");
    console.error("       Paste real output: a code block, '→ result', an N/N count, a log/query, or 'N items'.");
    console.error("       Naming the environment ('tested on staging') with no data does NOT count.");
    violations.push("P2");
  } else if (futureIntent && !strongData) {
    console.error("[P2] FAIL: 'EMPIRICAL VALIDATION' section reads like a statement of future intent, not proof.");
    console.error("       'Will test later' / 'haven't run yet' is not evidence. Paste the output of the test you already ran.");
    violations.push("P2");
  } else {
    console.log("[P2] OK: section has concrete empirical evidence.");
  }
}

if (violations.length > 0) {
  console.error("");
  console.error(`[validate-empirical-proof] FAIL — ${violations.length} violation(s): ${violations.join(", ")}.`);
  console.error("");
  console.error("Empirical Proof Before Merge (EPP) — REVIEW.md §2.X:");
  console.error("  - A functional change MUST prove its behavior against a real environment BEFORE merge.");
  console.error("  - 'The code is correct' (reading/logic) is NOT empirical proof that it runs.");
  console.error("  - Third leg of the tripod: Analysis (input) + Hierarchy (verdict) + Proof (result).");
  console.error("");
  console.error("Legitimate bypass (rare): '# empirical-proof: ignore <reason>' in the PR body + reviewer sign-off.");
  process.exit(1);
}

console.log("");
console.log("[validate-empirical-proof] OK — empirical proof present for the functional change.");
process.exit(0);
