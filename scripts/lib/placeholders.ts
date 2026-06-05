/**
 * placeholders.ts
 *
 * Placeholder substitution for keepwright templates.
 *
 * Templates carry two kinds of `{{TOKEN}}`:
 *   - config-derived tokens (PROJECT, REPO, STACK, ...) — filled from the
 *     keepwright config here;
 *   - free-text tokens (ARCHITECTURE, DESCRIPTION, lesson narrative, ...) — the
 *     maintainer fills these by hand after install.
 *
 * We only replace tokens we KNOW. Unknown `{{...}}` are left intact on purpose
 * so the human can spot and fill them. This also keeps GitHub Actions
 * expressions (`${{ secrets.X }}`, `${{ github.event... }}`) untouched, since
 * those keys are never in our map.
 */

export interface KeepwrightConfig {
  project: string;
  repo: string;
  repoOwner?: string;
  maintainer?: string;
  language?: string;
  mode?: "setup" | "audit" | "maintain";
  stack: string;
  layers?: string[];
  deploy:
    | "vercel"
    | "supabase-functions"
    | "docker-ghcr"
    | "npm-publish"
    | "static-pages"
    | "none";
  runner?: "self-hosted" | "github";
  auth?: "oauth" | "apikey";
  criticalFiles?: string[];
  customValidators?: string[];
  issues?: {
    /** Issue triage workflow. `github-models` runs free in Actions; `off` disables it. */
    triage?: "off" | "github-models";
    /** GitHub Models model id for the classify step. */
    model?: string;
  };
  derivedPatterns?: {
    design?: string[];
    voice?: string[];
  };
}

/** Recommended Claude model for the AI review/mention workflows. */
export const DEFAULT_REVIEW_MODEL = "claude-opus-4-8[1m]";

/** Derive repoOwner from `owner/name` when not set explicitly. */
function ownerOf(config: KeepwrightConfig): string {
  if (config.repoOwner) return config.repoOwner;
  const slash = config.repo.indexOf("/");
  return slash > 0 ? config.repo.slice(0, slash) : config.repo;
}

/**
 * Build the token → value map for a config. Only config-derivable tokens are
 * present; everything else stays as a literal `{{TOKEN}}` in the output.
 */
export function buildPlaceholderMap(
  config: KeepwrightConfig,
): Record<string, string> {
  const today = new Date().toISOString().slice(0, 10);
  const crit = config.criticalFiles ?? [];
  return {
    PROJECT: config.project,
    PROJECT_UPPER: config.project.toUpperCase(),
    REPO: config.repo,
    REPO_OWNER: ownerOf(config),
    MAINTAINER: config.maintainer ?? ownerOf(config),
    STACK: config.stack,
    LAYERS_REF: (config.layers ?? []).join(", "),
    REVIEW_MODEL: DEFAULT_REVIEW_MODEL,
    // GitHub Actions runner. self-hosted only when the config asks for it;
    // otherwise the generic GitHub-hosted runner, so workflows run in any repo.
    RUNNER: config.runner === "self-hosted" ? "[self-hosted, linux, x64]" : "ubuntu-latest",
    // Issue triage. `github-models` runs the classifier free in Actions over the
    // GITHUB_TOKEN; `off` makes the triage workflow a no-op via its top-level if.
    ISSUES_TRIAGE: config.issues?.triage ?? "github-models",
    TRIAGE_MODEL: config.issues?.model ?? "openai/gpt-4o-mini",
    CURRENT_DATE: today,
    DATE_YYYY_MM_DD: today,
    DATE: today,
    // criticalFiles[0..1] feed the PR auto-review grep patterns. Left as a
    // literal {{CRITICAL_FILE_n}} for the maintainer to fill when unset.
    ...(crit[0] ? { CRITICAL_FILE_1: crit[0] } : {}),
    ...(crit[1] ? { CRITICAL_FILE_2: crit[1] } : {}),
  };
}

/**
 * Substitute known placeholders in `text`. Unknown `{{TOKEN}}` are preserved.
 */
export function substitute(text: string, config: KeepwrightConfig): string {
  const map = buildPlaceholderMap(config);
  // Match {{ NAME }} with optional inner spacing, uppercase + underscore only.
  // GitHub Actions expressions use `${{ ... }}` (leading `$`) and lowercase
  // dotted keys, so they never match this and never live in our map anyway.
  return text.replace(/\{\{\s*([A-Z][A-Z0-9_]*)\s*\}\}/g, (whole, key) => {
    return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : whole;
  });
}
