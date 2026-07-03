# Changelog

All notable changes to this project are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [SemVer](https://semver.org/).

## [2.3.0] — 2026-07-03

### Fixed

- **PR auto-review was silently mute on a clean GitHub-hosted runner
  (`ubuntu-latest`).** The review workflow invokes the action with
  `prompt: "/pr-review #N"`, but that slash command only existed as the plugin
  skill (`skills/pr-review/SKILL.md`), which is present only on a self-hosted
  runner with the plugin installed. On the recommended GitHub-hosted runner the
  command did not exist, so the action answered `Unknown command: /pr-review`,
  the deterministic publish step found no output (`No execution_file
  available — skip publish`), and nothing was posted. The check still went
  green because the action step carries `continue-on-error: true` — a green but
  mute review. Two changes fix it:
  - `scripts/apply.ts` now materializes the command into the target repo at
    `.claude/commands/pr-review.md`, from the new
    `templates/commands/pr-review.md.template`, through the same idempotent,
    anti-secret-scanned pipeline as every other template. The plugin skill
    stays for local use; the target repo no longer depends on it.
  - `templates/workflows/pr-auto-review.yml.template` now passes
    `--setting-sources project` ahead of `--allowed-tools` on both action
    attempts, so the runner loads the project-scoped command from the checkout.
    Verified locally: `claude -p "/pr-review #N" --setting-sources project`
    resolves the command; without the flag it answers `Unknown command`.
  - Housekeeping in `scripts/apply.ts`: the six near-identical template-dir
    mapping loops (rules, validators, hooks, scripts, commands, lessons) plus
    the two filtered ones (workflows, issue templates) are collapsed into a
    single `mapDir` helper. Same output, lower complexity — proven by applying
    the engine against a fixture and diffing the produced tree (only the new
    command file is added).

### Changed

- **Corrected the pr-auto-review template's guidance for posting the AI review
  as `claude[bot]` instead of `github-actions[bot]`.** The template's
  deterministic publish posts the verdict via `gh pr comment` with the
  `GITHUB_TOKEN`, so it appears as `github-actions[bot]` (no Anthropic avatar).
  The prior inline comment suggested `use_sticky_comment: true` alone as the
  native alternative, but on an automation workflow (no `@claude` mention) v1 of
  the action runs in agent mode and creates no tracking comment, so that input
  alone does nothing. The comment now documents the real v1 mechanism:
  `track_progress: true` forces tag mode so the action's own layer posts and
  owns the comment as `claude[bot]`; a custom `--allowed-tools` must keep
  `mcp__github_comment__update_claude_comment` or the model's write into that
  comment is denied (the historical `permission_denials_count:3` swallow); and
  no `github_token` may be passed or the identity reverts. The proven
  deterministic publish stays the default until the native path is validated in
  a repo with the Claude GitHub App installed.

## [2.2.0] — 2026-07-02

### Added

- **New skill: `overhaul`** — a full-repo overhaul orchestrator for deep
  refactoring, architecture improvement, dead-code removal, dependency updates,
  and cleanup on any existing project. It splits the work by model tier: cheap
  models fan out read-only reconnaissance, a frontier model grills the user and
  writes the plan plus per-workstream specs, and cheaper executor models carry
  the specs out — each phase emits an artifact under `.overhaul/`, so work
  survives the session and resumes across models.
- The skill integrates with what keepwright already ships instead of
  duplicating it: recon prefers the `map-brownfield` workflow
  (`${CLAUDE_PLUGIN_ROOT}/workflows/map-brownfield.js`), findings are ranked on
  the P1–P5 epistemic hierarchy, no workstream merges without empirical proof,
  and execution lessons are catalyzed into rules/validators where the
  keepwright structure exists.
- Reference files under `skills/overhaul/references/`: `artifacts.md` (the
  RECON / OVERHAUL-PLAN / workstream-spec / LOG templates) and
  `grilling-fallback.md` (a self-contained interview used when the external
  `grilling` skill from mattpocock/skills is not installed).
- CI now validates the `overhaul` skill's frontmatter and reference files,
  same as the existing skill checks.

## [2.1.0] — 2026-06-05

### Added

- **Automatic issue triage over free GitHub Models.** New workflow
  `issue-triage.yml`: when an issue is opened/edited/reopened, a classify job
  asks GitHub Models (free in Actions over the `GITHUB_TOKEN`, no secret) for
  strict JSON — suggested labels, possible duplicate, missing info, severity,
  summary — and a deterministic apply job acts on it. Triage is **advisory**: it
  never closes, assigns, or merges; a human stays in the merge path.
- **Safe by construction.** The workflow holds `issues: write` + `models: read` +
  `contents: read` and nothing else — no pull-requests, no id-token, no
  contents: write. A prompt injection in an issue body cannot reach code, a
  secret, or a merge. The issue body is passed as untrusted data in a separate
  `user` message wrapped in `<issue_body>`; the model's label suggestions are
  intersected with the repo's **live** label set (`gh label list`) so a
  hallucinated label is dropped — the workflow never creates labels.
- **Graceful degradation + idempotency.** No GitHub Models access, a rate limit,
  or malformed output falls back to a `needs:human-triage` label and stops. The
  advisory comment is keyed by an HTML marker and updated in place, so re-triggers
  never spam the issue.
- **Issue templates + label seeding.** `bug_report`, `feature_request`, and a
  `config.yml` (with `needs-triage`), plus `scripts/seed-labels.sh` to create the
  keepwright-specific labels once at setup — deterministic and human-run, kept out
  of the triage workflow's blast radius.
- New rule `09-issue-triage.md` (advisory; untrusted-data contract; P5 never
  overrides P1; documents coexistence with the `@claude` mention workflow), wired
  into the `CLAUDE.md` equalization table.
- Config gains an optional `issues` block: `{ "triage": "off" | "github-models",
  "model": "openai/gpt-4o-mini" }` (default: on, gpt-4o-mini).

## [2.0.2] — 2026-06-05

### Fixed

- Workflow templates are now fully generic, so they fit any repo. The PR
  auto-review and `@claude` mention workflows no longer hardcode
  `runs-on: [self-hosted, ...]` — they use `{{RUNNER}}` from the config
  (default `ubuntu-latest`; self-hosted only when chosen). The critical-file
  detection greps now come from the config's `criticalFiles[]` instead of
  example project paths.

### Removed

- Client project names dropped from `AUTHORS.md` and the 1.0.0 changelog entry.

## [2.0.1] — 2026-06-05

### Fixed

- Clean workflow names — `map-brownfield`, `derive-patterns`, `verify-setup`
  (were prefixed `keepwright-`, which surfaced as the redundant
  `/keepwright:keepwright-*`). No behavior change — the commands trigger them by path.

### Documentation

- README now documents the workflows and the skills/agents the plugin exposes,
  not just the three top-level commands.
- Install split into numbered steps plus `/reload-plugins` to activate after install.

## [2.0.0] — 2026-06-05

Rebrand to **keepwright** and full plugin redesign. The old
`setup-projeto-qualidade` skill becomes a Claude Code plugin with three layers:
an interactive wizard command, a deterministic engine, and orchestration
workflows.

### Changed

- **Rebrand: `setup-projeto-qualidade` → keepwright.** Install via
  `/plugin marketplace add leonardocandiani/keepwright` then
  `/plugin install keepwright`.
- **Single skill → plugin with three commands.** `/keepwright:setup` (the wizard,
  formerly the whole skill), `/keepwright:audit` (integration coverage of an
  existing repo), `/keepwright:review` (repo state vs. derived patterns).
- **Deterministic engine split out.** Validators and git hooks run identically on
  every machine and in CI, with no model in the loop.

### Added

- **Orchestration workflows.** Multi-agent flows that audit an existing repo,
  derive its design and writing-voice patterns, and write them back as rules and
  validators.
- **OAuth via `/install-github-app`.** Recommended primary auth path for the AI
  workflows; it wires `CLAUDE_CODE_OAUTH_TOKEN` for you. Added
  `scripts/setup-oauth-secret.sh` as a deterministic fallback: reads the token
  from the macOS Keychain or `CLAUDE_CODE_OAUTH_TOKEN`, validates its shape, and
  sets the secret without mangling.
- **Empirical Proof Before Merge (EPP)** — 3rd leg of the empirical tripod
  (analysis → hierarchy → proof). New rule `08-empirical-proof.md` +
  validator `validate-empirical-proof.ts`: a functional change merges only with
  evidence that it **runs** against a real environment (command output, log,
  query, reproduced bug scenario), pasted into the PR under
  `## EMPIRICAL VALIDATION`. HARD in CI (with a PR body), REMINDER on pre-push.
  Exempts docs/refactor/style/config/workflow. Bypass via
  `# empirical-proof: ignore <reason>`. Equalized across CLAUDE.md (pointer +
  summary), REVIEW.md (§3.1 critical criterion + §3.5 canonical section + §5
  validators), PULL_REQUEST_TEMPLATE (EMPIRICAL VALIDATION section + checklist),
  `pr-auto-review.yml` (hard gate), and lefthook pre-push (reminder).
- **Explicit model + 1M context in Claude review and mention.**
  `pr-auto-review.yml` and `claude-mention.yml` now run with
  `--model {{REVIEW_MODEL}}` (recommended default `claude-opus-4-8[1m]`) instead
  of the account default. Placeholder `{{REVIEW_MODEL}}` + a per-plan decision
  table (Max/Team/Enterprise → Opus 4.8 1M; Pro → Opus 4.8; cost-sensitive →
  Sonnet 4.6).

### Fixed

- **Opus 4.8 fell back silently.** `claude-code-action@v1` auto-installs a stale
  CLI (~2.1.150, pre-Opus 4.8), so `--model claude-opus-4-8` ran on the account
  default without erroring. Both workflows now have an `Install Claude Code` step
  that **pins** a version >= 2.1.154, **verifies** it (fail-fast gate), and points
  `path_to_claude_code_executable` at it (the action skips its own install).
  `rm -rf` of the native install before the install fixes the launcher resolving
  an old version on a reused/self-hosted runner; `allowed_bots: "claude"` lets a
  bot trigger the `@claude` mention. Validated live: review and mention reporting
  Opus 4.8 1M over CLI 2.1.160.

### Planned

- Monorepo Turbo/Nx support with per-workspace layers
- Cloudflare Pages/Workers deploy template
- Railway deploy template
- Python variant with Ruff + Mypy + Hatch
- Rust variant with Cargo + Clippy
- UI-specific validator (forbidden terms in user-facing strings)
- Interactive wizard to customize the `01-invariants.md` invariants

## [1.0.0] — 2026-05-15

First public release. Skill consolidated around a 10-phase flow.

**Co-authorship**: Leonardo Candiani ([@leonardocandiani](https://github.com/leonardocandiani))
and SixQuasar ([@sixquasar](https://github.com/sixquasar)) — a tech company
founded by Leonardo Candiani, Ricardo, and Rodrigo. Refined in production on
real-world projects.

### Added

#### `.claude/` structure
- 7 structured rules: invariants, pipeline equalization, P1–P5 epistemic
  hierarchy, PR flow, lesson catalysis, parallel work streams, safe merge
- `worker.md` agent with `isolation: worktree` for isolated parallelism
- `settings.json` with `includeCoAuthoredBy: false` + empty attribution + Bash
  allowlist

#### Constitution
- `CLAUDE.md.template` as an equalized index of the rules + always-loaded
  invariants
- `AGENTS.md` (append-only living journal) + `build-log.md` (chronology)
- `docs/{reference-cases,lessons,deploys,api,architecture}/` structure

#### GitHub Actions
- `ci.yml` — type-check, lint, validators (PR + push main)
- `pr-auto-review.yml` — 3 jobs: heuristic + check-key + Claude review over OAuth
- `claude-mention.yml` — `@claude` on demand in a PR/issue/review
- `pr-auto-merge.yml` — auto-approve+merge **only** inert changes (`docs/`,
  `build-log.md`, `.planning/workstreams/`)
- Deploy adapted to stack: 5 templates (Vercel, Supabase Functions, Docker GHCR,
  npm publish, Static Pages)

#### Portable validators
- `validate-no-secrets.ts` — aggressive secret grep over staged files (`pk_live_`,
  `sk_live_`, `sbp_`, `ghp_`, `sk-ant-`, etc.)
- `validate-claude-md-sync.ts` — fails CI if a rule has no pointer in CLAUDE.md,
  or a dead pointer

#### Hooks
- `lefthook.yml` — pre-commit (validators + type-check), commit-msg (conventional
  + blocks AI mentions), pre-push (blocks force-push to main)
- Portable generators: `gen-project-structure.ts`, `gen-todos-report.ts`

#### Scripts
- `gh-pr-merge-safe.sh` — gate `mergeStateStatus = CLEAN` before merge

#### Helper templates
- `PULL_REQUEST_TEMPLATE.md` with an equalization/smoke/catalysis checklist

### Consolidated principles
- Analysis before execution (Phase 0 never skipped)
- Wave-based approval (Phase 1 is destructive, needs explicit ok)
- Double validation (smoke test after each phase)
- History preserved (sub-repos with their own `.git` not absorbed without
  confirmation)
- Secrets blocked via aggressive pre-commit grep
- CLAUDE.md equalization as a hard CI gate
- OAuth preferred over API key for the AI workflows

### Supported stacks (Phase 0 detects automatically)
- Next.js + serverless backend
- Plain Next.js
- Node CLI
- Python FastAPI
- React SPA + separate API
- Containerized service
- Monorepo (installs multiple deploy variants)

[2.1.0]: https://github.com/leonardocandiani/keepwright/compare/v2.0.2...v2.1.0
[2.0.0]: https://github.com/leonardocandiani/keepwright/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/leonardocandiani/keepwright/releases/tag/v1.0.0
