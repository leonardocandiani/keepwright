---
description: Audit how fully this repo is integrated with the keepwright quality architecture
argument-hint: '[--deep]'
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Bash(bun:*), Bash(git:*), Workflow
---

# keepwright audit

Report whether THIS repo is fully wired to the keepwright quality architecture —
constitution, rules, workflows, validators, hooks — and how correct it is.

## Coverage (already run)

!`bun "${CLAUDE_PLUGIN_ROOT}/scripts/audit.ts" 2>/dev/null || echo '{"_error":"auditor failed — bun missing?"}'`

The JSON above reports `coverage` (0–100), `present`, and `missing`.

## Steps

1. **Summarize coverage** for the user as a clear verdict: what's integrated and
   what's missing (CLAUDE.md, `.claude/rules`, `.github/workflows`,
   `scripts/validators`, hooks).
2. **Check correctness of CLAUDE.md** — it must point to every file under
   `.claude/rules/` (the equalization invariant) with no dead pointers. Flag
   mismatches; this is a common rot point.
3. **Deep mode (`--deep`)** — escalate to the adversarial verify workflow
   (`scriptPath: "${CLAUDE_PLUGIN_ROOT}/workflows/verify-setup.js"`) for a parallel
   deep audit, and fold its `critical` issues into the verdict.
4. **Verdict** — end binary: **FULLY INTEGRATED / PARTIAL / NOT INTEGRATED**, plus
   the top gaps to fix. Offer to run `/keepwright:setup --mode maintain` to close them.

English for keepwright's own output; match the user's language for any generated remediation.
