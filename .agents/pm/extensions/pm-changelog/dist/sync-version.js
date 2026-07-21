#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
function readVersionFromArgv() {
    const fromArg = process.argv[2];
    const fromEnv = process.env["NPM_VERSION"];
    const version = (fromArg ?? fromEnv ?? "").trim();
    if (!version) {
        throw new Error("sync-version requires a version argument or NPM_VERSION env var");
    }
    return version;
}
function syncManifest(manifestPath, version) {
    const raw = readFileSync(manifestPath, "utf-8");
    const parsed = JSON.parse(raw);
    parsed.version = version;
    writeFileSync(manifestPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf-8");
}
function syncExtensionVersion(extensionPath, version) {
    const source = readFileSync(extensionPath, "utf-8");
    const pattern = /version:\s*"[^"]+"/;
    if (!pattern.test(source)) {
        throw new Error(`Could not find version literal in ${extensionPath}`);
    }
    const updated = source.replace(pattern, `version: "${version}"`);
    writeFileSync(extensionPath, updated, "utf-8");
}
function main() {
    const version = readVersionFromArgv();
    const cwd = process.cwd();
    syncManifest(resolve(cwd, "manifest.json"), version);
    syncExtensionVersion(resolve(cwd, "src/extension.ts"), version);
    process.stdout.write(`Synced version ${version} into manifest.json and src/extension.ts\n`);
}
main();
//# sourceMappingURL=sync-version.js.map