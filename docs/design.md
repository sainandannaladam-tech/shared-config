# Design

Low-level design of the shared setup (PLAT-52). The coding standards it
enforces are in the workspace's `docs/coding-standards.md`.

## Purpose and Stories

PLAT-52: the same Prettier settings in every repository, and the same lint
and TypeScript rules, with a check that fails when a repository drifts.

## Interfaces

- `@sainandannaladam-tech/shared-config/prettier` - `prettier.json`
- `@sainandannaladam-tech/shared-config/tsconfig` - `tsconfig.base.json`
- `@sainandannaladam-tech/shared-config/eslint` -
  `createEslintConfig(rootDirectory)`, returning the ESLint flat config
- `shared-config-verify` - command run in a consumer's root; exit code 0 when
  the repository uses the shared setup, 1 with a list of differences

## Data

None. The drift check reads the consumer's root files only: `package.json`,
`eslint.config.js`, `tsconfig*.json` and the names of other config files.

## Steps

The drift check, `checkConsumer`:

1. `package.json` has `"prettier"` set to the shared reference, and any
   shared tool it lists has exactly the shared version.
2. No other Prettier config file (`.prettierrc*`, `prettier.config.*`).
3. `eslint.config.js` is exactly the two fixed lines (line endings ignored);
   no other ESLint config file.
4. `tsconfig.json` extends the shared base; no `tsconfig*.json` sets an
   option that the base sets.

## Errors and limits

- A `tsconfig*.json` that is not plain JSON (for example with comments) is
  reported, because comments are not allowed and the check must parse it.
- Only the repository root is checked; config files in subfolders are not.

## Tests

- Unit: the no-comments rule (`RuleTester`), the full ESLint setup on a
  fixture project, every drift case of `checkConsumer`, and that the tool
  versions are exact and consistent.
- End to end: temporary consumer repositories that install this package by
  a link, then run the real Prettier, TypeScript, ESLint and
  `shared-config-verify` in them. Two consumers format the same file to the
  same result.

## Decisions

- **Tool versions are exact peer dependencies.** Installing the package
  brings the same Prettier, ESLint, typescript-eslint and TypeScript
  versions everywhere, and npm refuses an install with a different version.
  The same Prettier settings with a different Prettier version can format
  differently, so the version is part of the setting.
- **TypeScript 6.0, not 7.** typescript-eslint 8 supports TypeScript up to
  6.0. Move to 7 when typescript-eslint supports it.
- **Comments that switch rules off are ignored** (`noInlineConfig`).
  Otherwise one `/* eslint-disable */` line would also switch off the
  no-comments rule for the whole file.
- **`node:test`'s `describe`, `it`, `suite` and `test` are allowed without
  `await`** in the floating-promise rule, as typescript-eslint documents:
  they return promises that the test runner handles.
- **`dist/` is committed.** Consumers install with `npm ci --ignore-scripts`,
  and npm 11 asks for approval before running a dependency's build script,
  so a build at install time would not run. GitHub's check fails when the
  committed `dist/` differs from a fresh build.
- **The shared TypeScript base sets only strictness and module-safety
  options,** not `module`, `target`, `lib` or `types`: those depend on where
  the code runs (Node.js or a browser) and stay in each repository.
- **No Prettier ignore check.** A repository may have its own
  `.prettierignore`, because which files are generated differs per
  repository.
