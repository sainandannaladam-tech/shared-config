import type { SharedSetup } from "./shared-setup.ts";
export declare class SharedSetupError extends Error {
    readonly name = "SharedSetupError";
}
export declare function loadSharedSetup(packageRoot: string): SharedSetup;
