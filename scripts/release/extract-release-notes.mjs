#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const versionIndex = args.indexOf('--version');
const outputIndex = args.indexOf('--output');
const version = versionIndex >= 0 ? args[versionIndex + 1] : null;
const output = outputIndex >= 0 ? args[outputIndex + 1] : null;

if (!version || !/^\d{4}\.\d{1,2}\.\d{1,2}(?:-\d+)?$/.test(version) || !output) {
  throw new Error('Usage: extract-release-notes.mjs --version <version> --output <file>');
}

const changelog = readFileSync('CHANGELOG.md', 'utf8');
const lines = changelog.split(/\r?\n/);
const headingPrefixes = [`## ${version}`, `## [${version}]`];
const headingIndex = lines.findIndex((line) =>
  headingPrefixes.some((prefix) => line === prefix || line.startsWith(`${prefix} - `)),
);
if (headingIndex < 0) throw new Error(`CHANGELOG.md has no section for ${version}.`);
const nextHeadingOffset = lines.slice(headingIndex + 1).findIndex((line) => line.startsWith('## '));
const end = nextHeadingOffset < 0 ? lines.length : headingIndex + 1 + nextHeadingOffset;
const body = lines.slice(headingIndex + 1, end).join('\n').trim();
if (!body || !/^### /mu.test(body) || !/^- /mu.test(body)) {
  throw new Error(`CHANGELOG.md section ${version} has no release notes.`);
}
writeFileSync(output, `${body}\n`, 'utf8');
