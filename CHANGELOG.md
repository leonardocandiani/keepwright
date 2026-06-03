# Changelog

Todas as mudanças notáveis deste projeto serão documentadas aqui.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
versionamento segue [SemVer](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Adicionado
- **Prova Empírica Pré-Merge (PEP)** — 3ª perna do tripé empírico (análise →
  hierarquia → prova). Nova rule `08-prova-empirica-pre-merge.md` + validator
  `validate-prova-empirica.ts`: mudança funcional só mergeia com evidência de que
  **roda** contra ambiente real (output de comando, log, query, cenário do bug
  reproduzido), colada no PR sob `## VALIDAÇÃO EMPÍRICA`. HARD no CI (com PR
  body), LEMBRETE no pre-push. Isento docs/refactor/style/config/workflow.
  Bypass `# prova-empirica: ignore <razão>`. Equalizado em CLAUDE.md (ponteiro +
  resumo), REVIEW.md (§3.1 critério crítico + §3.5 seção canônica + §5
  validators), PULL_REQUEST_TEMPLATE (seção VALIDAÇÃO EMPÍRICA + checklist),
  `pr-auto-review.yml` (gate hard) e lefthook pre-push (lembrete). Refinado em
  produção no Cote.Zap. Vira 5º pilar de qualidade na SKILL.md.
- **Modelo explícito + 1M no Claude review e mention.** `pr-auto-review.yml` e
  `claude-mention.yml` agora rodam com `--model {{REVIEW_MODEL}}` (default
  recomendado `claude-opus-4-8[1m]`) em vez do default da conta. Placeholder
  `{{REVIEW_MODEL}}` + tabela de decisão por plano (Max/Team/Enterprise → Opus
  4.8 1M; Pro → Opus 4.8; cost-sensitive → Sonnet 4.6) na SKILL.md.

### Corrigido
- **Opus 4.8 caía em fallback silencioso.** A `claude-code-action@v1`
  auto-instala uma CLI defasada (~2.1.150, anterior ao Opus 4.8); `--model
  claude-opus-4-8` rodava no default da conta sem erro. Os dois workflows
  ganharam um step `Instalar Claude Code` que **pina** uma versão >= 2.1.154,
  **verifica** (gate fail-fast), e aponta `path_to_claude_code_executable` pra
  ela (action pula a própria instalação). `rm -rf` da instalação nativa antes
  do install resolve o launcher resolvendo versão antiga em runner
  reusado/self-hosted; `allowed_bots: "claude"` libera menção @claude por bot.
  Validado ao vivo: review e mention reportando Opus 4.8 1M sobre CLI 2.1.160.

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
