# shared-config

One Prettier, ESLint and TypeScript setup for every repository, so code is
formatted, linted and type-checked the same way everywhere.

It holds settings only, no product code, which is why the repository is
public: other repositories and their GitHub checks install it without a
token.

## What is in it

| Part                   | Used by a repository through                           |
| ---------------------- | ------------------------------------------------------ |
| Prettier settings      | `"prettier"` in `package.json`                         |
| ESLint setup           | `eslint.config.js`, two fixed lines                    |
| TypeScript strict base | `"extends"` in `tsconfig.json`                         |
| Tool versions          | installed with this package, exactly the same versions |
| Drift check            | `shared-config-verify`                                 |

The ESLint setup is typescript-eslint's strict, type-aware rules plus one
rule of our own: **no comments** in source code (the first-line `#!` of a
script is allowed). Comments that switch rules off are ignored, so a rule
cannot be disabled from inside a file.

## Use it in a repository

1. Install a released version, pinned by its tag:

   ```
   npm install --save-dev --save-exact "github:sainandannaladam-tech/shared-config#v1.0.0"
   ```

   This also installs the shared versions of Prettier, ESLint,
   typescript-eslint and TypeScript. Do not list other versions of them.

2. In `package.json`:

   ```json
   {
     "prettier": "@sainandannaladam-tech/shared-config/prettier",
     "scripts": {
       "config:check": "shared-config-verify"
     }
   }
   ```

3. `eslint.config.js`, exactly:

   ```js
   import { createEslintConfig } from "@sainandannaladam-tech/shared-config/eslint";

   export default createEslintConfig(import.meta.dirname);
   ```

4. `tsconfig.json` extends the shared base and adds only what depends on
   where the code runs (for example `module`, `target`, `lib`, `types`):

   ```json
   {
     "extends": "@sainandannaladam-tech/shared-config/tsconfig",
     "compilerOptions": {
       "module": "nodenext",
       "target": "es2024",
       "lib": ["es2024"],
       "types": ["node"]
     }
   }
   ```

5. Add `* text=auto eol=lf` to `.gitattributes`, so files have the same line
   endings on Windows and Linux.

6. Run `npm run config:check` as part of `npm run check`. It fails when the
   repository has its own Prettier or ESLint settings, a different
   `eslint.config.js`, a `tsconfig` that does not extend the base or changes
   one of its options, or a different version of a shared tool.

## Release a new version

1. Change the settings in a pull request; `npm run check` passes and
   `dist/` is rebuilt and committed (`npm run build`).
2. After the owner merges, tag the merge commit: `git tag v1.1.0` and
   `git push origin v1.1.0`.
3. In each repository, change the tag in `package.json` and run
   `npm install`.

## Develop

```
npm ci
bash scripts/setup.sh
npm run check
```

See [AGENTS.md](AGENTS.md) for all commands and
[docs/design.md](docs/design.md) for why it works this way.
