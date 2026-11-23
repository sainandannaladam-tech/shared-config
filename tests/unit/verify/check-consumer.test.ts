import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkConsumer } from "../../../src/verify/check-consumer.ts";
import type { ConsumerFiles } from "../../../src/verify/consumer-files.ts";
import {
  expectedEslintConfig,
  prettierReference,
  tsconfigReference,
} from "../../../src/verify/shared-setup.ts";
import type { SharedSetup } from "../../../src/verify/shared-setup.ts";

const shared: SharedSetup = {
  toolVersions: { prettier: "3.10.1", eslint: "10.15.0" },
  baseCompilerOptionNames: ["strict", "noUncheckedIndexedAccess"],
};

const goodSetup: Readonly<Record<string, string>> = {
  "package.json": JSON.stringify({
    name: "consumer",
    prettier: prettierReference,
    devDependencies: { prettier: "3.10.1", vitest: "1.0.0" },
  }),
  "eslint.config.js": expectedEslintConfig,
  "tsconfig.json": JSON.stringify({
    extends: tsconfigReference,
    compilerOptions: { module: "nodenext" },
  }),
};

function filesOf(contents: Readonly<Record<string, string>>): ConsumerFiles {
  return {
    fileNames: Object.keys(contents),
    read: (fileName) => contents[fileName],
  };
}

function problemsWith(
  changes: Readonly<Record<string, string | undefined>>,
): readonly string[] {
  const contents = Object.fromEntries(
    Object.entries({ ...goodSetup, ...changes }).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  );
  return checkConsumer(filesOf(contents), shared);
}

function assertOneProblem(
  changes: Readonly<Record<string, string | undefined>>,
  expected: RegExp,
): void {
  const problems = problemsWith(changes);
  assert.equal(problems.length, 1, problems.join("\n"));
  assert.match(problems[0] ?? "", expected);
}

describe("checkConsumer", () => {
  it("accepts a repository that uses the shared setup", () => {
    assert.deepEqual(problemsWith({}), []);
  });

  it("accepts eslint.config.js with Windows line endings", () => {
    assert.deepEqual(
      problemsWith({
        "eslint.config.js": expectedEslintConfig.replaceAll("\n", "\r\n"),
      }),
      [],
    );
  });

  it("reports a missing package.json", () => {
    assertOneProblem({ "package.json": undefined }, /package\.json is missing/);
  });

  it("reports Prettier options written in package.json", () => {
    assertOneProblem(
      { "package.json": JSON.stringify({ prettier: { semi: false } }) },
      /"prettier" must be/,
    );
  });

  it("reports a separate Prettier config file", () => {
    assertOneProblem(
      { ".prettierrc.json": "{}" },
      /^\.prettierrc\.json: remove it/,
    );
  });

  it("reports a prettier.config.mjs file", () => {
    assertOneProblem(
      { "prettier.config.mjs": "export default {};" },
      /^prettier\.config\.mjs: remove it/,
    );
  });

  it("reports a tool version that differs from the shared one", () => {
    assertOneProblem(
      {
        "package.json": JSON.stringify({
          prettier: prettierReference,
          devDependencies: { eslint: "10.14.0" },
        }),
      },
      /eslint must be exactly 10\.15\.0.*found 10\.14\.0/,
    );
  });

  it("reports a changed eslint.config.js", () => {
    assertOneProblem(
      {
        "eslint.config.js": `${expectedEslintConfig}export const extra = [];\n`,
      },
      /eslint\.config\.js must contain exactly/,
    );
  });

  it("reports a missing eslint.config.js", () => {
    assertOneProblem(
      { "eslint.config.js": undefined },
      /eslint\.config\.js is missing/,
    );
  });

  it("reports another ESLint config file", () => {
    assertOneProblem(
      { ".eslintrc.json": "{}" },
      /^\.eslintrc\.json: remove it/,
    );
  });

  it("reports a tsconfig.json that does not extend the shared base", () => {
    assertOneProblem(
      { "tsconfig.json": JSON.stringify({ compilerOptions: {} }) },
      /"extends" must be/,
    );
  });

  it("reports a strictness option changed in tsconfig.json", () => {
    assertOneProblem(
      {
        "tsconfig.json": JSON.stringify({
          extends: tsconfigReference,
          compilerOptions: { strict: false },
        }),
      },
      /^tsconfig\.json: "strict" is set by the shared setup/,
    );
  });

  it("reports a strictness option changed in another tsconfig file", () => {
    assertOneProblem(
      {
        "tsconfig.build.json": JSON.stringify({
          extends: "./tsconfig.json",
          compilerOptions: { noUncheckedIndexedAccess: false },
        }),
      },
      /^tsconfig\.build\.json: "noUncheckedIndexedAccess"/,
    );
  });

  it("reports a tsconfig.json that is not plain JSON", () => {
    assertOneProblem(
      { "tsconfig.json": '{ "extends": "x", }' },
      /tsconfig\.json is not a valid JSON object/,
    );
  });

  it("reports a missing tsconfig.json", () => {
    assertOneProblem(
      { "tsconfig.json": undefined },
      /tsconfig\.json is missing/,
    );
  });
});
