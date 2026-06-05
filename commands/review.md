---
description: Review the current repo against its own derived design + voice patterns and the keepwright invariants
argument-hint: '[path or scope]'
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Bash(git:*), Bash(gh:*), Workflow
---

# keepwright review

Review the repo's current state against the standard it should hold itself to —
its own derived design and writing-voice patterns, plus the keepwright invariants.

Scope: `$ARGUMENTS` (default: the working tree / current branch diff)

## Steps

1. **Read the codified standard.** If `.claude/rules/` and `REVIEW.md` exist, read
   them — that's the repo's own constitution and review criteria.
2. **Refresh live patterns.** Run the derive-patterns workflow
   (`scriptPath: "${CLAUDE_PLUGIN_ROOT}/workflows/derive-patterns.js"`) so the review
   reflects how the repo ACTUALLY writes code today, not just the codified ideal.
3. **Review the scope** against (a) the codified rules and (b) the derived
   patterns. For deep coverage, escalate to the native **`/code-review ultra`**
   (cloud multi-agent pass) and **`/security-review`** for sensitive diffs.
4. **Report** findings ranked by severity, citing the rule or pattern each one
   violates. Separate **design** issues from **voice** issues. Offer to codify any
   NEW strong pattern as a rule + validator (via `/keepwright:setup --mode maintain`).

Respect the epistemic hierarchy: a reported symptom (P1) outranks a static-analysis
hunch (P5). English for keepwright's own output; match the user's language for generated rules.
