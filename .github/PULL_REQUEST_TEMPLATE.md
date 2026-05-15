## O que muda

<!-- 1-3 bullets sobre o que esse PR entrega -->

-
-

## Por que

<!-- Motivação. Issue relacionada (se houver): closes #N -->

## Tipo

- [ ] feat — nova funcionalidade
- [ ] fix — correção de bug
- [ ] refactor — refatoração sem mudança de comportamento
- [ ] docs — apenas documentação
- [ ] chore — manutenção, configs, deps
- [ ] template — mudança em algum `templates/*`

## Checklist

- [ ] Mudança em rule? Atualizei o ponteiro no CLAUDE.md.template
- [ ] Mudança em template? Renderei mentalmente com placeholders preenchidos e confere
- [ ] Mudança em workflow? Testei o YAML com `actionlint` (ou `gh workflow view`)
- [ ] Sem secrets no diff
- [ ] CHANGELOG.md atualizado em `[Unreleased]`
- [ ] Commit segue conventional commits e não menciona IA

## Smoke test

<!-- Como testar essa mudança em um projeto-cobaia: -->

```bash
# exemplo:
cd projeto-teste/
claude
> /setup-projeto-qualidade
# esperar: ...
```

## Observações

<!-- Decisões de design, alternativas consideradas, ou qualquer contexto extra -->
