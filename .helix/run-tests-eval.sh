#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

cleanup() {
  if [[ -n "${INDEX_TEST_BACKUP:-}" && -f "$INDEX_TEST_BACKUP" ]]; then
    mv "$INDEX_TEST_BACKUP" index-test.cjs
  fi
}
trap cleanup EXIT

run_karma() {
  npx karma start .helix/karma.docker.conf.cjs
}

if [[ $# -eq 0 ]]; then
  run_karma
  exit 0
fi

RESOLVED_FILES_JSON="$(node .helix/resolve-tests.cjs "$REPO_ROOT" "$1")"
mapfile -t RESOLVED_FILES < <(node -e "JSON.parse(process.argv[1]).forEach((f) => console.log(f))" "$RESOLVED_FILES_JSON")

INDEX_TEST_BACKUP="$(mktemp /tmp/index-test.cjs.helix-backup.XXXXXX)"
cp index-test.cjs "$INDEX_TEST_BACKUP"

{
  echo '"use strict";'
  for test_file in "${RESOLVED_FILES[@]}"; do
    echo "require('${test_file}');"
  done
} >index-test.cjs

run_karma
