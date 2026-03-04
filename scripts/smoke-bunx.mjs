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
  runCommand('bun', ['link'], { stdio: 'inherit' });
  runCommand('bunx', ['monica', '--version'], { stdio: 'inherit' });
}

main();
