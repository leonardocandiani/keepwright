#!/usr/bin/env bun
/**
 * validate-claude-md-sync.ts
 *
 * CLAUDE.md equalization as a hard gate. Fails CI if:
 *  1. A file in .claude/rules/ has no pointer in CLAUDE.md
 *  2. CLAUDE.md points to a rule that doesn't exist (dead pointer)
 *
 * Principle: a rule without a pointer in CLAUDE.md = a rule invisible to
 * whoever reads only the constitution. CLAUDE.md is always loaded; the rules
 * are not. Keeping the two in sync is a safety layer, not bureaucracy.
 */

import { readdir, readFile } from "node:fs/promises";

const RULES_DIR = ".claude/rules";
const CLAUDE_MD = "CLAUDE.md";

function fail(msg: string): never {
  console.error(`\x1b[31m❌ validate-claude-md-sync: ${msg}\x1b[0m`);
  process.exit(1);
}

let claudeMd: string;
try {
  claudeMd = await readFile(CLAUDE_MD, "utf-8");
} catch {
  fail(`${CLAUDE_MD} not found at the project root.`);
}

let ruleFiles: string[];
try {
  ruleFiles = (await readdir(RULES_DIR)).filter((f) => f.endsWith(".md"));
} catch {
  console.log("validate-claude-md-sync: .claude/rules/ absent, nothing to check.");
  process.exit(0);
}

const problemas: string[] = [];

// 1. every rule has a pointer in CLAUDE.md
for (const f of ruleFiles) {
  if (!claudeMd.includes(f)) {
    problemas.push(
      `Rule \`${RULES_DIR}/${f}\` has no pointer in ${CLAUDE_MD}. ` +
        `Add a line to the "How to read this project" index.`,
    );
  }
}

// 2. every .claude/rules/<x>.md pointer in CLAUDE.md actually exists
const referenciadas = [...claudeMd.matchAll(/\.claude\/rules\/([\w.-]+\.md)/g)].map(
  (m) => m[1],
);
for (const ref of new Set(referenciadas)) {
  if (!ruleFiles.includes(ref)) {
    problemas.push(
      `${CLAUDE_MD} references \`.claude/rules/${ref}\` which doesn't exist ` +
        `(dead pointer). Fix the name or create the rule.`,
    );
  }
}

if (problemas.length > 0) {
  console.error(`\x1b[31m❌ validate-claude-md-sync: ${problemas.length} problem(s)\x1b[0m`);
  for (const p of problemas) console.error(`   - ${p}`);
  process.exit(1);
}

console.log(
  `\x1b[32m✅ validate-claude-md-sync: ${ruleFiles.length} rules in sync with ${CLAUDE_MD}.\x1b[0m`,
);
