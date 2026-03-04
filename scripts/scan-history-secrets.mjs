import { execSync } from 'node:child_process';

const suspiciousPattern = [
  'BEGIN (RSA|OPENSSH|EC) PRIVATE KEY',
  'ghp_[A-Za-z0-9]{30,}',
  'github_pat_[A-Za-z0-9_]{40,}',
  'AKIA[0-9A-Z]{16}',
  'xox[baprs]-[A-Za-z0-9-]{20,}',
  'Bearer\\s+[A-Za-z0-9._-]{30,}',
  'eyJ[A-Za-z0-9_-]{20,}\\.[A-Za-z0-9._-]{20,}\\.[A-Za-z0-9._-]{20,}',
  'MONICA_API_KEY\\s*=\\s*[^\\s#]{20,}',
].join('|');

const safeContentPattern = new RegExp(
  [
    'your-',
    'example',
    'sample',
    'dummy',
    'placeholder',
    'masked',
    '<token>',
    'test',
    'localhost',
    '\\.local',
    '127\\.0\\.0\\.1',
  ].join('|'),
  'i'
);
const safePathPattern = /^(tests\/|coverage\/|dist\/)/i;

function readLines(command) {
  const out = execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  return out ? out.split('\n') : [];
}

function main() {
  const commits = readLines('git rev-list --all');
  const findings = [];

  for (const commit of commits) {
    const command = `git grep -nEI "${suspiciousPattern}" ${commit} -- .`;
    const matches = readLines(`${command} || true`);

    for (const match of matches) {
      const firstSep = match.indexOf(':');
      const secondSep = match.indexOf(':', firstSep + 1);
      const thirdSep = match.indexOf(':', secondSep + 1);
      if (firstSep === -1 || secondSep === -1 || thirdSep === -1) {
        continue;
      }

      const file = match.slice(firstSep + 1, secondSep);
      const line = Number.parseInt(match.slice(secondSep + 1, thirdSep), 10);
      const content = match.slice(thirdSep + 1).trim();

      if (!content || safePathPattern.test(file) || safeContentPattern.test(content)) {
        continue;
      }

      findings.push({
        commit,
        file,
        line: Number.isFinite(line) ? line : 0,
        content: content.slice(0, 200),
      });
    }
  }

  if (findings.length > 0) {
    console.error('Potential secret leaks found in git history.');
    for (const finding of findings.slice(0, 50)) {
      console.error(
        `${finding.commit}:${finding.file}:${finding.line} ${finding.content}`
      );
    }
    if (findings.length > 50) {
      console.error(`... ${findings.length - 50} additional finding(s) not shown`);
    }
    process.exit(1);
  }

  console.log(`History secret scan passed across ${commits.length} commit(s).`);
}

main();
