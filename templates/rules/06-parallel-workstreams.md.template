# Parallel Workstreams

For work with extensive investigation, planning, and implementation that **does not
fit in a single sequential PR**, use an isolated workstream in `.planning/workstreams/`.

## When to create a workstream

- cURL/empirical investigation that will produce a plan (not a direct PR)
- A change that touches 4+ layers and needs per-layer decisions documented before coding
- A post-bug audit to understand the real state of the system
- A large refactor broken into 3+ sequential PRs

For a small change (1-2 files), **don't create a workstream** — go straight to the PR.

## Structure

```
.planning/workstreams/
├── workstream-<id>-<short-title>/
│   ├── 00-investigation.md       (P1 → P5, empirical findings)
│   ├── 01-plano.md              (layers to touch, order, decisions)
│   ├── 02-execucao.md           (while-implementing checklist)
│   ├── 03-auditoria.md          (post-merge: what we learned)
│   └── artefatos/               (cURL responses, screenshots, SQL queries)
└── README.md                    (index of active workstreams)
```

## Conventions

- **ID:** `<letter>.<number>` — `f1`, `f2.1`, `f2.2`, `z1`. The letter groups a theme, the number disambiguates.
- **Short title:** kebab-case, 3-5 words. E.g. `workstream-f1-cache-invalidation`.
- **Parallel workstreams (W) vs sequential (numeric):** optional convention, follow your instinct for what makes sense.

## Workstreams are not git branches

A workstream is a **namespace for thinking and planning**. Don't confuse it with a branch.
- 1 workstream can produce 3 sequential branches/PRs
- 5 workstreams can be open at the same time without conflict (they are parallel trains of thought)
- Git branches are created in the 02-execucao phase when coding starts

## Lifecycle

1. **Investigation** (`00-investigation.md`) — gather empirical data. cURL, SQL,
   logs. Hypotheses confirmed/refuted.
2. **Plan** (`01-plano.md`) — layers to touch (reference to 02-pipeline-equalization.md),
   order, risks, smoke tests.
3. **Execution** (`02-execucao.md`) — checklist while implementing. Mark what's
   done, what's pending, on-the-fly decisions.
4. **Audit** (`03-auditoria.md`) — post-merge. What worked, what
   didn't. Lessons.
5. **Cataloging** — the audit becomes `docs/lessons/L-XXX-*.md` and/or
   `docs/reference-cases/`. The workstream is archived as history, not
   deleted (institutional memory).

## Anti-pattern

❌ A workstream without the 00-investigation phase (jumps straight to the plan with no empirical data)
❌ A workstream without the 03-auditoria phase (forgot to catalog the lessons)
❌ An "infinite" workstream that never closes — close it or split it into sub-workstreams
❌ A workstream for a trivial change — more overhead than value
