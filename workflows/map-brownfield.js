// keepwright — map-brownfield
// Runs (situationally) when targeting a large/existing repo. Fans out parallel
// read-only analyses of the repo, then synthesizes a config enrichment that the
// setup wizard merges into keepwright.config.json. Multi-agent, so it costs
// tokens — the command only triggers it for non-trivial repos.

export const meta = {
  name: 'map-brownfield',
  description: 'Map a brownfield repo in parallel and synthesize a keepwright config enrichment',
  phases: [
    { title: 'Scan', detail: 'analyze repo dimensions in parallel' },
    { title: 'Synthesize', detail: 'merge findings into a config enrichment' },
  ],
}

const DIMENSIONS = [
  { key: 'structure', focus: 'the directory structure and the real architectural layers (e.g. routes -> actions -> lib -> db). Name the layers as they actually exist.' },
  { key: 'stack', focus: 'the full stack: language, framework, package manager, build tooling, test framework. Pick ONE primary stack label.' },
  { key: 'ci', focus: 'existing CI/CD: .github/workflows, git hooks (husky/lefthook), and deploy config (vercel.json, supabase, Dockerfile, static hosting).' },
  { key: 'critical', focus: 'the critical files a reviewer must watch: schemas/types, auth, core runtime, message/senders, anything load-bearing.' },
  { key: 'conventions', focus: 'recurring design conventions AND writing voice (naming, error handling, commit style, UI copy tone) that the repo consistently follows.' },
]

const SCAN_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    findings: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'findings'],
}

phase('Scan')
const scans = await parallel(
  DIMENSIONS.map((d) => () =>
    agent(
      `You are analyzing the git repository in the current working directory (READ-ONLY). ` +
        `Focus on: ${d.focus}\n` +
        `Use Read/Grep/Glob (and git log via Bash if available) to inspect ACTUAL files. ` +
        `Cite real paths. Report only what the repo truly does, not what it should do. ` +
        `Return a terse summary plus a list of concrete findings.`,
      { label: `scan:${d.key}`, phase: 'Scan', schema: SCAN_SCHEMA }
    ).then((r) => ({ key: d.key, ...r }))
  )
)

const scanText = scans
  .filter(Boolean)
  .map((s) => `### ${s.key}\n${s.summary}\n- ${(s.findings || []).join('\n- ')}`)
  .join('\n\n')

phase('Synthesize')
const ENRICH_SCHEMA = {
  type: 'object',
  properties: {
    stack: { type: 'string' },
    layers: { type: 'array', items: { type: 'string' } },
    deploy: { type: 'string', enum: ['vercel', 'supabase-functions', 'docker-ghcr', 'npm-publish', 'static-pages', 'none'] },
    criticalFiles: { type: 'array', items: { type: 'string' } },
    derivedPatterns: {
      type: 'object',
      properties: {
        design: { type: 'array', items: { type: 'string' } },
        voice: { type: 'array', items: { type: 'string' } },
      },
    },
    notes: { type: 'string' },
  },
  required: ['stack', 'layers', 'deploy'],
}

const enrichment = await agent(
  `Synthesize the parallel repo analyses below into a keepwright config enrichment that conforms to the schema. ` +
    `Choose the single best stack label and deploy variant, the real architectural layers, the critical files, ` +
    `and the design + voice conventions worth enforcing. Be decisive.\n\n${scanText}`,
  { label: 'synthesize', phase: 'Synthesize', schema: ENRICH_SCHEMA }
)

return enrichment
