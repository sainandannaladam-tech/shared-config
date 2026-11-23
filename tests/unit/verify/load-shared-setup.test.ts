import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  isJsonObject,
  stringEntries,
} from "../../../src/verify/json-values.ts";
import { loadSharedSetup } from "../../../src/verify/load-shared-setup.ts";

const packageRoot = join(import.meta.dirname, "..", "..", "..");

function packageJson(): Readonly<Record<string, unknown>> {
  const value: unknown = JSON.parse(
    readFileSync(join(packageRoot, "package.json"), "utf8"),
  );
  assert.ok(isJsonObject(value));
  return value;
}

describe("loadSharedSetup", () => {
  it("takes the tool versions from the peer dependencies", () => {
    assert.deepEqual(
      loadSharedSetup(packageRoot).toolVersions,
      stringEntries(packageJson()["peerDependencies"]),
    );
  });

  it("takes the protected options from the shared TypeScript base", () => {
    const names = loadSharedSetup(packageRoot).baseCompilerOptionNames;
    assert.ok(names.includes("strict"));
    assert.ok(names.includes("noUncheckedIndexedAccess"));
    assert.ok(names.includes("exactOptionalPropertyTypes"));
  });
});

describe("the package's own tool versions", () => {
  it("are exact and the same for development and for consumers", () => {
    const peers = stringEntries(packageJson()["peerDependencies"]);
    const development = stringEntries(packageJson()["devDependencies"]);
    for (const [tool, version] of Object.entries(peers)) {
      assert.match(
        version,
        /^\d+\.\d+\.\d+$/,
        `${tool} is not an exact version`,
      );
      assert.equal(development[tool], version, `${tool} differs`);
    }
  });
});
