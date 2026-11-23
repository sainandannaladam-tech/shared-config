import assert from "node:assert/strict";
import { join } from "node:path";
import { describe, it } from "node:test";
import { ESLint } from "eslint";
import { createEslintConfig } from "../../../src/eslint/create-eslint-config.ts";

const fixture = join(
  import.meta.dirname,
  "..",
  "..",
  "fixtures",
  "typed-project",
);
const fixtureFile = join(fixture, "src", "example.ts");

async function ruleIdsFor(
  code: string,
  filePath: string = fixtureFile,
): Promise<readonly (string | null)[]> {
  const eslint = new ESLint({
    cwd: fixture,
    overrideConfigFile: true,
    overrideConfig: createEslintConfig(fixture),
  });
  const results = await eslint.lintText(code, { filePath });
  return results.flatMap((result) =>
    result.messages
      .filter((message) => message.severity === 2)
      .map((message) => message.ruleId),
  );
}

describe("the shared ESLint setup", () => {
  it("passes clean code", async () => {
    assert.deepEqual(await ruleIdsFor("export const answer = 42;\n"), []);
  });

  it("reports a comment", async () => {
    assert.deepEqual(
      await ruleIdsFor("// explained here\nexport const answer = 42;\n"),
      ["shared-config/no-comments"],
    );
  });

  it("cannot be switched off by an eslint-disable comment", async () => {
    assert.deepEqual(
      await ruleIdsFor("/* eslint-disable */\nexport const answer = 42;\n"),
      ["shared-config/no-comments"],
    );
  });

  it("runs the type-aware rules", async () => {
    const code =
      "async function load(): Promise<number> {\n  return Promise.resolve(1);\n}\nload();\n";
    assert.ok(
      (await ruleIdsFor(code)).includes(
        "@typescript-eslint/no-floating-promises",
      ),
    );
  });

  it("accepts the test functions of node:test without await", async () => {
    const code =
      'import { describe, it } from "node:test";\n\ndescribe("a suite", () => {\n  it("works", () => {\n    return;\n  });\n});\n';
    assert.deepEqual(await ruleIdsFor(code), []);
  });

  it("reports a comment in a JavaScript file", async () => {
    assert.deepEqual(
      await ruleIdsFor(
        "// explained here\nexport const answer = 42;\n",
        join(fixture, "settings.js"),
      ),
      ["shared-config/no-comments"],
    );
  });

  it("reports the any type", async () => {
    assert.ok(
      (await ruleIdsFor("export const value: any = 1;\n")).includes(
        "@typescript-eslint/no-explicit-any",
      ),
    );
  });
});
