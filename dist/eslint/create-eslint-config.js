import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import { noCommentsRule } from "./no-comments.js";
const nodeTestFunctions = {
    from: "package",
    package: "node:test",
    name: ["describe", "it", "suite", "test"],
};
export function createEslintConfig(rootDirectory) {
    return defineConfig({ ignores: ["dist/", "coverage/", ".tools/"] }, eslint.configs.recommended, tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked, {
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
    }, {
        files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
        extends: [tseslint.configs.disableTypeChecked],
    });
}
