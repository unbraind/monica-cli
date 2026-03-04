import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { afterEach, describe, expect, it } from 'vitest';
import { runAudit } from '../src/commands/audit';

function makeTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function git(args: string[], cwd: string): void {
  execFileSync('git', args, { cwd, stdio: 'ignore' });
}

describe('audit command', () => {
  const cleanupPaths: string[] = [];

  afterEach(() => {
    cleanupPaths.forEach((dir) => {
      fs.rmSync(dir, { recursive: true, force: true });
    });
    cleanupPaths.length = 0;
  });

  it('passes for secure settings and clean tracked files', () => {
    const repoDir = makeTempDir('monica-audit-repo-');
    const homeDir = makeTempDir('monica-audit-home-');
    cleanupPaths.push(repoDir, homeDir);

    const settingsDir = path.join(homeDir, '.monica-cli');
    const settingsPath = path.join(settingsDir, 'settings.json');

    writeFile(path.join(repoDir, 'README.md'), '# test repo\n');
    fs.mkdirSync(settingsDir, { recursive: true, mode: 0o700 });
    fs.writeFileSync(settingsPath, JSON.stringify({ readOnlyMode: true }, null, 2), { mode: 0o600 });

    git(['init'], repoDir);
    git(['add', '.'], repoDir);

    const report = runAudit({ repoPath: repoDir, settingsPath });

    expect(report.ok).toBe(true);
    expect(report.summary.fail).toBe(0);
    expect(report.checks.some((check) => check.id === 'read-only-mode' && check.status === 'pass')).toBe(true);
    expect(report.checks.some((check) => check.id === 'tracked-secret-patterns' && check.status === 'pass')).toBe(true);
  });

  it('fails when tracked files contain Monica secrets', () => {
    const repoDir = makeTempDir('monica-audit-repo-');
    const homeDir = makeTempDir('monica-audit-home-');
    cleanupPaths.push(repoDir, homeDir);

    const settingsDir = path.join(homeDir, '.monica-cli');
    const settingsPath = path.join(settingsDir, 'settings.json');

    writeFile(path.join(repoDir, '.env'), 'MONICA_API_KEY=super-secret-token-value-123456789\n');
    fs.mkdirSync(settingsDir, { recursive: true, mode: 0o700 });
    fs.writeFileSync(settingsPath, JSON.stringify({ readOnlyMode: true }, null, 2), { mode: 0o600 });

    git(['init'], repoDir);
    git(['add', '.'], repoDir);

    const report = runAudit({ repoPath: repoDir, settingsPath });
    const envCheck = report.checks.find((check) => check.id === 'tracked-env-files');
    const secretCheck = report.checks.find((check) => check.id === 'tracked-secret-patterns');

    expect(report.ok).toBe(false);
    expect(report.summary.fail).toBeGreaterThan(0);
    expect(envCheck?.status).toBe('fail');
    expect(secretCheck?.status).toBe('fail');
  });

  it('ignores secret-like fixtures in test files', () => {
    const repoDir = makeTempDir('monica-audit-repo-');
    const homeDir = makeTempDir('monica-audit-home-');
    cleanupPaths.push(repoDir, homeDir);

    const settingsDir = path.join(homeDir, '.monica-cli');
    const settingsPath = path.join(settingsDir, 'settings.json');

    writeFile(path.join(repoDir, 'tests', 'example.test.ts'), 'const value = "MONICA_API_KEY=fixture-token-value-12345678901234567890";\n');
    writeFile(path.join(repoDir, 'README.md'), '# safe repo\n');
    fs.mkdirSync(settingsDir, { recursive: true, mode: 0o700 });
    fs.writeFileSync(settingsPath, JSON.stringify({ readOnlyMode: true }, null, 2), { mode: 0o600 });

    git(['init'], repoDir);
    git(['add', '.'], repoDir);

    const report = runAudit({ repoPath: repoDir, settingsPath });
    const secretCheck = report.checks.find((check) => check.id === 'tracked-secret-patterns');

    expect(report.ok).toBe(true);
    expect(secretCheck?.status).toBe('pass');
  });

  it('fails when tracked files contain private/local API hosts', () => {
    const repoDir = makeTempDir('monica-audit-repo-');
    const homeDir = makeTempDir('monica-audit-home-');
    cleanupPaths.push(repoDir, homeDir);

    const settingsDir = path.join(homeDir, '.monica-cli');
    const settingsPath = path.join(settingsDir, 'settings.json');

    writeFile(path.join(repoDir, 'docs', 'NOTES.md'), 'Base URL: http://localhost:8585/api\n');
    fs.mkdirSync(settingsDir, { recursive: true, mode: 0o700 });
    fs.writeFileSync(settingsPath, JSON.stringify({ readOnlyMode: true }, null, 2), { mode: 0o600 });

    git(['init'], repoDir);
    git(['add', '.'], repoDir);

    const report = runAudit({ repoPath: repoDir, settingsPath });
    const secretCheck = report.checks.find((check) => check.id === 'tracked-secret-patterns');

    expect(report.ok).toBe(false);
    expect(secretCheck?.status).toBe('fail');
    expect(secretCheck?.details?.some((detail) => detail.includes('private-http-host'))).toBe(true);
  });
});
