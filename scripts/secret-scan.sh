#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: scripts/secret-scan.sh <git-log-range> [extra gitleaks options]" >&2
  echo "Example: scripts/secret-scan.sh origin/main..HEAD" >&2
  exit 2
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
range="$1"
shift

gitleaks_binary() {
  local candidate
  for candidate in "$repo_root/.tools/gitleaks" "$repo_root/.tools/gitleaks.exe"; do
    [[ -x "$candidate" ]] && { echo "$candidate"; return 0; }
  done
  echo "gitleaks is not installed: run scripts/setup.sh" >&2
  return 1
}

binary="$(gitleaks_binary)"
"$binary" git \
  --config "$repo_root/.gitleaks.toml" \
  --log-opts "$range" \
  --redact \
  --verbose \
  --no-banner \
  "$@" \
  .
