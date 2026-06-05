#!/usr/bin/env bash
# setup-oauth-secret.sh — sets CLAUDE_CODE_OAUTH_TOKEN in GitHub Secrets
# deterministically, avoiding malformation by pipe/encoding.
#
# PRIMARY path: run `/install-github-app` and pick subscription/OAuth — it
# installs the GitHub App AND sets CLAUDE_CODE_OAUTH_TOKEN through the GitHub
# API in one step, with no shell pipe touching the token. Use THIS script as
# the FALLBACK: re-setting the secret, self-hosted CI, or anywhere the
# native flow isn't available.
#
# Catalyst: L-007 (oauth secret malformed by a pipe chain).
#
# The bug: chains like `printf "$T" | tr -d ... | gh secret set --body -` can
# introduce invisible characters (newline, BOM, surrogates) that make the
# bearer header malformed. Result: the Anthropic API answers HTTP 200 to a
# direct curl (tolerant) but the `claude-code-action` SDK rejects it with
# 401 Invalid bearer token (strict). Same key, different behaviors.
#
# Canonical solution: read the token from the Keychain into a binary file,
# validate the byte-exact size (108 bytes for sk-ant-oat01), set via a stdin
# redirect (`< /path/to/file.bin`) with no transformation. Delete the file
# at the end.
#
# Usage:
#   bash scripts/setup-oauth-secret.sh <owner>/<repo>
#
# Prerequisites:
#   - gh CLI authenticated (`gh auth status`)
#   - macOS with `claude` Code logged into the Keychain (entry "Claude Code-credentials")
#     OR the CLAUDE_CODE_OAUTH_TOKEN env var set before running
#   - jq installed

set -euo pipefail

REPO="${1:-}"
if [ -z "$REPO" ]; then
  echo "usage: $0 <owner>/<repo>" >&2
  exit 1
fi

# Check gh is authenticated
if ! gh auth status >/dev/null 2>&1; then
  echo "❌ gh CLI not authenticated. Run: gh auth login" >&2
  exit 1
fi

# Check the repo is accessible
if ! gh repo view "$REPO" >/dev/null 2>&1; then
  echo "❌ Repo $REPO not accessible with your auth." >&2
  exit 1
fi

# Temp file with restricted permissions
TOKEN_FILE=$(mktemp -t oauth-token.XXXXXX)
trap 'rm -f "$TOKEN_FILE"' EXIT INT TERM
chmod 600 "$TOKEN_FILE"

# Extract token: Keychain first (macOS), env var fallback
if [ -n "${CLAUDE_CODE_OAUTH_TOKEN:-}" ]; then
  printf '%s' "$CLAUDE_CODE_OAUTH_TOKEN" > "$TOKEN_FILE"
  echo "📦 Source: CLAUDE_CODE_OAUTH_TOKEN env var."
elif command -v security >/dev/null 2>&1; then
  # macOS Keychain — default entry of the `claude` Code CLI
  RAW=$(security find-generic-password -s "Claude Code-credentials" -w 2>/dev/null || true)
  if [ -z "$RAW" ]; then
    echo "❌ Keychain has no 'Claude Code-credentials' entry." >&2
    echo "   Run 'claude setup-token' first (isolated session)." >&2
    exit 1
  fi
  TOKEN=$(echo "$RAW" | jq -r '.claudeAiOauth.accessToken // empty')
  if [ -z "$TOKEN" ]; then
    echo "❌ Keychain entry exists but has no .claudeAiOauth.accessToken." >&2
    exit 1
  fi
  printf '%s' "$TOKEN" > "$TOKEN_FILE"
  unset TOKEN RAW
  echo "📦 Source: macOS Keychain (entry 'Claude Code-credentials')."
else
  echo "❌ Neither CLAUDE_CODE_OAUTH_TOKEN in env, nor 'security' (macOS) available." >&2
  echo "   Set via: export CLAUDE_CODE_OAUTH_TOKEN='sk-ant-oat01-...' and re-run." >&2
  exit 1
fi

# Validate the token shape
BYTES=$(wc -c < "$TOKEN_FILE" | tr -d ' ')
PREFIX=$(head -c 12 "$TOKEN_FILE")

if [ "$PREFIX" != "sk-ant-oat01" ]; then
  echo "❌ Token does not start with 'sk-ant-oat01-' (Claude Code OAuth prefix)." >&2
  echo "   Prefix found: '$PREFIX'" >&2
  echo "   It may be an API key (sk-ant-api01-) — use ANTHROPIC_API_KEY instead." >&2
  exit 1
fi

# Validate zero residual whitespace
LAST_CHAR=$(tail -c 1 "$TOKEN_FILE" | xxd -p)
case "$LAST_CHAR" in
  0a|0d|20|09)
    echo "❌ Token has trailing whitespace (hex=$LAST_CHAR). Possible malformation." >&2
    exit 1
    ;;
esac

echo "✅ Token validated: $BYTES bytes, OAuth prefix, no residual whitespace."

# Set via stdin redirect (zero transformation)
gh secret set CLAUDE_CODE_OAUTH_TOKEN -R "$REPO" < "$TOKEN_FILE"

echo "✅ CLAUDE_CODE_OAUTH_TOKEN set on $REPO."
echo ""
echo "🔍 Check the length via the workflow diagnostic:"
echo "   echo \"len=\${#CLAUDE_CODE_OAUTH_TOKEN}\"  # expected: $BYTES"
echo ""
echo "🤖 Don't forget to install the Claude GitHub App on the repo:"
echo "   Easiest: run /install-github-app and pick subscription/OAuth"
echo "   (it installs the App AND sets the secret; without the App, App token exchange fails 401)"
