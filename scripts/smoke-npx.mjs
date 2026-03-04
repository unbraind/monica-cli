import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

function runCommand(command, args, options = {}) {
  const useInheritedIo = options.stdio === 'inherit';
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
  if (useInheritedIo) {
    return '';
  }
  return (result.stdout || '').trim();
}

function main() {
  const packed = runCommand('node', ['scripts/with-npm-version.mjs', 'npm', 'pack', '--silent']);
  const packageFile = packed.split('\n').filter(Boolean).at(-1);
  if (!packageFile) {
    throw new Error('npm pack did not return a package filename.');
  }

  try {
    runCommand('npx', ['--yes', '--package', `./${packageFile}`, 'monica', '--version'], {
      stdio: 'inherit',
    });
  } finally {
    if (fs.existsSync(packageFile)) {
      fs.unlinkSync(packageFile);
    }
  }
}

main();
