<!-- Banner -->
<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0d1117,50:1a1a2e,100:00d9ff&height=200&section=header&text=setup-projeto-qualidade&fontSize=42&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Arquitetura%20de%20qualidade%20alta%20em%20qualquer%20projeto%20git&descAlignY=62&descSize=16" />
</div>

<!-- Badges -->
<div align="center">
  <a href="https://github.com/leonardocandiani/setup-projeto-qualidade/releases"><img src="https://img.shields.io/github/v/release/leonardocandiani/setup-projeto-qualidade?style=for-the-badge&color=00d9ff&label=Release" /></a>
  <a href="https://github.com/leonardocandiani/setup-projeto-qualidade/blob/main/LICENSE"><img src="https://img.shields.io/github/license/leonardocandiani/setup-projeto-qualidade?style=for-the-badge&color=00d9ff" /></a>
  <a href="https://github.com/leonardocandiani/setup-projeto-qualidade/stargazers"><img src="https://img.shields.io/github/stars/leonardocandiani/setup-projeto-qualidade?style=for-the-badge&color=00d9ff&logo=github" /></a>
  <img src="https://img.shields.io/badge/Claude%20Code-Skill-D97757?style=for-the-badge&logo=anthropic&logoColor=white" />
</div>

<br>

<div align="center">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=600&size=18&duration=2800&pause=900&color=00D9FF&center=true&vCenter=true&width=780&lines=Rules+estruturadas+%E2%80%A2+CI%2FCD+OAuth+%E2%80%A2+Validators+port%C3%A1teis;Auto-review+com+Claude+Code+%E2%80%A2+Merge+seguro+duplo+gate;Deploy+adaptado+%C3%A0+stack+%E2%80%A2+Equaliza%C3%A7%C3%A3o+CLAUDE.md;De+zero+a+projeto+robusto+em+minutos" />
</div>

<br>

## O que é

Skill do **Claude Code** que pega um repositório (novo ou em andamento, qualquer stack) e implanta uma arquitetura de engenharia robusta em fases controladas. Aprovação por onda, smoke test depois de cada fase, nada é tocado sem ok explícito.

> **Trigger:** `/setup-projeto-qualidade` no projeto-alvo, ou descreva o que quer ("quero arquitetura sólida com PR auto-review e rules vivas").

<br>

## Quick Start

### 1. Instalar a skill no Claude Code

```bash
# Clonar pra pasta de skills
git clone https://github.com/leonardocandiani/setup-projeto-qualidade \
  ~/.claude/skills/setup-projeto-qualidade

# Reiniciar Claude Code pra registrar
```

### 2. Invocar no projeto-alvo

```bash
cd seu-projeto/
claude
> /setup-projeto-qualidade
```

A skill executa **10 fases** com ok explícito a cada onda. Fase 1 é destrutiva (init git), o resto preserva o que já existe.

<br>

## O que ela entrega

<table>
<tr>
<td width="50%" valign="top">

### 🏗️ Estrutura `.claude/`
- **7 rules** estruturadas em invariantes, equalização de pipeline, hierarquia P1-P5, PR flow, catalisação, frentes paralelas, merge seguro
- **Agent worker** com `isolation: worktree` (paraleliza sem sujar a árvore)
- **settings.json** com `includeCoAuthoredBy: false` + attribution vazia

</td>
<td width="50%" valign="top">

### 📜 Constituição equalizada
- `CLAUDE.md` como índice da rules + invariantes sempre-carregados
- `AGENTS.md` (diário vivo) + `registro-construcao.md` (cronologia)
- `docs/{licoes,casos-referencia,deploys,api,arquitetura}/`
- Validador quebra CI se rule sem ponteiro no CLAUDE.md

</td>
</tr>
<tr>
<td width="50%" valign="top">

### ⚙️ GitHub Actions
- **`ci.yml`** — type check, lint, validators
- **`pr-auto-review.yml`** — heurística + Claude review via **OAuth**
- **`claude-mention.yml`** — `@claude` sob demanda em PR/issue
- **`pr-auto-merge.yml`** — Tier S inerte (docs/registro/frentes)
- **Deploy adaptado** à stack (Vercel/Supabase/Docker/npm/Pages)

</td>
<td width="50%" valign="top">

### 🛡️ Validators portáveis
- **`validate-no-secrets.ts`** — grep agressivo de secrets em staged
- **`validate-claude-md-sync.ts`** — falha se rule sem ponteiro no CLAUDE.md
- **Slot custom** pra validators específicos do projeto

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🪝 Hooks com lefthook
- Pre-commit: validators + type check
- Commit-msg: conventional + bloqueia menção a IA
- Pre-push: bloqueia force push pra main
- Geradores `gen-project-structure.ts` / `gen-todos-report.ts`

</td>
<td width="50%" valign="top">

### 🔐 Merge seguro (duplo gate)
- Auto-merge **só** Tier S inerte (fail-safe por exclusão)
- Tier H: humano dá o go de uma linha
- `gh-pr-merge-safe.sh` garante `mergeStateStatus = CLEAN`

</td>
</tr>
</table>

<br>

## Fluxo das 10 fases

```
Fase 0 — Mapeamento do projeto-alvo (stack, git, Claude config, CI/CD, deploy)
Fase 1 — Setup base do git (init + repo GitHub + .gitignore) [DESTRUTIVA]
Fase 2 — Estrutura .claude/ (rules + agents + settings)
Fase 3 — Constituição CLAUDE.md equalizada + docs base
Fase 4 — GitHub Actions (CI + auto-review + claude-mention + auto-merge + deploy)
Fase 5 — Validators portáveis (anti-secrets + sync CLAUDE.md)
Fase 6 — Hooks (lefthook + geradores auto)
Fase 7 — Branch protection + CODEOWNERS + PR template
Fase 8 — Smoke test do setup (PR de teste end-to-end)
Fase 9 — Catalisação inicial em docs/licoes/L-000-setup-inicial.md
```

Cada fase termina com smoke test e pede ok antes de avançar.

<br>

## Matriz de deploy

A skill detecta a stack na Fase 0 e instala o template correto:

| Stack detectada | Template | Secrets necessários |
|---|---|---|
| Next.js / Vite / SPA na Vercel | `deploy/vercel.yml` | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` |
| Supabase Edge Functions | `deploy/supabase-functions.yml` | `SUPABASE_ACCESS_TOKEN` |
| Serviço containerizado | `deploy/docker-ghcr.yml` | `GITHUB_TOKEN` (nativo) |
| Biblioteca/pacote npm | `deploy/npm-publish.yml` | `NPM_TOKEN` |
| Site estático | `deploy/static-pages.yml` | nenhum (Pages nativo) |

Monorepo com 2+ alvos = instala 2+ variantes. Todos disparam **só pós-merge na main** + path filter + `workflow_dispatch`.

<br>

## Autenticação Claude (OAuth prioritário)

Os workflows de IA (`pr-auto-review`, `claude-mention`) autenticam via **OAuth token**, não API key:

```bash
# 1. Gerar token (uma vez no terminal)
claude setup-token            # gera sk-ant-oat01-...

# 2. Setar como secret do repo
gh secret set CLAUDE_CODE_OAUTH_TOKEN -R <owner>/<repo>
```

Sem o secret, os jobs de IA skipam sem quebrar o PR (graceful degradation). `ANTHROPIC_API_KEY` é fallback documentado, não recomendado.

<br>

## Princípios não-negociáveis

1. **Análise antes de execução.** Fase 0 jamais é pulada.
2. **Aprovação por onda.** Cada fase requer ok explícito; Fase 1 tem confirmação dupla.
3. **Validação dupla.** Smoke test após cada fase.
4. **Preserva histórico.** Sub-repos com `.git` próprio nunca são absorvidos sem confirmação.
5. **Sem secrets commitados.** Grep agressivo: `pk_live_`, `sk_live_`, `sbp_`, `ghp_`, `sk-ant-`, etc.
6. **Equalização do CLAUDE.md.** Rule nova sem ponteiro = invisível. Validador quebra CI.
7. **Commits nunca atribuem a IA.** `includeCoAuthoredBy: false` + attribution vazia.

<br>

## Anti-patterns que a skill BLOQUEIA

- ❌ Setup em projeto com mudanças não-commitadas (pede stash/commit antes)
- ❌ Sobrescrever CLAUDE.md existente sem mostrar diff
- ❌ `git init` em pasta que já tem `.git`
- ❌ Push de commit com secret detectado
- ❌ Fase 1 sem confirmação dupla
- ❌ Pular Fase 0
- ❌ Criar rule sem adicionar ponteiro no CLAUDE.md
- ❌ Commit atribuindo a IA

<br>

## Templates incluídos

<details>
<summary><b>Lista completa dos templates</b> (37 arquivos)</summary>

<br>

```
templates/
├── CLAUDE.md.template                              # constituição equalizada
├── settings.json.template                          # co-author off + allowlist
├── lefthook.yml.template                           # hooks (pre-commit/msg/push)
├── PULL_REQUEST_TEMPLATE.md.template               # checklist equalização
│
├── rules/                                          # 7 rules estruturadas
│   ├── 01-invariantes.md.template
│   ├── 02-equalizacao-pipeline.md.template
│   ├── 03-hierarquia-epistemica.md.template
│   ├── 04-pr-flow.md.template
│   ├── 05-catalisacao-licoes.md.template
│   ├── 06-frentes-paralelas.md.template
│   └── 07-merge-seguro.md.template
│
├── agents/
│   └── worker.md.template                          # isolation: worktree
│
├── workflows/                                      # GitHub Actions
│   ├── ci.yml.template
│   ├── pr-auto-review.yml.template                 # heurística + Claude OAuth
│   ├── claude-mention.yml.template                 # @claude sob demanda
│   ├── pr-auto-merge.yml.template                  # Tier S inerte
│   └── deploy/                                     # 5 variantes
│       ├── vercel.yml.template
│       ├── supabase-functions.yml.template
│       ├── docker-ghcr.yml.template
│       ├── npm-publish.yml.template
│       └── static-pages.yml.template
│
├── validators/                                     # gates portáveis
│   ├── validate-no-secrets.ts.template
│   └── validate-claude-md-sync.ts.template
│
├── hooks/                                          # geradores auto
│   ├── gen-project-structure.ts.template
│   └── gen-todos-report.ts.template
│
└── scripts/
    └── gh-pr-merge-safe.sh.template                # mergeStateStatus CLEAN
```

Placeholders nos templates: `{{PROJETO}}`, `{{PROJETO_UPPER}}`, `{{REPO}}`, `{{REPO_OWNER}}`, `{{MANTENEDOR}}`, `{{STACK}}`, `{{DATA_ATUAL}}`. A skill substitui durante o setup.

</details>

<br>

## Adaptações por stack

| Stack | Camadas geradas | Particular |
|---|---|---|
| Next.js + backend serverless | routes → actions → lib → db → integrações | Vercel + functions |
| Next.js puro | routes → server actions → lib → db | Vercel |
| Node CLI | bin → commands → lib | npm-publish |
| Python FastAPI | routes → services → models | ruff + mypy no CI |
| React SPA + API separada | 2 sets de camadas | CI paralelo + cross-contract validator |
| Serviço containerizado | bounded contexts | docker-ghcr |

<br>

## Contribuindo

PRs bem-vindos. Mantenha o estilo Cote.Zap:

1. **Equalização**: rule nova precisa de ponteiro no CLAUDE.md
2. **Catalisação**: mudança grande precisa de lição em `docs/licoes/L-NNN-titulo.md`
3. **Sem AI mentions** em commits/código

Pra desenvolvimento da skill em si:

```bash
git clone https://github.com/leonardocandiani/setup-projeto-qualidade
cd setup-projeto-qualidade
# editar templates/ ou SKILL.md
# testar invocando /setup-projeto-qualidade em um projeto-cobaia
```

<br>

## Roadmap

- [ ] Suporte a monorepo Turbo/Nx com camadas por workspace
- [ ] Template de deploy Cloudflare Pages/Workers
- [ ] Template de deploy Railway
- [ ] Variante Python com Ruff + Mypy + Hatch
- [ ] Variante Rust com Cargo + Clippy
- [ ] Validador específico pra UI (termos proibidos em strings user-facing)
- [ ] Wizard interativo pra customizar invariantes do `01-invariantes.md`

Sugestões via [Issues](https://github.com/leonardocandiani/setup-projeto-qualidade/issues).

<br>

## Changelog

Ver [CHANGELOG.md](CHANGELOG.md) pro histórico completo de versões.

<br>

## Licença

[MIT](LICENSE) — usa, modifica, distribui à vontade.

<br>

## Autor

**Leonardo Candiani** — [leonardocandiani.com.br](https://leonardocandiani.com.br)

<div align="center">
  <a href="https://leonardocandiani.com.br">
    <img src="https://img.shields.io/badge/-Website-0d1117?style=for-the-badge&logo=safari&logoColor=00d9ff" />
  </a>
  <a href="https://github.com/leonardocandiani">
    <img src="https://img.shields.io/badge/-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" />
  </a>
  <a href="https://instagram.com/leonardocandiani">
    <img src="https://img.shields.io/badge/-Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white" />
  </a>
  <a href="https://youtube.com/@oleonardocandiani">
    <img src="https://img.shields.io/badge/-YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white" />
  </a>
</div>

<br>

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:00d9ff,50:1a1a2e,100:0d1117&height=100&section=footer" />
</div>
