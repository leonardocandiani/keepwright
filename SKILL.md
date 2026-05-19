---
name: setup-projeto-qualidade
description: Organizadora e criadora de projetos. Aplica uma arquitetura de qualidade alta em qualquer projeto git, novo ou existente — CLAUDE.md como constituição equalizada, rules estruturadas (invariantes, equalização de pipeline, hierarquia epistêmica P1-P5, PR flow, catalisação de lições, frentes paralelas, merge seguro), CI/CD com auto-review OAuth, deploy automático adaptado à stack, agentes worktree-isolados, validators portáveis, hooks. Adapta tudo à stack detectada.
---

# Skill: Setup Projeto Qualidade

Organizadora e criadora de projetos. Pega um repositório (novo ou já em
andamento, qualquer stack) e implanta uma arquitetura de engenharia robusta:
constituição (`CLAUDE.md`) equalizada com as rules, fluxo de PR com review
automático, merge seguro com duplo gate, deploy sincronizado com o GitHub,
agentes worktree-isolados pra paralelismo, catalisação obrigatória de lições.
Tudo genérico e adaptável, sem amarração a nenhum projeto ou pessoa.

## Quando o usuário invoca

Trigger: `/setup-projeto-qualidade` no projeto-alvo, ou ele descreve querer
"arquitetura sólida", "PR flow", "GitHub Actions com auto-review", "rules
vivas", "deploy automático", "catalisação de lições".

## Princípios não-negociáveis

1. **Análise antes de execução.** Nunca toca em nada sem antes detectar
   stack, ler o que existe, mapear. Fase 0 jamais é pulada.
2. **Aprovação por onda.** Cada fase precisa ok explícito. Fase 1 (git/repo)
   é destrutiva, cuidado extra.
3. **Validação dupla.** Após cada fase, smoke test confirma que nada quebrou.
4. **Preserva histórico.** Sub-repos com `.git` próprio nunca são absorvidos
   sem confirmação dupla.
5. **Sem secrets commitados.** Antes de cada commit, grep agressivo:
   `pk_live_`, `sk_live_`, `sbp_`, `EAA…{60+}`, `ghp_`, `sk-ant-`,
   `sk-ant-oat01-`.
6. **Equalização do CLAUDE.md.** Toda rule criada ganha ponteiro no
   `CLAUDE.md` no mesmo passo. Um validador quebra o CI se dessincronizar.
7. **Commits nunca atribuem a IA.** `includeCoAuthoredBy: false` +
   `attribution` vazia no `settings.json` do projeto. Autor é sempre o
   mantenedor humano.

## Equalização do CLAUDE.md (peça central)

O `CLAUDE.md` é sempre carregado pela IA; as rules em `.claude/rules/` não.
Por isso o `CLAUDE.md` é a **constituição**: índice que aponta pra todas as
rules + os invariantes mais críticos escritos no corpo (merge seguro,
hierarquia epistêmica, princípio de catalisação) pra serem impossíveis de
ignorar. Camada de segurança em profundidade: o invariante vive no
`CLAUDE.md` (sempre lido) E na rule (detalhe) E no validador (gate duro).

Regra dura: rule nova sem ponteiro no `CLAUDE.md` = rule invisível. O
`validate-claude-md-sync` falha o CI nesse caso, e também em ponteiro morto.

## Autenticação Claude (OAuth prioritário)

Os workflows de IA (`pr-auto-review` job Claude, `claude-mention`) autenticam
por **OAuth token**, prioridade sobre API key:

```
# 1. gerar o token (no terminal, uma vez)
claude setup-token            # gera sk-ant-oat01-...

# 2. setar como secret do repo
gh secret set CLAUDE_CODE_OAUTH_TOKEN -R <owner>/<repo>
```

Sem o secret, os jobs de IA skipam sem quebrar o PR (graceful degradation).
A skill instrui isso no fim do setup. API key (`ANTHROPIC_API_KEY`) é
fallback documentado, não o caminho recomendado.

## Fluxo da skill

### Fase 0 — Mapeamento do projeto-alvo

```
1. Stack: package.json → Node/TS/Next | pyproject/requirements → Python |
   deno.json → Deno | go.mod → Go | Cargo.toml → Rust | múltiplos → monorepo
2. Git: .git na raiz? sub-repos? remote? GitHub/GitLab?
3. Claude: CLAUDE.md / AGENTS.md / .claude/ já existem? rules/settings?
4. CI/CD: .github/workflows/? lefthook/.husky/pre-commit?
5. Deploy: Vercel? Supabase? Docker? npm pkg? site estático? (define o
   template de deploy a usar na Fase 4)
6. Tooling: bun/deno/npm? linter? typecheck?
```

Reportar em tabela compacta. Pedir confirmação do que pode mexer.

### Fase 1 — Setup base do repositório git (destrutivo, ok explícito)

- Sem `.git` na raiz: `git init` + `git config init.defaultBranch main`
- Sub-repos com `.git` próprio: escolher A) `git subtree` preservando
  histórico, B) submodules, C) `.gitignore` (seguem independentes)
- `.gitignore` cobrindo deps, builds, caches, **secrets**, editor, OS
- `gh repo create <owner>/<nome> --private` + `git remote add origin` + push

### Fase 2 — Estrutura `.claude/` + constituição

```
.claude/
├── rules/
│   ├── 01-invariantes.md            (regras invioláveis, placeholders)
│   ├── 02-equalizacao-pipeline.md   (camadas adaptadas à estrutura real)
│   ├── 03-hierarquia-epistemica.md  (P1-P5)
│   ├── 04-pr-flow.md                (PR, review, merge)
│   ├── 05-catalisacao-licoes.md     (como/onde catalogar)
│   ├── 06-frentes-paralelas.md      (planos paralelos)
│   └── 07-merge-seguro.md           (duplo gate + mergeStateStatus CLEAN)
├── agents/
│   └── worker.md                    (isolation: worktree — paraleliza sem
│                                      sujar o working tree; git garantido)
└── settings.json                    (includeCoAuthoredBy:false +
                                       attribution vazia + allowlist Bash)
```

Templates pré-preenchidos em `templates/`. A skill personaliza: nome do
projeto no título, stack nas rules, camadas geradas da estrutura real
(`src/`, `api/`, `lib/` viram camadas), invariantes ficam como placeholder
pro mantenedor preencher. Placeholders: `{{PROJETO}}`, `{{PROJETO_UPPER}}`,
`{{REPO}}`, `{{REPO_OWNER}}`, `{{MANTENEDOR}}`, `{{STACK}}`, etc.

### Fase 3 — Constituição + documentação

- `CLAUDE.md` a partir de `templates/CLAUDE.md.template`: índice com ponteiro
  pras 7 rules + invariantes sempre-carregados (merge seguro, hierarquia,
  catalisação) no corpo. **Equalizado**: toda rule tem linha no índice.
- **`REVIEW.md` raiz** a partir de `templates/REVIEW.md.template`: single
  source of truth consumido pelo Claude AI review do `pr-auto-review.yml`.
  Contém 9 seções: sumário projeto (§1) + princípios canônicos catalisados
  (§2.X = lições L-XXX) + critérios merge (§3 críticos/ressalvas/aprovação
  + hierarquia epistêmica P1-P5) + frentes entregues (§4) + validators
  ativos (§5) + vocabulário canônico (§6) + endpoints+integrações (§7) +
  output format obrigatório do review (§8) + fallback canônico Code Review
  Diretor (§9). Começa com placeholders; mantenedor preenche §2.X conforme
  catalisa lições e §3-§9 conforme projeto amadurece. Workflow YAML
  referencia APENAS `REVIEW.md` + `CLAUDE.md` no prompt (reduz turns,
  evita AJV crash).
- `AGENTS.md` (diário vivo append-only) + `registro-construcao.md` (cronologia)
- `docs/{casos-referencia,licoes,deploys,api,arquitetura}/`

### Fase 4 — GitHub Actions

- **`ci.yml`** — type check, lint, validators (PR + push main)
- **`pr-auto-review.yml`** — 3 jobs: heurística (sempre, sem custo) +
  `check-key` (graceful se `CLAUDE_CODE_OAUTH_TOKEN` ausente) +
  `claude-review` (Claude AI via OAuth, lê **`REVIEW.md` raiz** como single
  source of truth + rules, comenta). Estrutura resiliente: **retry duplo**
  (tentativa 1 + sleep 30s + tentativa 2, ambos `continue-on-error: true`)
  + **fallback canônico** se 2 tentativas falharem → posta comment
  sinalizando Code Review Diretor manual (4 sub-agents READ-ONLY paralelos
  via Task tool: architect / reviewer / quality-engineer /
  deep-research-agent). Mitiga bugs upstream conhecidos
  (`claude-code-action`: AJV crash, fd 4 mismatch, error_max_turns, App
  token 401)
- **`claude-mention.yml`** — `@claude` sob demanda em PR/issue/review.
  Autentica via `CLAUDE_CODE_OAUTH_TOKEN`. Sem o secret, skipa silencioso
- **`pr-auto-merge.yml`** — auto-approve+merge SÓ Tier S inerte (`docs/`,
  `registro-construcao.md`, `.planning/frentes/`), fail-safe por exclusão,
  dispara via `workflow_run` pós-CI verde. Tier H = humano (07-merge-seguro)
- **`deploy/<variante>.yml`** — deploy automático sincronizado com o GitHub,
  escolhido pela stack detectada na Fase 0 (matriz abaixo)

Ao final, instruir o setup do OAuth token (seção "Autenticação Claude").

### Fase 4.5 — Rodar as GitHub Actions localmente (self-hosted, zera minutos)

GitHub Free dá 2000 min/mês de runner hospedado em repo privado. Acabou a
cota, o CI para. **Runner self-hosted não conta nesse limite** (ilimitado,
qualquer visibilidade de repo). A ideia: o GitHub continua orquestrando
(triggers, secrets, UI, branch protection), mas a **execução roda numa
máquina sua**.

**Onde rodar.** Qualquer coisa com Docker e saída pra internet:
- um VPS/servidor Linux,
- um box ocioso na sua infra,
- ou a sua própria máquina local (o runner faz só conexão de saída pro
  GitHub, não precisa de IP público nem porta aberta).

O runner não precisa de VPN/malha pra funcionar, ele só fala HTTPS de saída
com o GitHub. A malha (Tailscale/WG) só importa se você for administrar o
host remoto por SSH.

**Como.** `templates/scripts/setup-self-hosted-runner.sh <owner/repo>
<host-ssh> <label>` sobe um runner containerizado
(`myoung34/github-runner`, `--restart unless-stopped`), minta o token de
registro via `gh api` (não persiste PAT) e registra no repo com um label.
Rodar localmente: aponte o `<host-ssh>` pra `localhost` ou rode o
`docker run` equivalente direto na máquina.

**Apontar os jobs.** Nos workflows, troque `runs-on: ubuntu-latest` por
`runs-on: [self-hosted, linux, x64]` nos jobs que vão pra máquina sua.
GitHub casa por label (case-insensitive).

**Segurança (inegociável).** SÓ em repo privado com colaboradores
confiáveis. Repo público = PR de fork roda código arbitrário no seu host.
Não furar isso.

**Estratégias** (escolha conforme o projeto):
- **Híbrido:** jobs pesados (type-check, validators, IA review) →
  self-hosted; jobs leves/críticos/raros (guards, deploy, auto-merge) →
  `ubuntu-latest`. ~95% dos minutos economizados, e se o host cair o
  maquinário do PR + deploy seguem no GitHub.
- **Full self-hosted + N runners redundantes:** TODOS os jobs →
  `[self-hosted, linux, x64]`, e **2+ runners** (hosts diferentes) com o
  **mesmo label**. Zero minuto GitHub E redundância: host cai, o outro
  pega, jobs nunca falham por isso (no pior caso ficam em fila). Recomendado
  quando você tem 2+ máquinas. Rode o `setup-self-hosted-runner.sh` uma vez
  por host com o mesmo label.

Se todos os runners estiverem offline, jobs self-hosted ficam **enfileirados
(pending), não falham** — voltam a rodar quando um runner volta.

### Fase 5 — Validators portáveis

Default (sempre instalados em `scripts/validators/`):

- **`validate-no-secrets.ts`** — grep secrets em arquivos staged
- **`validate-claude-md-sync.ts`** — equalização: falha se rule sem ponteiro
  no CLAUDE.md ou ponteiro morto. O `ci.yml` roda tudo em
  `scripts/validators/*.ts` automaticamente
- **`validate-webhook-active.ts`** — gate L-001 (doc sem smoke E2E é
  ficção). Se `CLAUDE.md` menciona "webhook GitHub" / "deploy automático",
  `gh api repos/<owner>/<repo>/hooks` precisa retornar ≥1 webhook ativo
  com push event. Skipa gracefully em CI default (`GITHUB_TOKEN` sem scope
  `admin:repo_hook` → 403/404). Falha somente em ambiente com PAT
  configurado (dev local autenticado ou runner com `PAT_HOOK`).
- **`validate-hierarquia-epistemica.ts`** — gate hierarquia P1-P5. Detecta
  frases proibidas de inversão (P5 refutando P1: "ZERO bugs detectados",
  "Padrão arquitetural está 100% correto" sem cirurgia, "hipótese sem
  evidência confirmou-se infundada", etc) em `PR_TITLE` + `PR_BODY` +
  `COMMIT_MESSAGES`. Bypass legítimo: blockquote markdown (`>`) +
  evidência cirúrgica adjacente OU comentário inline
  `// hierarquia-epistemica: ignore` (janela 3 linhas). Roda em
  commit-msg hook (lefthook) E em CI.

Validators **específicos do projeto** o mantenedor cria conforme o domínio
(ex: um validador de termos proibidos em strings de UI). Catalisar nova
lição em `docs/licoes/L-XXX-*.md` que reincida 2+ vezes vira validator
custom novo nesse slot (use `templates/licoes/L-XXX-titulo-curto.md.template`
+ adicione entrada em `REVIEW.md §2.X` + crie validator opcional).

### Fase 6 — Hooks (lefthook)

`lefthook.yml`: pre-commit (validators + type-check), commit-msg
(conventional + bloqueia menção a IA), pre-push (bloqueia force pra main).
Geradores `gen-project-structure.ts` / `gen-todos-report.ts` portáveis.

### Fase 7 — Branch protection + CODEOWNERS

- `.github/CODEOWNERS` — toda mudança requer aprovação do owner
- `.github/PULL_REQUEST_TEMPLATE.md` — checklist equalização/smoke/catalisação
- Branch protection via `gh api` (requer plano que suporte; senão lefthook
  client-side + pr-auto-merge Tier S compensam)

### Fase 8 — Smoke test do setup

Branch `chore/setup-test`, mudança trivial em `docs/` (Tier S de propósito),
abre PR, confirma: CI verde, heurística comenta, Claude review comenta (se
token setado), `pr-auto-merge` aprova+mergeia sozinho (valida o Tier S
end-to-end). Se token não setado, confirma graceful skip.

### Fase 9 — Catalisação inicial

`docs/licoes/L-000-setup-inicial.md` com o que foi feito, decisões,
ponteiros. Append em `AGENTS.md` + `registro-construcao.md`.

Template canônico de lição em `templates/licoes/L-XXX-titulo-curto.md.template`
(sintoma P1 + investigação descendente P1→P5 + causa raiz + fix + prevenção
daqui pra frente + quando se aplica). Toda lição catalisada vira:
1. Arquivo `docs/licoes/L-XXX-*.md` (caso fundador empírico)
2. Entrada em `REVIEW.md §2.X` (princípio canônico + mitigação)
3. Opcional: validator `scripts/validators/validate-<slug>.ts` se reincidiu
4. Opcional: invariante novo em `.claude/rules/01-invariantes.md`

Lição catalogada incompleta = lição perdida. Catalogar imediatamente
pós-merge do fix.

## 4 pilares de qualidade (padrão Coordenador-Frentes)

Padrão replicável extraído de projetos com múltiplas frentes coordenadas
e Code Review automático. Aplica em projeto novo (greenfield) ou existente
(brownfield). Mais detalhe em
`~/.claude/rules/padrao-coordenador-frentes.md` global do mantenedor.

1. **Hierarquia epistêmica P1-P5** — sintoma reportado pelo mantenedor (P1)
   > logs prod (P2) > estado DB (P3) > código (P4) > auditoria abstrata
   (P5). **P5 NUNCA refuta P1.** Validator `validate-hierarquia-epistemica.ts`
   é o gate hard.
2. **Code Review Multi-Camada com fallback** — gate primário automático
   (`anthropics/claude-code-action`) + retry duplo (sleep 30s) + fallback
   Code Review Diretor manual (4 sub-agents READ-ONLY paralelos). Veredicto
   manual tem MESMO peso de gate de merge que automático.
3. **Equalização Angular cross-camada** — feature cross-camada toca TODAS
   as camadas afetadas em PR ÚNICO. Validators custom + `02-equalizacao-pipeline.md`
   garantem sequência correta por tipo de mudança.
4. **Lições + Caso Fundador (L-XXX)** — toda decisão arquitetural relevante
   vira lição numerada + caso fundador documentado. Princípio canônico em
   `REVIEW.md §2.X`. Lições não morrem entre incidentes — viram base
   orquestração permanente.

## Matriz de deploy (Fase 0 escolhe, Fase 4 instala)

| Stack detectada | Template de deploy | Secrets |
|---|---|---|
| Next.js / Vite / SPA na Vercel | `deploy/vercel.yml` | VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID |
| Supabase edge functions | `deploy/supabase-functions.yml` | SUPABASE_ACCESS_TOKEN |
| Serviço containerizado | `deploy/docker-ghcr.yml` | GITHUB_TOKEN (nativo); SSH opcional |
| Biblioteca/pacote npm | `deploy/npm-publish.yml` | NPM_TOKEN |
| Site estático | `deploy/static-pages.yml` | nenhum (Pages nativo) |

Todos disparam só PÓS-merge na main (deploy nunca roda no PR) + path filter +
`workflow_dispatch`. Monorepo com 2+ alvos = instala 2+ variantes.

## Adaptações por stack

| Stack | Adaptações |
|---|---|
| Next.js + backend serverless | Camadas: routes→actions→lib→db→integrações. Deploy Vercel + functions |
| Next.js puro | Camadas: routes→server actions→lib→db |
| Node CLI | Camadas: bin→commands→lib. Deploy npm-publish |
| Python FastAPI | Camadas: routes→services→models. ruff + mypy no CI |
| React SPA + API separada | 2 sets de camadas, CI paralelo, cross-contract validator |
| Serviço containerizado | Camadas por bounded context. Deploy docker-ghcr |

## Anti-patterns que a skill BLOQUEIA

- ❌ Setup em projeto com mudanças não-commitadas (pede stash/commit antes)
- ❌ Sobrescrever CLAUDE.md existente sem mostrar diff
- ❌ `git init` em pasta que já tem `.git`
- ❌ Push de commit com secret detectado
- ❌ Fase 1 sem confirmação dupla
- ❌ Pular Fase 0
- ❌ Criar rule sem adicionar ponteiro no CLAUDE.md (validador pega)
- ❌ Commit atribuindo a IA (settings força attribution vazia)

## Output esperado por fase

1. O que foi feito (bullets)
2. Smoke test executado (qual + resultado)
3. Próxima fase (descrição curta + pede ok)

## Como o LLM usa essa skill

1. Leio este SKILL.md por completo
2. Listo `templates/` pra saber o disponível
3. Executo Fase 0 (mapeamento) e escolho a variante de deploy
4. Apresento plano por fase
5. Pego ok fase por fase
6. Executo + smoke test + catalogo
7. No fim: instruo o OAuth token e como manter (regenerar
   `.project-structure.md` / `.todos-report.md`, append lições)
