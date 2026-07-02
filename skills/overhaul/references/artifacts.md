# Artifact templates

All artifacts live in `.overhaul/` at the repo root and are committed to the
overhaul branch. They are the interface between models — write them so a
model with **no other context** can act on them.

## RECON.md

```markdown
# Recon — <repo name> — <date>

## How to run this project
<entry points, build, dev server, one-liner each>

## Verdict in three sentences
<the architect reads this first — what is this repo, what shape is it in,
what is the single biggest problem>

## Findings (ranked)
| # | P | Lens | Finding | Evidence (path:line) |
|---|---|------|---------|----------------------|
| 1 | P1 | debt | ... | src/x.ts:120 |

P1 = blocks everything / security · P2 = major debt or stale truth ·
P3 = meaningful improvement · P4 = minor · P5 = cosmetic

## Dead-code kill list (candidates)
<explicit file/symbol list — this gets confirmed during grilling>

## Proof surface
<what commands exist today to verify the repo works; "none" is an answer>
```

## OVERHAUL-PLAN.md

```markdown
# Overhaul Plan — <date>

## Destination
<1 paragraph: what this repo is when we're done>

## Sacred ground (never touch)
- <API/behavior/file/style items from grilling>

## Proof commands
- `<command>` — must pass for any workstream to merge

## Confirmed kill list
<the blessed subset of the recon kill list>

## Workstreams (ordered)
| NN | Name | Executor | Depends on | Status |
|----|------|----------|------------|--------|
| 01 | safety-net | mechanical | — | pending |
```

## Workstream spec — `workstreams/NN-name.md`

```markdown
---
workstream: NN
name: <kebab-name>
executor: structural | mechanical
depends_on: [NN, ...]
status: pending | in-progress | done | blocked
---

## Objective
<one sentence>

## Scope
IN: <files/modules>
OUT: <explicitly out of bounds>

## Steps
1. <ordered, concrete>

## Proof
- `<command>` must exit 0
- <any additional observable check>

## Rollback
<what to do if proof fails and can't be fixed within scope>
```

## LOG.md

Append-only. One line per completed/blocked workstream:

```
NN <name> — done|blocked — <what changed> — lesson: <one sentence or "none">
```
