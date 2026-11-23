export declare const sharedPackageName = "@sainandannaladam-tech/shared-config";
export declare const prettierReference = "@sainandannaladam-tech/shared-config/prettier";
export declare const tsconfigReference = "@sainandannaladam-tech/shared-config/tsconfig";
export declare const expectedEslintConfig = "import { createEslintConfig } from \"@sainandannaladam-tech/shared-config/eslint\";\n\nexport default createEslintConfig(import.meta.dirname);\n";
export interface SharedSetup {
    readonly toolVersions: Readonly<Record<string, string>>;
    readonly baseCompilerOptionNames: readonly string[];
}
