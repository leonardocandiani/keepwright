# Contribuindo

Obrigado por considerar contribuir! Esta skill é open source (MIT) e PRs são muito bem-vindos.

## Antes de abrir um PR

1. **Confere se já existe issue ou PR** sobre o mesmo tema
2. **Abre uma issue antes de mudanças grandes** — vamos alinhar antes de você gastar tempo
3. **Lê o [SKILL.md](SKILL.md)** pra entender a filosofia e os 7 princípios não-negociáveis
4. **Lê o [CHANGELOG.md](CHANGELOG.md)** pra ver o que tá vindo

## Setup local

```bash
git clone https://github.com/leonardocandiani/setup-projeto-qualidade
cd setup-projeto-qualidade
```

Não tem build step — a skill é puramente markdown + templates. Edita os arquivos relevantes em `templates/` ou `SKILL.md` e testa invocando `/setup-projeto-qualidade` em um projeto-cobaia.

## Estrutura do repo

```
.
├── README.md              # documentação pública
├── SKILL.md               # contrato da skill com o Claude Code
├── CHANGELOG.md           # histórico versionado
├── CONTRIBUTING.md        # este arquivo
├── LICENSE                # MIT
└── templates/             # tudo que a skill instala
    ├── CLAUDE.md.template
    ├── settings.json.template
    ├── lefthook.yml.template
    ├── PULL_REQUEST_TEMPLATE.md.template
    ├── rules/             # 7 rules estruturadas
    ├── agents/
    ├── workflows/         # CI + auto-review + auto-merge + deploys
    ├── validators/
    ├── hooks/
    └── scripts/
```

## Conventional Commits (obrigatório)

```
feat(rules): adicionar rule 08-rollback-protocol
fix(validators): corrigir regex de detecção de OAuth token
docs: melhorar seção de matriz de deploy no README
chore(deps): bump lefthook 1.7.x
refactor(skill): consolidar Fase 4 e Fase 5 em uma fase de "automação"
```

Tipos aceitos: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`, `perf`, `template`.

**Nunca menciona IA/Claude em commits**. O autor é sempre o mantenedor humano.

## Padrões pra mudanças

### Mudando uma rule

- Atualiza o arquivo em `templates/rules/XX-nome.md.template`
- **Confere se o ponteiro existe no `templates/CLAUDE.md.template`**
- Se for rule nova, adiciona o ponteiro
- Atualiza CHANGELOG em `[Unreleased]`

### Mudando um template de workflow

- Edita `templates/workflows/<nome>.yml.template`
- Valida o YAML mentalmente com placeholders preenchidos
- Recomendado: rodar `actionlint` localmente no YAML renderizado
- Atualiza CHANGELOG

### Adicionando nova variante de deploy

- Cria `templates/workflows/deploy/<stack>.yml.template`
- Atualiza a matriz no `SKILL.md` (seção "Matriz de deploy")
- Atualiza a matriz no `README.md`
- Atualiza CHANGELOG

### Adicionando novo validator

- Cria `templates/validators/<nome>.ts.template`
- Documenta no `SKILL.md` o que ele valida
- Atualiza CHANGELOG

## Princípios para PRs

1. **Equalização**: rule nova ou template movido = atualização no `CLAUDE.md.template` no mesmo PR
2. **Catalisação**: mudança não-trivial precisa de seção em `[Unreleased]` no CHANGELOG
3. **Sem AI mentions** em commits, código ou docs
4. **Sem secrets** — o CI tem grep agressivo, mas confere antes de pushar

## Smoke test antes de pedir review

Antes de marcar o PR como "ready for review":

1. Clone a versão do PR em um projeto-cobaia
2. Roda `/setup-projeto-qualidade`
3. Confirma que a Fase 0 detecta corretamente
4. Se mexeu em alguma fase específica, valida só essa
5. Cola o resultado no campo "Smoke test" do PR template

## Comunicação

- **Português** ou **inglês**, ambos funcionam
- Comentários em PRs/issues: direto, sem rodeios
- Se travar em algo, abre uma issue de discussão antes de gastar tempo

## Reportando bugs

Abre uma [issue](https://github.com/leonardocandiani/setup-projeto-qualidade/issues/new?template=bug_report.md) com:

- Stack do projeto-alvo (Node? Python? Monorepo?)
- Output completo do erro
- Comando exato que disparou
- O que esperava que acontecesse

## Sugerindo features

Abre uma [issue](https://github.com/leonardocandiani/setup-projeto-qualidade/issues/new?template=feature_request.md) descrevendo:

- Problema que resolve
- Como você imagina a solução
- Alternativas que considerou

## Código de Conduta

Esse projeto adere ao [Code of Conduct](CODE_OF_CONDUCT.md). Ao participar, você se compromete a seguir esses termos.
