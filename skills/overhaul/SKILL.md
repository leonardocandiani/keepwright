---
name: overhaul
description: 'Full-repo overhaul orchestrator: deep refactoring, architecture improvement, dead-code removal, dependency updates, and repo cleanup on any existing project. Use this skill whenever the user asks to "refactor everything", "clean up this repo", "modernize this project", "improve the architecture", "remove dead code", asks for an "overhaul", or activates a frontier model (Fable/Opus) on a legacy or brownfield codebase with broad improvement intent. Also trigger when the user wants to plan work so that a top-tier model architects and cheaper models execute. Works on any git project, any stack.'
---

# Overhaul

Turn a frontier model's limited time into maximum leverage: the strongest
model available architects; cheaper models execute. The output of every
expensive phase is an **executable artifact** that survives the session, so
execution never requires the architect to be present.

## Core contract

1. **Never burn architect time on reconnaissance or mechanical work.**
   Reconnaissance is fanned out to the cheapest capable model. The architect
   only reads syntheses and produces plans.
2. **Every phase emits a file.** If a phase's result exists only in
   conversation, the phase is not done. Artifacts live in `.overhaul/` at the
   repo root.
3. **All destructive work happens on a dedicated branch** named
   `overhaul/<yyyy-mm-dd>`. Deletion is aggressive on the branch; the human
   reviews at the PR. Never commit to the default branch directly.
4. **Empirical proof before merge.** No workstream is complete until its
   verification command passes (tests, typecheck, build — whatever the plan
   defines as proof).
5. **The repo must end smarter, not just cleaner.** Lessons learned during
   execution are catalyzed into rules/validators (see Phase 5).

## Model roles

Detect which model is running the current session and slot into the right
role. If the session model is the architect-tier model, do Phases 1–2 and
STOP — hand off. If it is an executor-tier model given a workstream spec,
skip to Phase 4.

| Role | Tier (examples) | Does | Never does |
|---|---|---|---|
| **Architect** | Fable / top frontier | Grilling, judgment calls, OVERHAUL-PLAN, workstream specs | grep/glob sweeps, mechanical edits, running test loops |
| **Structural executor** | Opus-tier | Risky refactors: module boundaries, API changes, migrations | inventing scope beyond its spec |
| **Mechanical executor** | Sonnet-tier | Recon fan-out, dead-code deletion, renames, dep bumps, formatting, docs | architectural decisions |

If only one model is available, run all phases in order anyway — the phase
separation still pays off because artifacts allow resuming across sessions.

## Phase 0 — Reconnaissance (cheap, parallel, read-only)

Goal: produce `.overhaul/RECON.md` so the architect never has to explore.

Fan out parallel read-only subagents (or run sequentially if subagents are
unavailable), one per lens:

1. **Structure** — directory map, entry points, build system, how to run it
2. **Documentation** — every README/doc/ADR/CLAUDE.md; what's stale vs true
3. **Debt & rot** — TODOs/FIXMEs, dead code candidates, unused files,
   duplicated logic, commented-out blocks
4. **Dependencies** — outdated, unused, vulnerable, duplicated deps
5. **Quality surface** — test coverage shape, CI config, lint/type setup,
   what "proof" currently looks like in this repo
6. **Git archaeology** — hotspots (most-churned files), abandoned branches,
   large binaries, history red flags

Each lens returns ≤1 page. Synthesize into `RECON.md` using the template in
`references/artifacts.md`. Rank every finding P1–P5 (P1 = blocks everything /
security; P5 = cosmetic). **No code is modified in this phase.**

Prefer invoking keepwright's `map-brownfield` workflow — the **Workflow**
tool with `scriptPath: "${CLAUDE_PLUGIN_ROOT}/workflows/map-brownfield.js"` —
for lenses 1–3 and merge its output instead of duplicating work. Fall back to
plain subagents if the Workflow tool is unavailable in the session.

## Phase 1 — Grilling (architect required)

Goal: `.overhaul/OVERHAUL-PLAN.md` — the constitution of the operation.

Read `RECON.md` first. Then interrogate the user until intent is fully
resolved. If the `grilling` skill (mattpocock/skills) is installed, invoke it
with the RECON as context. If not, run the fallback interview in
`references/grilling-fallback.md`.

Non-negotiable questions to resolve, whichever path is taken:

- **Destination**: what should this repo be when the overhaul is done?
- **Sacred ground**: what must not change (APIs, behavior, files, style)?
- **Kill list confirmation**: present the dead-code candidates from RECON;
  get explicit blessing for aggressive deletion on the branch.
- **Proof**: which command(s) constitute "it still works"? If none exist,
  creating a minimal proof harness becomes workstream #1.
- **Budget**: how many workstreams / how much scope this round?

Write OVERHAUL-PLAN.md (template in `references/artifacts.md`). It must
contain the destination, sacred-ground list, proof commands, and the ordered
workstream index.

## Phase 2 — Architecture (architect required, then hand off)

Goal: one spec file per workstream in `.overhaul/workstreams/NN-name.md`,
each executable by a cheaper model **with zero additional context**.

For each workstream the plan calls for, write a spec using the template in
`references/artifacts.md`. Every spec declares:

- `executor:` `structural` or `mechanical` (routes to Opus- or Sonnet-tier)
- exact scope (files/modules in, files out)
- ordered steps
- proof command(s) that must pass
- rollback note (what to do if proof fails)
- dependencies on other workstreams (by number)

Sequencing rules:
- Workstream 01 is always **safety net** (proof harness / baseline green run)
  if the repo lacks one.
- Deletion workstreams come **before** refactor workstreams (less code to
  refactor).
- Dependency updates come after deletion, before structural refactors.
- Structural refactors are split so each one is independently provable.

When specs are written, the architect's job is DONE. Announce the handoff:
list the specs, their executor tiers, and the suggested run order. Do not
begin executing in the architect session unless the user insists.

## Phase 3 — Branch setup (any model)

```
git checkout -b overhaul/<yyyy-mm-dd>
git add .overhaul && git commit -m "overhaul: recon, plan, workstream specs"
```

Run the baseline proof command(s) and record the result in
`.overhaul/BASELINE.md`. If baseline is red, fixing it becomes the first
workstream — never start refactoring on a red baseline.

## Phase 4 — Execution (executor models, resumable)

For each workstream, in order, respecting dependencies:

1. Read only: `OVERHAUL-PLAN.md` + your workstream spec. Do not re-read the
   whole repo.
2. Execute the steps. Stay inside declared scope. If reality contradicts the
   spec, STOP, write the contradiction into the spec file under
   `## Blocked`, and move to the next unblocked workstream.
3. Run the proof command(s). Red proof = the workstream is not done.
4. Commit with message `overhaul(NN): <name> — proof: <command> green`.
5. Mark the workstream `status: done` in its spec frontmatter, and append
   one line to `.overhaul/LOG.md`: what changed, what was learned.

Deletion policy on this branch (per user's standing choice): **aggressive**.
Delete dead code, unused files, stale docs, and commented-out blocks without
per-item confirmation — the PR review is the human gate. Anything on the
sacred-ground list is untouchable regardless.

## Phase 5 — Catalysis & PR (mechanical executor)

1. Read `.overhaul/LOG.md`. Any lesson that would prevent a future mistake
   becomes a rule or validator: if keepwright's rules/validators structure
   exists in the repo, add it there (respecting P1–P5); otherwise append to
   `CLAUDE.md`.
2. Update the repo's own docs (README, architecture docs) to match the new
   reality. Stale docs are a P2 defect.
3. Open the PR: `overhaul/<date>` → default branch. PR body = summary of
   OVERHAUL-PLAN destination, table of workstreams with proof status, full
   kill list of deleted files, and lessons catalyzed.
4. If any workstream is `## Blocked`, list it in the PR under "Needs
   architect" so the next architect session starts there.

## Resuming

Any session, any model: read `.overhaul/OVERHAUL-PLAN.md` and `LOG.md`,
find the first workstream not `done`, check your tier against its
`executor:` field, and continue at Phase 4. Blocked workstreams that need
judgment wait for an architect-tier session.
