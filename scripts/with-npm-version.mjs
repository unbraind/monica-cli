import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function toNpmSemver(version) {
  const strictInternal = version.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})(?:-(\d+))?$/);
  if (strictInternal) {
    const [, year, month, day, releaseNumber] = strictInternal;
    const npmBase = `${year}.${Number(month)}.${Number(day)}`;
    return releaseNumber ? `${npmBase}-${releaseNumber}` : npmBase;
  }

  throw new Error(`Unsupported internal version format: "${version}"`);
}

function run() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    throw new Error('Usage: node scripts/with-npm-version.mjs <command> [args...]');
  }

  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  const originalRaw = fs.readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(originalRaw);
  const originalVersion = packageJson.version;
  const npmSemver = toNpmSemver(originalVersion);

  try {
    if (originalVersion !== npmSemver) {
      packageJson.version = npmSemver;
      fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
    }

    const result = spawnSync(args[0], args.slice(1), {
      stdio: 'inherit',
      shell: false,
    });

    if (result.error) {
      throw result.error;
    }
    if (typeof result.status === 'number' && result.status !== 0) {
      process.exit(result.status);
    }
  } finally {
    fs.writeFileSync(packageJsonPath, originalRaw);
  }
}

run();
