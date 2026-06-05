# PR — <short descriptive title>

## Symptom / motivation

<Why does this PR exist? Screenshot, log, lead bug, user request. Don't fabricate a retroactive narrative.>

## What changed

-
-
-

## Touched layers (equalization)

Reference: `.claude/rules/02-pipeline-equalization.md`

<!-- Adapt the list of layers to the project's architecture -->
- [ ] C1 — {{LAYER_1}}
- [ ] C2 — {{LAYER_2}}
- [ ] C3 — {{LAYER_3}}
- [ ] CN — Others

**I skipped a layer because:** <justify if applicable>

## Smoke test

<which scenario I ran to validate>

## EMPIRICAL VALIDATION (real environment)

> Mandatory if the PR touches functional code (`src/`, `app/`, `api/`, etc).
> Paste **real output** — not "I'll test later". Compiling ≠ working.
> See `.claude/rules/08-empirical-proof.md`. A non-functional change
> (docs/refactor/style/config) is exempt: leave `# empirical-proof: ignore <reason>`.

- **What I tested:** <command/flow>
- **Environment:** <staging / preview / prod / local actually running>
- **Output:**

```
<paste the real output here: command return, log line, query result>
```

- **Bug scenario:** <reproduces before / doesn't reproduce after, if applicable>

## Cataloging

- [ ] Lesson cataloged in `docs/lessons/L-XXX-*.md`
- [ ] Reference case created in `docs/reference-cases/YYYY-MM-DD-*.md` (if 3+ layers)
- [ ] Rule updated in `.claude/rules/` (if a new convention)
- [ ] `build-log.md` append entry
- [ ] `AGENTS.md` entry with date and layers

## Risk

- [ ] Low (config, doc, rule)
- [ ] Medium (single file, no contract change)
- [ ] High (DB schema, API contract, critical flow)

## Checklist

- [ ] Type check green locally
- [ ] Empirical proof pasted in the `EMPIRICAL VALIDATION` section (if it touches functional code)
- [ ] Validators green (`scripts/validators/run-all.sh`)
- [ ] No debug `console.log` going to production
- [ ] No committed secret (validate-no-secrets passes)
- [ ] The squash message follows Conventional Commits
- [ ] No `--no-verify` in commits on this branch
