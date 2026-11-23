import eslint from "@eslint/js";
import type { Linter } from "eslint";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import { noCommentsRule } from "./no-comments.ts";

const nodeTestFunctions = {
  from: "package",
  package: "node:test",
  name: ["describe", "it", "suite", "test"],
} as const;

export function createEslintConfig(rootDirectory: string): Linter.Config[] {
  return defineConfig(
    { ignores: ["dist/", "coverage/", ".tools/"] },
    eslint.configs.recommended,
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    {
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir: rootDirectory,
        },
      },
      linterOptions: { noInlineConfig: true },
      plugins: {
        "shared-config": { rules: { "no-comments": noCommentsRule } },
      },
      rules: {
        "shared-config/no-comments": "error",
        "@typescript-eslint/no-floating-promises": [
          "error",
          { allowForKnownSafeCalls: [nodeTestFunctions] },
        ],
      },
    },
    {
      files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
      extends: [tseslint.configs.disableTypeChecked],
    },
  );
}
