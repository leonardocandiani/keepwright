# Contributing

Thanks for considering a contribution. keepwright is open source (MIT) and PRs
are welcome.

## Before opening a PR

1. **Check for an existing issue or PR** on the same topic.
2. **Open an issue before large changes** — let's align before you spend time.
3. **Read [README.md](README.md)** to understand the three layers (wizard,
   engine, workflows) and the commands.
4. **Read [CHANGELOG.md](CHANGELOG.md)** to see what's planned.

## Local setup

```bash
git clone https://github.com/leonardocandiani/keepwright
cd keepwright
```

No build step — the plugin is markdown + templates. Edit the relevant files
under `templates/`, then test by installing the plugin and running
`/keepwright:setup` in a throwaway project.

## Repo structure

```
.
├── README.md              # public docs
├── CHANGELOG.md           # versioned history
├── CONTRIBUTING.md         # this file
├── LICENSE                # MIT
└── templates/             # everything the plugin installs
    ├── CLAUDE.md.template
    ├── settings.json.template
    ├── lefthook.yml.template
    ├── PULL_REQUEST_TEMPLATE.md.template
    ├── rules/             # structured rules
    ├── agents/
    ├── workflows/         # CI + auto-review + auto-merge + deploys
    ├── validators/
    ├── hooks/
    └── scripts/
```

## Conventional Commits (required)

```
feat(rules): add rule 09-rollback-protocol
fix(validators): fix OAuth token detection regex
docs: improve deploy matrix section in the README
chore(deps): bump lefthook 1.7.x
refactor(engine): merge validator setup into one step
```

Accepted types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`,
`perf`, `template`.

**Never mention AI/Claude in commits.** The author is always the human maintainer.

## Change patterns

### Changing a rule

- Edit the file in `templates/rules/XX-name.md.template`.
- **Check that the pointer exists in `templates/CLAUDE.md.template`.**
- If it's a new rule, add the pointer.
- Update CHANGELOG under the current release.

### Changing a workflow template

- Edit `templates/workflows/<name>.yml.template`.
- Sanity-check the YAML with placeholders filled in.
- Recommended: run `actionlint` on the rendered YAML locally.
- Update CHANGELOG.

### Adding a deploy variant

- Create `templates/workflows/deploy/<stack>.yml.template`.
- Update the deploy matrix in `README.md`.
- Update CHANGELOG.

### Adding a validator

- Create `templates/validators/<name>.ts.template`.
- Document what it checks in the README.
- Update CHANGELOG.

## PR principles

1. **Equalization**: a new rule or a moved template means an update to
   `CLAUDE.md.template` in the same PR.
2. **Catalysis**: a non-trivial change needs a CHANGELOG entry.
3. **No AI mentions** in commits, code, or docs.
4. **No secrets** — CI greps aggressively, but check before you push.

## Smoke test before requesting review

Before marking a PR ready for review:

1. Install the PR version of the plugin in a throwaway project.
2. Run `/keepwright:setup`.
3. Confirm stack detection is correct.
4. If you touched a specific phase, validate just that one.
5. Paste the result into the "Smoke test" field of the PR template.

## Communication

- **English** preferred. Direct, no fluff.
- If you get stuck, open a discussion issue before spending time.

## Reporting bugs

Open an [issue](https://github.com/leonardocandiani/keepwright/issues/new?template=bug_report.md)
with:

- Target project stack (Node? Python? Monorepo?)
- Full error output
- The exact command that triggered it
- What you expected to happen

## Suggesting features

Open an [issue](https://github.com/leonardocandiani/keepwright/issues/new?template=feature_request.md)
describing:

- The problem it solves
- How you imagine the solution
- Alternatives you considered

## Code of Conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md). By participating,
you agree to its terms.
