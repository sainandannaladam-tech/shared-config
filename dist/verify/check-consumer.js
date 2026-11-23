import { isJsonObject, parseJsonObject, stringEntries } from "./json-values.js";
import { expectedEslintConfig, prettierReference, tsconfigReference, } from "./shared-setup.js";
const otherPrettierConfig = /^(\.prettierrc(\..+)?|prettier\.config\.[cm]?[jt]s)$/;
const otherEslintConfig = /^(\.eslintrc(\..+)?|eslint\.config\.(mjs|cjs|ts|mts|cts))$/;
const typescriptConfig = /^tsconfig(\..+)?\.json$/;
export function checkConsumer(files, shared) {
    return [
        ...checkPackageJson(files, shared),
        ...checkPrettierFiles(files),
        ...checkEslintFiles(files),
        ...checkTypescriptFiles(files, shared),
    ];
}
function checkPackageJson(files, shared) {
    const text = files.read("package.json");
    if (text === undefined) {
        return ["package.json is missing"];
    }
    const packageJson = parseJsonObject(text);
    if (packageJson === undefined) {
        return ["package.json is not a valid JSON object"];
    }
    const problems = [];
    if (packageJson["prettier"] !== prettierReference) {
        problems.push(`package.json: "prettier" must be "${prettierReference}", with no options of its own`);
    }
    const declared = {
        ...stringEntries(packageJson["dependencies"]),
        ...stringEntries(packageJson["devDependencies"]),
    };
    for (const [tool, version] of Object.entries(shared.toolVersions)) {
        const declaredVersion = declared[tool];
        if (declaredVersion !== undefined && declaredVersion !== version) {
            problems.push(`package.json: ${tool} must be exactly ${version}, the shared version (found ${declaredVersion})`);
        }
    }
    return problems;
}
function checkPrettierFiles(files) {
    return files.fileNames
        .filter((name) => otherPrettierConfig.test(name))
        .map((name) => `${name}: remove it; Prettier settings come only from the shared setup`);
}
function checkEslintFiles(files) {
    const problems = files.fileNames
        .filter((name) => otherEslintConfig.test(name))
        .map((name) => `${name}: remove it; ESLint settings live in eslint.config.js`);
    const text = files.read("eslint.config.js");
    if (text === undefined) {
        return [...problems, "eslint.config.js is missing"];
    }
    if (text.replaceAll("\r\n", "\n") !== expectedEslintConfig) {
        return [
            ...problems,
            `eslint.config.js must contain exactly:\n${expectedEslintConfig}`,
        ];
    }
    return problems;
}
function checkTypescriptFiles(files, shared) {
    const names = files.fileNames.filter((name) => typescriptConfig.test(name));
    const problems = names.flatMap((name) => checkTypescriptFile(name, files.read(name) ?? "", shared));
    if (!names.includes("tsconfig.json")) {
        return [...problems, "tsconfig.json is missing"];
    }
    return problems;
}
function checkTypescriptFile(name, text, shared) {
    const config = parseJsonObject(text);
    if (config === undefined) {
        return [`${name} is not a valid JSON object (comments are not allowed)`];
    }
    const problems = [];
    if (name === "tsconfig.json" && config["extends"] !== tsconfigReference) {
        problems.push(`tsconfig.json: "extends" must be "${tsconfigReference}"`);
    }
    const compilerOptions = isJsonObject(config["compilerOptions"])
        ? config["compilerOptions"]
        : {};
    for (const option of shared.baseCompilerOptionNames) {
        if (option in compilerOptions) {
            problems.push(`${name}: "${option}" is set by the shared setup and must not be changed`);
        }
    }
    return problems;
}
