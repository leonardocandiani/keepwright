# Changelog

Todas as mudanças notáveis deste projeto serão documentadas aqui.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
versionamento segue [SemVer](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Planejado
- Suporte a monorepo Turbo/Nx com camadas por workspace
- Template de deploy Cloudflare Pages/Workers
- Template de deploy Railway
- Variante Python com Ruff + Mypy + Hatch
- Variante Rust com Cargo + Clippy
- Validador específico pra UI (termos proibidos em strings user-facing)
- Wizard interativo pra customizar invariantes do `01-invariantes.md`

## [1.0.0] — 2026-05-15

Primeira release pública. Skill consolidada com fluxo de 10 fases.

**Coautoria**: Leonardo Candiani ([@leonardocandiani](https://github.com/leonardocandiani)) e SixQuasar ([@sixquasar](https://github.com/sixquasar)) — empresa de tecnologia fundada por Leonardo Candiani, Ricardo e Rodrigo. Refinada em produção em SixClaw, Cote.Zap, Ofertix, Sixosteria, Vox e Lupe.

### Adicionado

#### Estrutura `.claude/`
- 7 rules estruturadas: invariantes, equalização de pipeline, hierarquia epistêmica P1-P5, PR flow, catalisação de lições, frentes paralelas, merge seguro
- Agent `worker.md` com `isolation: worktree` pra paralelismo isolado
- `settings.json` com `includeCoAuthoredBy: false` + attribution vazia + allowlist Bash

#### Constituição
- `CLAUDE.md.template` como índice equalizado das rules + invariantes sempre-carregados
- `AGENTS.md` (diário vivo append-only) + `registro-construcao.md` (cronologia)
- Estrutura `docs/{casos-referencia,licoes,deploys,api,arquitetura}/`

#### GitHub Actions
- `ci.yml` — type check, lint, validators (PR + push main)
- `pr-auto-review.yml` — 3 jobs: heurística + check-key + Claude review via OAuth
- `claude-mention.yml` — `@claude` sob demanda em PR/issue/review
- `pr-auto-merge.yml` — auto-approve+merge **só** Tier S inerte (`docs/`, `registro-construcao.md`, `.planning/frentes/`)
- Deploy adaptado à stack: 5 templates (Vercel, Supabase Functions, Docker GHCR, npm publish, Static Pages)

#### Validators portáveis
- `validate-no-secrets.ts` — grep agressivo de secrets em arquivos staged (`pk_live_`, `sk_live_`, `sbp_`, `ghp_`, `sk-ant-`, etc)
- `validate-claude-md-sync.ts` — falha CI se rule sem ponteiro no CLAUDE.md ou ponteiro morto

#### Hooks
- `lefthook.yml` — pre-commit (validators + type check), commit-msg (conventional + bloqueia menção a IA), pre-push (bloqueia force pra main)
- Geradores portáveis: `gen-project-structure.ts`, `gen-todos-report.ts`

#### Scripts
- `gh-pr-merge-safe.sh` — gate `mergeStateStatus = CLEAN` antes de merge

#### Templates auxiliares
- `PULL_REQUEST_TEMPLATE.md` com checklist equalização/smoke/catalisação

### Princípios consolidados
- Análise antes de execução (Fase 0 nunca pulada)
- Aprovação por onda (Fase 1 destrutiva requer ok explícito)
- Validação dupla (smoke test após cada fase)
- Preserva histórico (sub-repos com `.git` próprio não absorvidos sem confirmação)
- Bloqueia secrets via grep agressivo pré-commit
- Equalização CLAUDE.md como gate duro no CI
- OAuth prioritário sobre API key pra workflows de IA

### Stacks suportadas (Fase 0 detecta automaticamente)
- Next.js + backend serverless
- Next.js puro
- Node CLI
- Python FastAPI
- React SPA + API separada
- Serviço containerizado
- Monorepo (instala múltiplas variantes de deploy)

[Unreleased]: https://github.com/leonardocandiani/setup-projeto-qualidade/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/leonardocandiani/setup-projeto-qualidade/releases/tag/v1.0.0
