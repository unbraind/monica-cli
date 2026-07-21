#!/usr/bin/env node

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function run(command, args, cwd) {
  return spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function lastLine(value) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).at(-1) ?? '';
}

function retry(label, attempts, action) {
  let reason = 'unknown failure';
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const result = action();
    if (result.ok) return { ...result, attempts: attempt };
    reason = result.reason;
    if (attempt < attempts) {
      console.error(`Waiting for ${label} propagation (${attempt}/${attempts})...`);
      sleep(Number(process.env.MONICA_VERIFY_SLEEP_MS ?? 10_000));
    }
  }
  throw new Error(`${label} verification failed: ${reason}`);
}

function verifyCommand(label, command, args, version, cwd, attempts) {
  return retry(label, attempts, () => {
    const result = run(command, args, cwd);
    const observed = lastLine(result.stdout || '');
    return result.status === 0 && observed === version
      ? { ok: true, version: observed }
      : { ok: false, reason: observed || (result.stderr || '').trim() || `exit ${result.status}` };
  });
}

function main() {
  const args = process.argv.slice(2);
  const versionIndex = args.indexOf('--version');
  const version = versionIndex >= 0 ? args[versionIndex + 1] : null;
  const skipGithub = args.includes('--skip-github-release');
  const json = args.includes('--json');
  if (!version || !/^\d{4}\.\d{1,2}\.\d{1,2}(?:-\d+)?$/.test(version)) {
    throw new Error('Usage: verify-published-release.mjs --version YYYY.M.D[-N] [--skip-github-release] [--json]');
  }

  const npm = retry('npm metadata', 20, () => {
    const result = run('npm', ['view', `monica-cli@${version}`, 'version', 'dist.integrity', 'dist.unpackedSize', '--json']);
    if (result.status !== 0) return { ok: false, reason: (result.stderr || '').trim() };
    try {
      const metadata = JSON.parse(result.stdout);
      return metadata.version === version
        ? { ok: true, metadata }
        : { ok: false, reason: `observed version ${metadata.version ?? 'missing'}` };
    } catch (error) {
      return { ok: false, reason: String(error) };
    }
  });

  const temporaryRoot = mkdtempSync(path.join(tmpdir(), 'monica-published-verify-'));
  let npx;
  let bunx;
  try {
    npx = verifyCommand('npx', 'npx', ['--yes', `monica-cli@${version}`, '--version'], version, temporaryRoot, 10);
    bunx = verifyCommand('bunx', 'bunx', ['--bun', `monica-cli@${version}`, '--version'], version, temporaryRoot, 10);
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }

  let githubRelease = { skipped: true };
  if (!skipGithub) {
    const result = run('gh', ['release', 'view', `v${version}`, '--json', 'tagName,isDraft,isPrerelease,url']);
    if (result.status !== 0) throw new Error((result.stderr || '').trim() || 'GitHub release lookup failed.');
    githubRelease = JSON.parse(result.stdout);
    if (githubRelease.tagName !== `v${version}` || githubRelease.isDraft || githubRelease.isPrerelease) {
      throw new Error(`GitHub release v${version} is missing or not final.`);
    }
  }

  const output = { ok: true, version, npm, npx, bunx, github_release: githubRelease };
  if (json) process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  else console.log(`Published release ${version} verified through npm, npx, bunx, and GitHub.`);
}

main();
