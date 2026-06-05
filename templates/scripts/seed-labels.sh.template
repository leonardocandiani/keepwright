#!/usr/bin/env bash
#
# seed-labels.sh — create the keepwright triage labels in a repo, idempotently.
#
# The issue-triage workflow only ever applies labels that ALREADY EXIST (its
# allowlist is the live `gh label list`); it never creates labels, so its blast
# radius stays minimal. This script is the deterministic, human-run counterpart
# that seeds the few keepwright-specific labels once at setup time.
#
# GitHub's default labels (bug, enhancement, documentation, question, duplicate)
# already exist in every repo, so triage matches those out of the box — this only
# adds the labels GitHub does not ship.
#
# Usage:  bash scripts/seed-labels.sh [owner/repo]
#         (repo defaults to the current directory's GitHub remote)
#
# Re-running is safe: `--force` updates an existing label instead of erroring.

set -euo pipefail

REPO="${1:-}"
if [ -z "$REPO" ]; then
  REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
fi

echo "Seeding keepwright triage labels in $REPO ..."

# name|color(hex, no #)|description
LABELS="
needs-triage|ededed|Awaiting maintainer triage
needs-info|d4c5f9|More information needed from the reporter before this is actionable
"

while IFS='|' read -r name color desc; do
  [ -z "$name" ] && continue
  gh label create "$name" --repo "$REPO" --color "$color" --description "$desc" --force
  echo "  ✓ $name"
done <<< "$LABELS"

echo "Done. The issue-triage workflow can now apply these advisory labels."
