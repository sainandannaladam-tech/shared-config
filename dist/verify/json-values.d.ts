export type JsonObject = Readonly<Record<string, unknown>>;
export declare function isJsonObject(value: unknown): value is JsonObject;
export declare function parseJsonObject(text: string): JsonObject | undefined;
export declare function stringEntries(value: unknown): Readonly<Record<string, string>>;
