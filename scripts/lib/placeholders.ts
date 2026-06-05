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
  return {
    PROJECT: config.project,
    PROJECT_UPPER: config.project.toUpperCase(),
    REPO: config.repo,
    REPO_OWNER: ownerOf(config),
    MAINTAINER: config.maintainer ?? ownerOf(config),
    STACK: config.stack,
    LAYERS_REF: (config.layers ?? []).join(", "),
    REVIEW_MODEL: DEFAULT_REVIEW_MODEL,
    CURRENT_DATE: today,
    DATE_YYYY_MM_DD: today,
    DATE: today,
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
