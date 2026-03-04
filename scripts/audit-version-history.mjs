import { execSync } from 'node:child_process';

const versionPattern = /^\d{4}\.(?:[1-9]|1[0-2])\.(?:[1-9]|[12]\d|3[01])(?:-(?:[2-9]|[1-9]\d*))?$/;

function readLines(command) {
  const output = execSync(command, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  return output ? output.split('\n') : [];
}

function readVersionAtCommit(commit) {
  try {
    const raw = execSync(`git show ${commit}:package.json`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const parsed = JSON.parse(raw);
    return typeof parsed.version === 'string' ? parsed.version : null;
  } catch {
    return null;
  }
}

function main() {
  const commits = readLines('git rev-list --reverse --all');
  const findings = [];
  let checkedCommits = 0;

  for (const commit of commits) {
    const version = readVersionAtCommit(commit);
    if (!version) {
      continue;
    }
    checkedCommits += 1;
    if (!versionPattern.test(version)) {
      findings.push({
        commit,
        version,
      });
    }
  }

  if (findings.length > 0) {
    console.error('Version history audit failed. Invalid package.json version(s) found in commit history:');
    for (const finding of findings) {
      console.error(`${finding.commit} version="${finding.version}"`);
    }
    console.error(
      'Expected format: YYYY.M.D for first release of day, then YYYY.M.D-N for later releases (N >= 2, no zero padding).'
    );
    process.exit(1);
  }

  console.log(`Version history audit passed across ${checkedCommits} commit(s) with package.json.`);
}

main();
