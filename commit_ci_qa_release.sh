#!/usr/bin/env bash
set -e
BRANCH=${BRANCH:-chore/ci-qa-release}
git checkout -b "$BRANCH" || git checkout "$BRANCH"
git add .github/workflows/ci.yml .github/workflows/release-drafter.yml .github/release-drafter.yml .github/CODEOWNERS .pre-commit-config.yaml pytest.ini vitest.coverage.config.ts SECURITY.md renovate.json
git commit -m "chore: add CI, QA gates, release drafter, security baseline"
git push -u origin "$BRANCH"
if command -v gh >/dev/null 2>&1; then
  gh pr create --fill --head "$BRANCH" || true
  gh pr merge "$BRANCH" --squash --auto || true
fi