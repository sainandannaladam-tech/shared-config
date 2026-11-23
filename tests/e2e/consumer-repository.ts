import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  expectedEslintConfig,
  prettierReference,
  sharedPackageName,
  tsconfigReference,
} from "../../src/verify/shared-setup.ts";

export const packageRoot = join(import.meta.dirname, "..", "..");

const tools = {
  eslint: join(packageRoot, "node_modules", "eslint", "bin", "eslint.js"),
  prettier: join(
    packageRoot,
    "node_modules",
    "prettier",
    "bin",
    "prettier.cjs",
  ),
  tsc: join(packageRoot, "node_modules", "typescript", "bin", "tsc"),
  verify: join(packageRoot, "dist", "verify", "cli.js"),
} as const;

export interface ToolResult {
  readonly status: number | null;
  readonly output: string;
}

export interface ConsumerRepository {
  readonly directory: string;
  write(relativePath: string, contents: string): void;
  run(tool: keyof typeof tools, args: readonly string[]): ToolResult;
  remove(): void;
}

export function createConsumerRepository(): ConsumerRepository {
  const directory = mkdtempSync(join(tmpdir(), "shared-config-consumer-"));
  const write = (relativePath: string, contents: string): void => {
    const path = join(directory, relativePath);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, contents);
  };
  const installedPackage = join(directory, "node_modules", sharedPackageName);
  mkdirSync(dirname(installedPackage), { recursive: true });
  symlinkSync(packageRoot, installedPackage, "junction");
  write(
    "package.json",
    JSON.stringify({
      name: "consumer",
      type: "module",
      prettier: prettierReference,
    }),
  );
  write("eslint.config.js", expectedEslintConfig);
  write(
    "tsconfig.json",
    JSON.stringify({
      extends: tsconfigReference,
      compilerOptions: {
        module: "nodenext",
        target: "es2024",
        lib: ["es2024"],
        types: [],
        noEmit: true,
      },
      include: ["src"],
    }),
  );
  return {
    directory,
    write,
    run: (tool, args) => {
      const result = spawnSync(process.execPath, [tools[tool], ...args], {
        cwd: directory,
        encoding: "utf8",
      });
      return { status: result.status, output: result.stdout + result.stderr };
    },
    remove: () => {
      rmSync(directory, { recursive: true, force: true });
    },
  };
}
