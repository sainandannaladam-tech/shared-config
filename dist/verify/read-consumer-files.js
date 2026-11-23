import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
export function readConsumerFiles(directory) {
    const fileNames = readdirSync(directory, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name);
    return {
        fileNames,
        read: (fileName) => fileNames.includes(fileName)
            ? readFileSync(join(directory, fileName), "utf8")
            : undefined,
    };
}
