import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { ConsumerFiles } from "./consumer-files.ts";

export function readConsumerFiles(directory: string): ConsumerFiles {
  const fileNames = readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);
  return {
    fileNames,
    read: (fileName) =>
      fileNames.includes(fileName)
        ? readFileSync(join(directory, fileName), "utf8")
        : undefined,
  };
}
