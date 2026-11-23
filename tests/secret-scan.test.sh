#!/usr/bin/env bash
set -uo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
scan="$repo_root/scripts/secret-scan.sh"
failures=0
scratch="$(mktemp -d)"
trap 'rm -rf "$scratch"' EXIT

random_text() {
  LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c "$1"
}

fake_github_token() {
  printf 'ghp_%s' "$(random_text 36)"
}

fake_private_key() {
  local kind="RSA"
  printf -- '-----BEGIN %s %s-----\n' "$kind" "PRIVATE KEY"
  for _ in 1 2 3 4; do printf '%s\n' "$(random_text 64)"; done
  printf -- '-----END %s %s-----\n' "$kind" "PRIVATE KEY"
}

fake_env_line() {
  printf 'SERVICE_API_TOKEN=%s\n' "$(random_text 40)"
}

new_repo() {
  local name="$1"
  local dir="$scratch/$name"
  git init -q "$dir"
  git -C "$dir" config user.email "test@example.invalid"
  git -C "$dir" config user.name "secret-scan test"
  git -C "$dir" config core.autocrlf false
  git -C "$dir" commit -q --allow-empty -m "start"
  echo "$dir"
}

commit_file() {
  local dir="$1" file="$2" content="$3"
  printf '%s' "$content" >"$dir/$file"
  git -C "$dir" add "$file"
  git -C "$dir" commit -q -m "add $file"
}

scan_new_commits() {
  local dir="$1"
  shift
  (cd "$dir" && "$scan" "HEAD~1..HEAD" "$@")
}

pass() { echo "PASS: $1"; }
fail() { echo "FAIL: $1"; failures=$((failures + 1)); }

expect_clean() {
  local name="$1" file="$2" content="$3"
  local dir output
  dir="$(new_repo "$name")"
  commit_file "$dir" "$file" "$content"
  if output="$(scan_new_commits "$dir" 2>&1)"; then
    pass "$name passes the scan"
  else
    fail "$name should pass the scan"
    echo "$output"
  fi
}

expect_caught() {
  local name="$1" file="$2" content="$3" secret="$4"
  local dir output
  dir="$(new_repo "$name")"
  commit_file "$dir" "$file" "$content"
  if output="$(scan_new_commits "$dir" 2>&1)"; then
    fail "$name should be caught"
    return
  fi
  pass "$name is caught"
  grep -q "File:.*$file" <<<"$output" && pass "$name report names the file" || fail "$name report should name the file"
  grep -q "Line:" <<<"$output" && pass "$name report names the line" || fail "$name report should name the line"
  if grep -qF "$secret" <<<"$output"; then
    fail "$name report must not show the secret"
  else
    pass "$name report does not show the secret"
  fi
}

expect_allowed_when_listed() {
  local dir token report fingerprint output
  dir="$(new_repo allow-list)"
  token="$(fake_github_token)"
  commit_file "$dir" "config.txt" "token=$token"$'\n'
  report="$scratch/allow-list-report.json"
  scan_new_commits "$dir" --report-format json --report-path "$report" >/dev/null 2>&1
  fingerprint="$(grep -o '"Fingerprint": *"[^"]*"' "$report" | head -1 | sed 's/.*: *"\(.*\)"/\1/')"
  if [[ -z "$fingerprint" ]]; then
    fail "allow-list test could not read a fingerprint"
    return
  fi
  echo "$fingerprint" >"$dir/.gitleaksignore"
  if output="$(scan_new_commits "$dir" 2>&1)"; then
    pass "a finding listed in .gitleaksignore is allowed"
  else
    fail "a finding listed in .gitleaksignore should be allowed"
    echo "$output"
  fi
}

expect_push_guarded() {
  local dir remote output
  dir="$(new_repo push-guard)"
  remote="$scratch/push-guard-remote.git"
  git init -q --bare "$remote"
  git -C "$dir" remote add origin "$remote"
  git -C "$dir" config core.hooksPath "$repo_root/scripts/git-hooks"
  git -C "$dir" push -q origin HEAD:main 2>/dev/null

  commit_file "$dir" "clean.md" "Nothing secret here."$'\n'
  if (cd "$dir" && git push -q origin HEAD:main >/dev/null 2>&1); then
    pass "a clean push goes through the pre-push hook"
  else
    fail "a clean push should go through the pre-push hook"
  fi

  commit_file "$dir" "leak.json" "{\"token\": \"$(fake_github_token)\"}"$'\n'
  if output="$(cd "$dir" && git push origin HEAD:main 2>&1)"; then
    fail "a push with a secret should be stopped"
  else
    grep -q "Push stopped" <<<"$output" && pass "a push with a secret is stopped before it reaches the remote" || fail "the stopped push should explain why"
  fi
  if git -C "$remote" log --oneline main | grep -q "add leak.json"; then
    fail "the leaking commit must not reach the remote"
  else
    pass "the leaking commit never reached the remote"
  fi
}

github_token="$(fake_github_token)"
private_key="$(fake_private_key)"
env_line="$(fake_env_line)"
env_secret="${env_line#SERVICE_API_TOKEN=}"

expect_clean "clean change" "notes.md" "Plain notes with no secrets."$'\n'
expect_caught "github token" "settings.json" "{\"token\": \"$github_token\"}"$'\n' "$github_token"
expect_caught "private key" "deploy.pem" "$private_key" "$(sed -n 2p <<<"$private_key")"
expect_caught "env file" ".env" "$env_line" "$env_secret"
expect_allowed_when_listed
expect_push_guarded

if [[ $failures -gt 0 ]]; then
  echo "$failures check(s) failed"
  exit 1
fi
echo "All secret-scan checks passed"
