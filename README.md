# Skill: setup-projeto-qualidade

Organizadora e criadora de projetos. Aplica uma arquitetura de qualidade alta em qualquer projeto git, novo ou existente.

## Como invocar

No projeto-alvo:

```
/setup-projeto-qualidade
```

Ou descrever o que quer ("quero arquitetura sólida com PR auto-review e rules vivas").

## O que faz

1. **Fase 0:** detecta stack (Node/Deno/Python/etc), git, Claude config, CI/CD existente
2. **Fase 1:** init git + repo GitHub + .gitignore
3. **Fase 2:** estrutura `.claude/` (7 rules + settings co-author off + agents worktree)
4. **Fase 3:** constituição CLAUDE.md equalizada + docs + AGENTS.md + registro-construcao.md
5. **Fase 4:** GitHub Actions (CI, PR auto-review OAuth, claude-mention, pr-auto-merge, deploy adaptado à stack)
6. **Fase 5:** validators portáveis (anti-secrets + sincronia CLAUDE.md + slots custom)
7. **Fase 6:** hooks (lefthook + geradores auto)
8. **Fase 7:** branch protection + CODEOWNERS
9. **Fase 8:** smoke test do setup (cria PR de teste)
10. **Fase 9:** cataloga em `docs/licoes/L-000-setup-inicial.md`

## Princípios

- Análise antes de execução (Fase 0 nunca pulada)
- Aprovação por onda (Fase 1 é destrutiva, requer ok explícito)
- Validação dupla (smoke test após cada onda)
- Preserva histórico (sub-repos com .git próprio não absorvidos sem confirmação)
- Bloqueia secrets (grep agressivo antes de commit)

## Templates fornecidos

- `templates/CLAUDE.md.template` — constituição equalizada (índice das rules + invariantes sempre-carregados)
- `templates/settings.json.template` — `includeCoAuthoredBy:false` + attribution vazia + allowlist
- `templates/rules/` — 7 rules base (invariantes, equalização, hierarquia P1-P5, PR flow, catalisação, frentes, merge seguro)
- `templates/agents/` — worker.md (`isolation: worktree`, paralelismo isolado, git garantido)
- `templates/workflows/` — ci.yml, pr-auto-review.yml (heurística + Claude review OAuth), claude-mention.yml (@claude OAuth), pr-auto-merge.yml (Tier S, fail-safe)
- `templates/workflows/deploy/` — vercel, supabase-functions, docker-ghcr, npm-publish, static-pages (skill escolhe pela stack)
- `templates/validators/` — validate-no-secrets.ts + validate-claude-md-sync.ts (gate de equalização)
- `templates/scripts/` — gh-pr-merge-safe.sh (gate mergeStateStatus CLEAN) + setup-self-hosted-runner.sh (runner próprio, zera minutos GitHub)
- `templates/hooks/` — gen-project-structure.ts, gen-todos-report.ts

Placeholders: `{{PROJETO}}`, `{{PROJETO_UPPER}}`, `{{REPO}}`, `{{REPO_OWNER}}`, `{{MANTENEDOR}}`, `{{STACK}}`, `{{DATA_ATUAL}}`, etc. Skill substitui durante setup.

## Autenticação OAuth (prioritário)

Workflows de IA usam `CLAUDE_CODE_OAUTH_TOKEN`. Obter: `claude setup-token` no terminal. Setar: `gh secret set CLAUDE_CODE_OAUTH_TOKEN -R <owner>/<repo>`. Sem o secret, jobs de IA skipam graceful. API key é fallback documentado, não recomendado.

## Duplo gate de merge

Auto-merge real só pra Tier S inerte (docs, cronologia, frentes). Tudo que toca código, CI, rules, deploy ou config é Tier H: IA prepara, humano dá go de uma linha. Detalhe em `templates/rules/07-merge-seguro.md.template`.

Ver SKILL.md pro detalhe completo do fluxo.
