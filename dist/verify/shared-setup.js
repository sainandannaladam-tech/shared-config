export const sharedPackageName = "@sainandannaladam-tech/shared-config";
export const prettierReference = `${sharedPackageName}/prettier`;
export const tsconfigReference = `${sharedPackageName}/tsconfig`;
export const expectedEslintConfig = `import { createEslintConfig } from "${sharedPackageName}/eslint";

export default createEslintConfig(import.meta.dirname);
`;
