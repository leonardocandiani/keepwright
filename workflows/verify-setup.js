// keepwright — verify-setup
// Adversarial, parallel verification of a freshly applied setup. Each dimension
// is attacked by an independent agent told to assume it's broken until proven
// otherwise. This is the "Code Review Director" as a workflow — runs after
// apply (and is what /keepwright:audit can escalate to).

export const meta = {
  name: 'keepwright-verify-setup',
  description: 'Adversarially verify a freshly applied keepwright setup in parallel',
  phases: [
    { title: 'Probe', detail: 'each dimension is attacked by an independent agent' },
    { title: 'Verdict', detail: 'consolidate into a pass/fail report' },
  ],
}

const PROBES = [
  { key: 'secrets', focus: 'Find ANY committed secret or token-shaped string (sk-ant-, ghp_, pk_live_, sk_live_, sbp_, EAA...). Confirm .gitignore covers env/secret files.' },
  { key: 'equalization', focus: 'Verify CLAUDE.md points to EVERY file under .claude/rules/ and has no dead pointers (the equalization invariant). List every mismatch.' },
  { key: 'workflows', focus: 'Validate every .github/workflows/*.yml: valid YAML, runner matches config, the AI review/mention steps carry continue-on-error, and the auth secret is referenced correctly (claude_code_oauth_token or anthropic_api_key).' },
  { key: 'validators', focus: 'Check scripts/validators/* exist and are actually wired into ci.yml, and that git hooks (lefthook) are present and reference them.' },
  { key: 'hierarchy', focus: 'Scan CLAUDE.md + rules for the P1-P5 epistemic hierarchy and the merge-safety invariant; flag any rule that inverts P5 over P1, or any missing load-bearing invariant.' },
]

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    pass: { type: 'boolean' },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['critical', 'warning', 'nit'] },
          detail: { type: 'string' },
          path: { type: 'string' },
        },
        required: ['severity', 'detail'],
      },
    },
  },
  required: ['pass', 'issues'],
}

phase('Probe')
const probed = await parallel(
  PROBES.map((p) => () =>
    agent(
      `Adversarially verify the keepwright setup in the current working directory. Your dimension: ${p.focus}\n` +
        `Assume it is WRONG until the actual files prove otherwise. Read real files (Read/Grep/Glob). ` +
        `Return pass=false if you find any critical issue, and list every issue with severity and path.`,
      { label: `probe:${p.key}`, phase: 'Probe', schema: VERDICT_SCHEMA }
    ).then((r) => ({ dimension: p.key, ...r }))
  )
)

phase('Verdict')
const all = probed.filter(Boolean)
const issues = all.flatMap((p) => (p.issues || []).map((i) => ({ dimension: p.dimension, ...i })))
const critical = issues.filter((i) => i.severity === 'critical')

return {
  pass: critical.length === 0,
  dimensions: all.map((p) => ({ dimension: p.dimension, pass: p.pass })),
  critical,
  issues,
}
