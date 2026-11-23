import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { after, describe, it } from "node:test";
import { createConsumerRepository } from "./consumer-repository.ts";
import type { ConsumerRepository } from "./consumer-repository.ts";

const unformatted =
  "const greeting = 'hello'\nexport   const message = {greeting, count:1}\n";
const formatted =
  'const greeting = "hello";\nexport const message = { greeting, count: 1 };\n';

const repositories: ConsumerRepository[] = [];

function consumer(): ConsumerRepository {
  const repository = createConsumerRepository();
  repositories.push(repository);
  return repository;
}

after(() => {
  for (const repository of repositories) {
    repository.remove();
  }
});

describe("a repository that uses the shared setup", () => {
  it("passes the drift check", () => {
    const result = consumer().run("verify", []);
    assert.equal(result.status, 0, result.output);
  });

  it("fails the drift check when it adds its own Prettier settings", () => {
    const repository = consumer();
    repository.write(".prettierrc.json", '{ "semi": false }');
    const result = repository.run("verify", []);
    assert.equal(result.status, 1);
    assert.match(result.output, /\.prettierrc\.json: remove it/);
  });

  it("fails the drift check when it switches off a strictness option", () => {
    const repository = consumer();
    repository.write(
      "tsconfig.json",
      JSON.stringify({
        extends: "@sainandannaladam-tech/shared-config/tsconfig",
        compilerOptions: { exactOptionalPropertyTypes: false },
      }),
    );
    const result = repository.run("verify", []);
    assert.equal(result.status, 1);
    assert.match(
      result.output,
      /"exactOptionalPropertyTypes" is set by the shared setup/,
    );
  });

  it("formats a file exactly like every other repository", () => {
    const first = consumer();
    const second = consumer();
    for (const repository of [first, second]) {
      repository.write("src/message.ts", unformatted);
      const result = repository.run("prettier", ["--write", "src/message.ts"]);
      assert.equal(result.status, 0, result.output);
    }
    const read = (repository: ConsumerRepository): string =>
      readFileSync(join(repository.directory, "src", "message.ts"), "utf8");
    assert.equal(read(first), formatted);
    assert.equal(read(second), formatted);
  });

  it("gets the strict TypeScript options from the shared base", () => {
    const repository = consumer();
    repository.write("src/answer.ts", "export const answer = 42;\n");
    const result = repository.run("tsc", ["--showConfig"]);
    assert.equal(result.status, 0, result.output);
    const options = JSON.parse(result.output) as {
      readonly compilerOptions: Readonly<Record<string, unknown>>;
    };
    assert.equal(options.compilerOptions["strict"], true);
    assert.equal(options.compilerOptions["noUncheckedIndexedAccess"], true);
    assert.equal(options.compilerOptions["exactOptionalPropertyTypes"], true);
  });

  it("fails the type check on an unchecked index", () => {
    const repository = consumer();
    repository.write(
      "src/first.ts",
      "export function first(values: number[]): number {\n  return values[0];\n}\n",
    );
    const result = repository.run("tsc", ["-p", "."]);
    assert.equal(result.status, 2);
    assert.match(result.output, /TS2322/);
  });

  it("fails the lint on a comment", () => {
    const repository = consumer();
    repository.write(
      "src/answer.ts",
      "// the answer\nexport const answer = 42;\n",
    );
    const result = repository.run("eslint", ["src"]);
    assert.equal(result.status, 1, result.output);
    assert.match(result.output, /shared-config\/no-comments/);
  });

  it("passes the lint on clean code", () => {
    const repository = consumer();
    repository.write("src/answer.ts", "export const answer = 42;\n");
    const result = repository.run("eslint", ["src"]);
    assert.equal(result.status, 0, result.output);
  });
});
