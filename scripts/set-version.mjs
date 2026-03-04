import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

function isValidVersionDate(versionDate) {
  return /^\d{4}\.(?:[1-9]|1[0-2])\.(?:[1-9]|[12]\d|3[01])$/.test(versionDate);
}

function isValidInternalVersion(version) {
  if (!/^\d{4}\.(?:[1-9]|1[0-2])\.(?:[1-9]|[12]\d|3[01])(?:-(?:[2-9]|[1-9]\d*))?$/.test(version)) {
    return false;
  }
  const suffix = version.split('-')[1];
  if (!suffix) {
    return true;
  }
  const releaseNumber = Number.parseInt(suffix, 10);
  return Number.isInteger(releaseNumber) && releaseNumber >= 2;
}

function formatVersionDate(date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  return `${year}.${month}.${day}`;
}

function parseArgs(argv) {
  const options = {
    check: false,
    date: undefined,
    formatOnly: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--check') {
      options.check = true;
      continue;
    }
    if (arg === '--current') {
      continue;
    }
    if (arg === '--format-only') {
      options.check = true;
      options.formatOnly = true;
      continue;
    }
    if (arg === '--date') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Missing value for --date (expected format: YYYY.M.D)');
      }
      options.date = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function buildDateReleaseVersion(versionDate, releaseNumber) {
  if (!Number.isInteger(releaseNumber) || releaseNumber <= 0) {
    throw new Error(`Invalid release number: "${releaseNumber}"`);
  }
  if (releaseNumber === 1) {
    return versionDate;
  }
  return `${versionDate}-${releaseNumber}`;
}

function parseReleaseNumber(versionDate, tagName) {
  const normalized = tagName.startsWith('v') ? tagName.slice(1) : tagName;
  if (normalized === versionDate) {
    return 1;
  }
  const escapedDate = versionDate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = normalized.match(new RegExp(`^${escapedDate}-((?:[2-9]|[1-9]\\d*))$`));
  if (!match) {
    return null;
  }
  const number = Number.parseInt(match[1], 10);
  if (!Number.isInteger(number) || number < 2) {
    throw new Error(`Invalid release tag "${tagName}". Suffix must be >= 2.`);
  }
  return number;
}

function getPublishedReleaseCountForDate(versionDate) {
  const raw = execSync('git tag --list', { encoding: 'utf8' });
  const tags = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const releaseNumbers = [];
  for (const tag of tags) {
    const releaseNumber = parseReleaseNumber(versionDate, tag);
    if (releaseNumber !== null) {
      releaseNumbers.push(releaseNumber);
    }
  }

  if (releaseNumbers.length === 0) {
    return 0;
  }

  const unique = new Set(releaseNumbers);
  const max = Math.max(...releaseNumbers);
  for (let releaseNumber = 1; releaseNumber <= max; releaseNumber += 1) {
    if (!unique.has(releaseNumber)) {
      throw new Error(
        `Invalid release tags for ${versionDate}: missing release number ${releaseNumber}.`
      );
    }
  }

  return max;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  if (options.formatOnly) {
    if (!isValidInternalVersion(packageJson.version)) {
      throw new Error(
        `Version format mismatch: package.json has "${packageJson.version}", expected YYYY.M.D or YYYY.M.D-N where N >= 2.`
      );
    }
    console.log(`Version format check passed: ${packageJson.version}`);
    return;
  }

  const versionDate = options.date ?? formatVersionDate(new Date());

  if (!isValidVersionDate(versionDate)) {
    throw new Error(`Invalid --date value "${versionDate}". Expected format: YYYY.M.D`);
  }

  const publishedReleaseCount = getPublishedReleaseCountForDate(versionDate);
  const nextReleaseNumber = publishedReleaseCount + 1;
  const expectedVersion = buildDateReleaseVersion(versionDate, nextReleaseNumber);

  if (options.check) {
    if (packageJson.version !== expectedVersion) {
      throw new Error(
        `Version mismatch: package.json has "${packageJson.version}", expected "${expectedVersion}" based on ${publishedReleaseCount} tagged release(s) on ${versionDate}.`
      );
    }
    console.log(`Version check passed: ${packageJson.version}`);
    return;
  }

  const previous = packageJson.version;
  packageJson.version = expectedVersion;
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
  console.log(`Updated version: ${previous} -> ${expectedVersion}`);
}

main();
