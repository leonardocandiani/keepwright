/**
 * stacks.ts
 *
 * Stack matrix. Given detected signals, resolve a stack id plus sensible
 * default pipeline layers and a deploy variant. The deploy variant always
 * matches the schema enum (vercel | supabase-functions | docker-ghcr |
 * npm-publish | static-pages | none).
 *
 * This is a default proposal only — detect.ts may override layers/deploy from
 * the real repo structure, and the setup wizard lets the maintainer confirm.
 */

export type Deploy =
  | "vercel"
  | "supabase-functions"
  | "docker-ghcr"
  | "npm-publish"
  | "static-pages"
  | "none";

export type StackId =
  | "nextjs-serverless"
  | "nextjs"
  | "node-cli"
  | "python-fastapi"
  | "deno"
  | "go"
  | "rust"
  | "static-site"
  | "monorepo";

export interface StackProfile {
  stack: StackId;
  defaultLayers: string[];
  defaultDeploy: Deploy;
}

/**
 * Signals collected by detection. All optional — the more we know, the more
 * precise the resolution.
 */
export interface StackSignals {
  hasPackageJson?: boolean;
  hasNextConfig?: boolean;
  hasVercelJson?: boolean;
  /** package.json declared a `bin` field → CLI tool. */
  hasBin?: boolean;
  /** package.json was a library (no app entry, intended for npm). */
  isLibrary?: boolean;
  hasPyproject?: boolean;
  hasRequirements?: boolean;
  /** Detected FastAPI in deps. */
  hasFastapi?: boolean;
  hasDenoJson?: boolean;
  hasGoMod?: boolean;
  hasCargoToml?: boolean;
  hasDockerfile?: boolean;
  hasSupabaseDir?: boolean;
  /** Root has workspaces / multiple packages. */
  isMonorepo?: boolean;
  /** Looks like a plain static site (only html/css/assets, no app framework). */
  isStaticSite?: boolean;
}

const PROFILES: Record<StackId, StackProfile> = {
  "nextjs-serverless": {
    stack: "nextjs-serverless",
    defaultLayers: ["routes", "actions", "lib", "db", "integrations"],
    defaultDeploy: "vercel",
  },
  nextjs: {
    stack: "nextjs",
    defaultLayers: ["routes", "components", "lib", "integrations"],
    defaultDeploy: "vercel",
  },
  "node-cli": {
    stack: "node-cli",
    defaultLayers: ["commands", "lib", "integrations"],
    defaultDeploy: "npm-publish",
  },
  "python-fastapi": {
    stack: "python-fastapi",
    defaultLayers: ["routers", "services", "models", "integrations"],
    defaultDeploy: "docker-ghcr",
  },
  deno: {
    stack: "deno",
    defaultLayers: ["functions", "lib", "integrations"],
    defaultDeploy: "supabase-functions",
  },
  go: {
    stack: "go",
    defaultLayers: ["cmd", "internal", "pkg"],
    defaultDeploy: "docker-ghcr",
  },
  rust: {
    stack: "rust",
    defaultLayers: ["bin", "lib", "modules"],
    defaultDeploy: "docker-ghcr",
  },
  "static-site": {
    stack: "static-site",
    defaultLayers: ["pages", "assets"],
    defaultDeploy: "static-pages",
  },
  monorepo: {
    stack: "monorepo",
    defaultLayers: ["packages", "apps", "shared"],
    defaultDeploy: "none",
  },
};

/** Return the profile for an already-known stack id. */
export function profileOf(stack: StackId): StackProfile {
  return PROFILES[stack];
}

/**
 * Resolve a stack profile from raw signals. Order matters: more specific
 * stacks win over generic ones.
 */
export function resolveStack(signals: StackSignals): StackProfile {
  // Monorepo wins early: its layout dominates whatever a single package says.
  if (signals.isMonorepo) return PROFILES.monorepo;

  // Deno (deno.json) before generic JS; supabase/ reinforces the deploy.
  if (signals.hasDenoJson) {
    const p = PROFILES.deno;
    return signals.hasSupabaseDir
      ? p
      : { ...p, defaultDeploy: signals.hasDockerfile ? "docker-ghcr" : "none" };
  }

  // Python.
  if (signals.hasPyproject || signals.hasRequirements) {
    if (signals.hasFastapi) return PROFILES["python-fastapi"];
    // Generic Python service: docker if containerized, else none.
    return {
      stack: "python-fastapi",
      defaultLayers: PROFILES["python-fastapi"].defaultLayers,
      defaultDeploy: signals.hasDockerfile ? "docker-ghcr" : "none",
    };
  }

  if (signals.hasGoMod) {
    return signals.hasDockerfile
      ? PROFILES.go
      : { ...PROFILES.go, defaultDeploy: "none" };
  }

  if (signals.hasCargoToml) {
    return signals.hasDockerfile
      ? PROFILES.rust
      : { ...PROFILES.rust, defaultDeploy: "none" };
  }

  // JavaScript/TypeScript family.
  if (signals.hasPackageJson) {
    if (signals.hasNextConfig) {
      // Vercel + serverless surface (vercel.json or supabase) → serverless.
      return signals.hasVercelJson || signals.hasSupabaseDir
        ? PROFILES["nextjs-serverless"]
        : PROFILES.nextjs;
    }
    if (signals.hasBin) return PROFILES["node-cli"];
    if (signals.isLibrary) {
      return { ...PROFILES["node-cli"], stack: "node-cli", defaultDeploy: "npm-publish" };
    }
    if (signals.hasDockerfile) {
      return { ...PROFILES["node-cli"], defaultDeploy: "docker-ghcr" };
    }
    // Plain node app without a clear deploy target.
    return { ...PROFILES["node-cli"], defaultDeploy: "none" };
  }

  if (signals.isStaticSite) return PROFILES["static-site"];

  // Nothing recognized: safest neutral profile.
  return { ...PROFILES["static-site"], defaultDeploy: "none" };
}
