# Changelog

All notable changes to this project are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [SemVer](https://semver.org/).

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
SixClaw, Cote.Zap, Ofertix, Sixosteria, Vox, and Lupe.

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

[2.0.0]: https://github.com/leonardocandiani/keepwright/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/leonardocandiani/keepwright/releases/tag/v1.0.0
