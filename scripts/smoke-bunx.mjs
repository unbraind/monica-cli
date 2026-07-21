import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    process.exit(result.status || 1);
  }
  return (result.stdout || '').trim();
}

function main() {
  const packed = runCommand('node', ['scripts/with-npm-version.mjs', 'npm', 'pack', '--silent']);
  const packageFile = packed.split('\n').filter(Boolean).at(-1);
  if (!packageFile) throw new Error('npm pack did not return a package filename.');

  const packagePath = path.resolve(packageFile);
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'monica-bunx-smoke-'));
  try {
    const version = runCommand(
      'bunx',
      ['--bun', '--package', packagePath, 'monica', '--version'],
      { cwd: temporaryRoot },
    );
    console.log(version);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
    if (fs.existsSync(packageFile)) fs.unlinkSync(packageFile);
  }
}

main();
