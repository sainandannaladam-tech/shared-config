export function isJsonObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function parseJsonObject(text) {
    try {
        const value = JSON.parse(text);
        return isJsonObject(value) ? value : undefined;
    }
    catch {
        return undefined;
    }
}
export function stringEntries(value) {
    if (!isJsonObject(value)) {
        return {};
    }
    return Object.fromEntries(Object.entries(value).filter((entry) => typeof entry[1] === "string"));
}
