#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const versionIndex = args.indexOf('--version');
const outputIndex = args.indexOf('--output');
const version = versionIndex >= 0 ? args[versionIndex + 1] : null;
const output = outputIndex >= 0 ? args[outputIndex + 1] : null;

if (!version || !output) {
  throw new Error('Usage: extract-release-notes.mjs --version <version> --output <file>');
}

const changelog = readFileSync('CHANGELOG.md', 'utf8');
const headingPattern = new RegExp(`^## \\[?${version.replaceAll('.', '\\.')}\\]?(?: - .*)?$`, 'mu');
const match = headingPattern.exec(changelog);
if (!match) throw new Error(`CHANGELOG.md has no section for ${version}.`);
const start = match.index + match[0].length;
const remainder = changelog.slice(start);
const nextHeading = remainder.search(/^## /mu);
const body = remainder.slice(0, nextHeading < 0 ? undefined : nextHeading).trim();
if (!body || !/^### /mu.test(body) || !/^- /mu.test(body)) {
  throw new Error(`CHANGELOG.md section ${version} has no release notes.`);
}
writeFileSync(output, `${body}\n`, 'utf8');
