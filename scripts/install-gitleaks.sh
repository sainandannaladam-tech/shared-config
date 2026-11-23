#!/usr/bin/env bash
set -euo pipefail

readonly VERSION="8.30.1"
readonly SHA256_LINUX_X64="551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb"
readonly SHA256_WINDOWS_X64="d29144deff3a68aa93ced33dddf84b7fdc26070add4aa0f4513094c8332afc4e"
readonly RELEASES="https://github.com/gitleaks/gitleaks/releases/download"

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tools_dir="$repo_root/.tools"

platform_asset() {
  case "$(uname -s)-$(uname -m)" in
    Linux-x86_64) echo "gitleaks_${VERSION}_linux_x64.tar.gz ${SHA256_LINUX_X64} gitleaks" ;;
    MINGW*-x86_64 | MSYS*-x86_64) echo "gitleaks_${VERSION}_windows_x64.zip ${SHA256_WINDOWS_X64} gitleaks.exe" ;;
    *) echo "Unsupported platform: $(uname -s)-$(uname -m)" >&2; return 1 ;;
  esac
}

installed_version() {
  local binary="$1"
  [[ -x "$binary" ]] && "$binary" version 2>/dev/null | tr -d 'v\r' || true
}

extract() {
  local archive="$1" destination="$2"
  case "$archive" in
    *.tar.gz) tar -xzf "$archive" -C "$destination" ;;
    *.zip) unzip -qo "$archive" -d "$destination" ;;
  esac
}

main() {
  local asset checksum binary_name
  read -r asset checksum binary_name < <(platform_asset)
  local binary="$tools_dir/$binary_name"

  if [[ "$(installed_version "$binary")" == "$VERSION" ]]; then
    echo "gitleaks $VERSION already installed at $binary"
    return 0
  fi

  download_dir="$(mktemp -d)"
  trap 'rm -rf "${download_dir:-}"' EXIT

  curl -fsSL -o "$download_dir/$asset" "$RELEASES/v${VERSION}/$asset"
  echo "$checksum  $download_dir/$asset" | sha256sum --check --quiet - || {
    echo "Checksum mismatch for $asset: refusing to install" >&2
    return 1
  }

  mkdir -p "$tools_dir"
  extract "$download_dir/$asset" "$download_dir"
  mv "$download_dir/$binary_name" "$binary"
  chmod +x "$binary"
  echo "Installed gitleaks $(installed_version "$binary") at $binary"
}

main "$@"
