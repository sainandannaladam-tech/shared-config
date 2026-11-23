#!/usr/bin/env node
import { join } from "node:path";
import { checkConsumer } from "./check-consumer.js";
import { loadSharedSetup } from "./load-shared-setup.js";
import { readConsumerFiles } from "./read-consumer-files.js";
const packageRoot = join(import.meta.dirname, "..", "..");
const problems = checkConsumer(readConsumerFiles(process.cwd()), loadSharedSetup(packageRoot));
if (problems.length === 0) {
    console.log("shared-config: this repository uses the shared setup");
}
else {
    console.error("shared-config: this repository differs from the shared setup");
    for (const problem of problems) {
        console.error(`- ${problem}`);
    }
    process.exitCode = 1;
}
