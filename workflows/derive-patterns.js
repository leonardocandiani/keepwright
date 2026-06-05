// keepwright — derive-patterns
// Mines the repo's actual design conventions and writing VOICE, then codifies
// the recurring ones into enforceable rules and (where mechanically checkable)
// validator specs. The command/apply step writes the returned rules into
// .claude/rules/ and the validator specs into scripts/validators/ — this
// workflow only DERIVES (workflow scripts have no filesystem access; their
// agents read the repo and return structured output).

export const meta = {
  name: 'keepwright-derive-patterns',
  description: "Derive the repo's design + writing-voice patterns and turn them into rules and auto-validator specs",
  phases: [
    { title: 'Observe', detail: 'mine design + voice patterns in parallel' },
    { title: 'Codify', detail: 'turn recurring patterns into rules + validator specs' },
  ],
}

const LENSES = [
  {
    key: 'design',
    focus:
      'design/architecture conventions: naming, module layering, error handling, API boundaries, ' +
      'state management, dependency direction, validation-at-boundaries. What does THIS repo do consistently?',
  },
  {
    key: 'voice',
    focus:
      'writing voice: commit message style, PR/issue tone, code-comment register, UI copy tone, ' +
      'documentation style, and recurring banned or preferred terms. What is THIS repo\'s consistent voice?',
  },
]

const OBS_SCHEMA = {
  type: 'object',
  properties: {
    patterns: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          evidence: { type: 'string' },
          consistency: { type: 'string', enum: ['strong', 'moderate', 'weak'] },
        },
        required: ['name', 'evidence', 'consistency'],
      },
    },
  },
  required: ['patterns'],
}

phase('Observe')
const observed = await parallel(
  LENSES.map((l) => () =>
    agent(
      `READ-ONLY analysis of the repository in the current working directory. Mine its ${l.focus}\n` +
        `Use Read/Grep/Glob and git history (git log via Bash, if available) to find REAL, recurring patterns ` +
        `with evidence — cite paths/commits. Report only patterns the repo actually follows, not ideals. ` +
        `Rate each pattern's consistency: strong / moderate / weak.`,
      { label: `observe:${l.key}`, phase: 'Observe', schema: OBS_SCHEMA }
    ).then((r) => ({ lens: l.key, ...r }))
  )
)

// Only codify patterns the repo follows with at least moderate consistency.
const strong = observed
  .filter(Boolean)
  .flatMap((o) => (o.patterns || []).filter((p) => p.consistency !== 'weak').map((p) => ({ lens: o.lens, ...p })))

if (strong.length === 0) {
  log('No strong/moderate patterns found — nothing to codify.')
  return { observedCount: 0, rules: [], validators: [] }
}

const obsText = strong.map((p, i) => `${i + 1}. [${p.lens}/${p.consistency}] ${p.name} — ${p.evidence}`).join('\n')

phase('Codify')
const CODIFY_SCHEMA = {
  type: 'object',
  properties: {
    rules: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          kind: { type: 'string', enum: ['design', 'voice'] },
          statement: { type: 'string' },
          rationale: { type: 'string' },
        },
        required: ['title', 'kind', 'statement'],
      },
    },
    validators: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          checks: { type: 'string' },
          severity: { type: 'string', enum: ['error', 'warning'] },
        },
        required: ['name', 'checks', 'severity'],
      },
    },
  },
  required: ['rules'],
}

const codified = await agent(
  `Turn these observed, recurring repo patterns into (a) concise, enforceable RULES written in the repo's own terms, ` +
    `and (b) — only where the pattern is MECHANICALLY checkable — VALIDATOR specs (name + exactly what it greps/checks + severity). ` +
    `Do not invent rules the evidence doesn't support. Keep each rule to a couple of lines.\n\nPATTERNS:\n${obsText}`,
  { label: 'codify', phase: 'Codify', schema: CODIFY_SCHEMA }
)

return { observedCount: strong.length, ...codified }
