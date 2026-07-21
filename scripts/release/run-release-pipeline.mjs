#!/usr/bin/env node

import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const VERSION_PATTERN = /^\d{4}\.\d{1,2}\.\d{1,2}(?:-\d+)?$/;

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? process.cwd(),
    env: { ...process.env, ...(options.env ?? {}) },
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
  const status = result.status ?? 1;
  if (status !== 0 && !options.allowFailure) {
    const detail = options.capture ? `\n${(result.stderr || result.stdout || '').trim()}` : '';
    fail(`Command failed: ${command} ${args.join(' ')}${detail}`, status);
  }
  return {
    status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function git(args, options = {}) {
  return run('git', args, { capture: true, ...options });
}

export function parseArgs(argv) {
  const options = {
    author: 'github-actions[bot]',
    dryRun: false,
    push: false,
    json: false,
    allowSameDayRelease: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--dry-run') options.dryRun = true;
    else if (argument === '--push') options.push = true;
    else if (argument === '--json') options.json = true;
    else if (argument === '--allow-same-day-release') options.allowSameDayRelease = true;
    else if (argument === '--author') {
      options.author = argv[index + 1] ?? fail('Missing value for --author.', 2);
      index += 1;
    } else if (argument === '--help' || argument === '-h') {
      options.help = true;
    } else {
      fail(`Unknown argument: ${argument}`, 2);
    }
  }
  if (options.dryRun && options.push) {
    fail('--dry-run and --push cannot be combined.', 2);
  }
  return options;
}

export function utcVersionDate(date = new Date()) {
  return `${date.getUTCFullYear()}.${date.getUTCMonth() + 1}.${date.getUTCDate()}`;
}

export function isReleaseRelevantPath(filePath) {
  return !filePath.replaceAll('\\', '/').startsWith('.agents/pm/');
}

export function nextVersionForDate(dateKey, tags) {
  const escaped = dateKey.replaceAll('.', '\\.');
  const matcher = new RegExp(`^v?${escaped}(?:-(\\d+))?$`);
  const ordinals = tags.flatMap((tag) => {
    const match = tag.match(matcher);
    if (!match) return [];
    return [match[1] ? Number.parseInt(match[1], 10) : 1];
  });
  if (ordinals.length === 0) return dateKey;
  return `${dateKey}-${Math.max(...ordinals) + 1}`;
}

function listTags() {
  return git(['tag', '--list']).stdout.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
}

function releaseTagSortKey(tag) {
  const match = tag.match(/^v(\d{4})\.(\d{1,2})\.(\d{1,2})(?:-(\d+))?$/);
  if (!match) return null;
  const [, year, month, day, ordinal] = match;
  return [Number(year), Number(month), Number(day), ordinal ? Number(ordinal) : 1];
}

export function latestReleaseTag(tags) {
  return tags
    .map((tag) => ({ tag, key: releaseTagSortKey(tag) }))
    .filter((entry) => entry.key !== null)
    .sort((left, right) => {
      for (let index = 0; index < left.key.length; index += 1) {
        const difference = right.key[index] - left.key[index];
        if (difference !== 0) return difference;
      }
      return 0;
    })
    .at(0)?.tag ?? null;
}

function countCommitsSince(tag) {
  return Number.parseInt(git(['rev-list', '--count', tag ? `${tag}..HEAD` : 'HEAD']).stdout.trim(), 10);
}

function changedFilesSince(tag) {
  const args = tag
    ? ['diff', '--name-only', `${tag}..HEAD`]
    : ['ls-tree', '-r', '--name-only', 'HEAD'];
  return git(args).stdout.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
}

function ensureCleanWorkingTree() {
  const status = git(['status', '--porcelain']).stdout.trim();
  if (status) fail(`Release pipeline requires a clean working tree.\n${status}`);
}

function changelogArgs(output, targetVersion) {
  const args = [
    '--pm-root', '.agents/pm',
    '--pm-bin', './node_modules/.bin/pm',
    '--output', output,
    '--title', 'Changelog',
    '--mode', 'replace',
    '--all-release-tags',
    '--status', 'closed',
    '--item-url-base', 'https://github.com/unbraind/monica-cli/blob/master/.agents/pm',
  ];
  if (targetVersion) args.push('--release-version', targetVersion);
  return args;
}

function generateChangelog(output, targetVersion) {
  run('bun', ['run', 'pm-changelog', ...changelogArgs(output, targetVersion)]);
  const markdown = readFileSync(output, 'utf8');
  const heading = `## ${targetVersion}`;
  const start = markdown.indexOf(heading);
  if (start < 0) fail(`Generated changelog is missing release section ${targetVersion}.`);
  const next = markdown.indexOf('\n## ', start + heading.length);
  const section = markdown.slice(start, next < 0 ? undefined : next);
  if (!/^\s*-\s+/mu.test(section)) {
    fail(`Generated changelog section ${targetVersion} has no release entries.`);
  }
}

function runDryRunGates(targetVersion) {
  const temporaryRoot = mkdtempSync(path.join(tmpdir(), 'monica-auto-release-'));
  try {
    generateChangelog(path.join(temporaryRoot, 'CHANGELOG.md'), targetVersion);
    run('bun', ['run', 'version:check:format']);
    run('bun', ['run', 'typecheck']);
    run('bun', ['run', 'lint']);
    run('bun', ['run', 'build']);
    run('bun', ['run', 'test']);
    run('bun', ['run', 'smoke:npx']);
    run('bun', ['run', 'smoke:bunx']);
    run('bun', ['run', 'audit:history']);
    run('bun', ['run', 'audit:version-history']);
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

function prepareRelease(targetVersion) {
  run('node', ['scripts/set-version.mjs', '--date', targetVersion.split('-')[0]]);
  const packageVersion = JSON.parse(readFileSync('package.json', 'utf8')).version;
  if (packageVersion !== targetVersion) {
    fail(`Version preparation produced ${packageVersion}; expected ${targetVersion}.`);
  }
  run('bun', ['install', '--lockfile-only']);
  generateChangelog('CHANGELOG.md', targetVersion);
  run('bun', ['run', 'version:check']);
  run('bun', ['run', 'changelog:pm:check:release', '--release-version', targetVersion]);
  run('bun', ['run', 'verify:release:gates']);
}

function releaseIdentity(author) {
  const slug = author.toLowerCase().replaceAll(/[^a-z0-9._-]/g, '-') || 'release-bot';
  return {
    GIT_AUTHOR_NAME: author,
    GIT_AUTHOR_EMAIL: `${slug}@users.noreply.github.com`,
    GIT_COMMITTER_NAME: author,
    GIT_COMMITTER_EMAIL: `${slug}@users.noreply.github.com`,
  };
}

function releasePushEnvironment() {
  const token = process.env.RELEASE_PUSH_TOKEN?.trim();
  if (!token) fail('RELEASE_PUSH_TOKEN is required with --push.');
  const header = Buffer.from(`x-access-token:${token}`, 'utf8').toString('base64');
  return {
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader',
    GIT_CONFIG_VALUE_0: `Authorization: Basic ${header}`,
  };
}

function commitTagAndMaybePush(targetVersion, author, push) {
  const tag = `v${targetVersion}`;
  const identity = releaseIdentity(author);
  git(['add', '-u']);
  run('git', ['commit', '-m', `chore(release): cut ${targetVersion}`], { env: identity });
  run('git', ['tag', '-a', tag, '-m', `release: ${tag}`], { env: identity });
  if (push) {
    run('git', ['push', '--atomic', 'origin', 'HEAD:master', tag], {
      env: { ...identity, ...releasePushEnvironment() },
    });
  }
  return tag;
}

function emit(result, asJson) {
  if (asJson) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else if (result.skipped) console.log(`Release skipped: ${result.reason}.`);
  else console.log(`Release pipeline completed for ${result.target_version}${result.dry_run ? ' (dry run)' : ''}.`);
}

export function runPipeline(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    console.log('Usage: node scripts/release/run-release-pipeline.mjs [--dry-run] [--push] [--json] [--allow-same-day-release] [--author name]');
    return;
  }

  ensureCleanWorkingTree();
  const tags = listTags();
  const lastTag = latestReleaseTag(tags);
  const commits = countCommitsSince(lastTag);
  if (commits === 0) {
    emit({ ok: true, skipped: true, reason: 'no_changes_since_last_tag', last_tag: lastTag }, options.json);
    return;
  }

  const changedFiles = changedFilesSince(lastTag);
  const releaseRelevantFiles = changedFiles.filter(isReleaseRelevantPath);
  if (releaseRelevantFiles.length === 0) {
    emit({
      ok: true,
      skipped: true,
      reason: 'tracker_only_changes_since_last_tag',
      last_tag: lastTag,
      commits_since_last_tag: commits,
      ignored_change_paths: changedFiles,
    }, options.json);
    return;
  }

  const dateKey = utcVersionDate();
  const tagsToday = tags.filter((tag) => tag === `v${dateKey}` || tag.startsWith(`v${dateKey}-`));
  if (tagsToday.length > 0 && !options.allowSameDayRelease) {
    emit({ ok: true, skipped: true, reason: 'release_already_cut_today', tags_today: tagsToday }, options.json);
    return;
  }

  const targetVersion = nextVersionForDate(dateKey, tags);
  if (!VERSION_PATTERN.test(targetVersion)) fail(`Invalid target version: ${targetVersion}.`);

  if (options.dryRun) runDryRunGates(targetVersion);
  else prepareRelease(targetVersion);

  const tag = options.dryRun ? `v${targetVersion}` : commitTagAndMaybePush(targetVersion, options.author, options.push);
  emit({
    ok: true,
    skipped: false,
    dry_run: options.dryRun,
    pushed: options.push,
    last_tag: lastTag,
    target_version: targetVersion,
    tag,
    commits_since_last_tag: commits,
    release_relevant_files: releaseRelevantFiles,
  }, options.json);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runPipeline();
}
