# shared-config

The one shared Prettier, ESLint and TypeScript setup, installed by every
repository by a pinned git tag. Consumers: `shared-factory` and every new
repository (workspace `docs/adding-a-repo.md`).

## Commands

Run from the repository root (Git Bash on Windows, or Linux), Node.js 26.

- Install: `npm ci` and once `bash scripts/setup.sh` (pinned secret scanner
  and the pre-push scan)
- Test: `npm test` (unit), `npm run test:e2e` (end to end), `bash tests/run.sh`
  (secret scan)
- Lint/format: `npm run lint`, `npm run format:check`, `npm run format`
- Everything: `npm run check` (build, type check, lint, format, all tests)
- Build: `npm run build`, then commit `dist/`

## Layout

- `prettier.json`, `tsconfig.base.json` - the shared settings, used as they are
- `src/eslint/` - the ESLint setup and the no-comments rule
- `src/verify/` - the drift check `shared-config-verify`
- `dist/` - the built JavaScript, committed so consumers need no build step
- `tests/unit/`, `tests/e2e/` - `node:test` suites; the end-to-end tests set
  up temporary consumer repositories and run the real tools in them
- `tests/fixtures/` - small projects the tests lint
- `scripts/`, `tests/*.test.sh` - the secret scan (canonical copy: workspace)
- `docs/design.md` - why it works this way

## Conventions

- Every change to a setting is a new version: rebuild and commit `dist/`,
  and after the merge tag it (`v<major>.<minor>.<patch>`). A setting that
  makes existing code fail is a new major version.
- Tool versions are exact and the same in `peerDependencies` and
  `devDependencies` (a test checks it). A new tool needs the owner's approval
  (rule S5).
- Branches, pull request titles and commits carry the Jira key, as in every
  repository (`PLAT-<n>-<short-description>`, `[PLAT-<n>] ...`).
  Agent-written text starts with the role tag `[BA]`, `[Dev]` or `[QA]`.

## Gotchas and boundaries

- The repository is **public**: never put product code, product knowledge or
  anything secret here.
- `.github/workflows/jira-key.yml`, `secret-scan.yml` and the secret-scan
  scripts are copies of the workspace's canonical files; change them there
  first.
- `eslint.config.js` here loads `./dist/`, so run `npm run build` before
  `npm run lint`; `npm run check` does it in the right order.

## Related repos

- `workspace` - registers this repository; holds the coding standards that
  these settings enforce (`docs/coding-standards.md`).
- `shared-factory` - the first consumer.
