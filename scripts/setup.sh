#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

chmod +x scripts/*.sh scripts/git-hooks/* tests/*.sh
scripts/install-gitleaks.sh
git config core.hooksPath scripts/git-hooks
echo "Setup complete: gitleaks installed, the secret scan runs before every push."
