import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isJsonObject, parseJsonObject, stringEntries } from "./json-values.js";
export class SharedSetupError extends Error {
    name = "SharedSetupError";
}
export function loadSharedSetup(packageRoot) {
    const packageJson = readJsonObject(join(packageRoot, "package.json"));
    const baseConfig = readJsonObject(join(packageRoot, "tsconfig.base.json"));
    const compilerOptions = baseConfig["compilerOptions"];
    if (!isJsonObject(compilerOptions)) {
        throw new SharedSetupError("tsconfig.base.json has no compilerOptions object");
    }
    return {
        toolVersions: stringEntries(packageJson["peerDependencies"]),
        baseCompilerOptionNames: Object.keys(compilerOptions),
    };
}
function readJsonObject(path) {
    const value = parseJsonObject(readFileSync(path, "utf8"));
    if (value === undefined) {
        throw new SharedSetupError(`${path} is not a valid JSON object`);
    }
    return value;
}
