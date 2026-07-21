import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAuditCommand, runAudit } from '../src/commands/audit';

describe('audit edge cases', () => {
  const cleanup: string[] = [];
  const temporary = (): string => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'monica-audit-edge-'));
    cleanup.push(directory);
    return directory;
  };
  afterEach(() => {
    cleanup.forEach((directory) => fs.rmSync(directory, { recursive: true, force: true }));
    cleanup.length = 0;
    delete process.env.MONICA_API_KEY;
    delete process.env.MONICA_USER_PASSWORD;
    vi.restoreAllMocks();
  });

  it('warns for missing settings and a non-repository', () => {
    const directory = temporary();
    const report = runAudit({
      repoPath: directory, settingsPath: path.join(directory, '.monica-cli', 'settings.json'),
    });
    expect(report.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'settings-file', status: 'warn' }),
      expect.objectContaining({ id: 'git-tracked-files', status: 'warn' }),
    ]));
  });

  it('warns for insecure modes, invalid settings, and active environment secrets', () => {
    const directory = temporary();
    const settingsDirectory = path.join(directory, '.monica-cli');
    const settingsPath = path.join(settingsDirectory, 'settings.json');
    fs.mkdirSync(settingsDirectory, { recursive: true, mode: 0o755 });
    fs.writeFileSync(settingsPath, '{invalid', { mode: 0o644 });
    process.env.MONICA_API_KEY = 'active-secret';
    const report = runAudit({ repoPath: directory, settingsPath });
    expect(report.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'settings-file-permissions', status: 'warn' }),
      expect.objectContaining({ id: 'settings-dir-permissions', status: 'warn' }),
      expect.objectContaining({ id: 'env-secrets-active', status: 'warn' }),
    ]));
  });

  it('detects tracked settings while safely skipping binaries and oversized files', () => {
    const directory = temporary();
    const settingsPath = path.join(directory, 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify({ readOnlyMode: false }), { mode: 0o600 });
    fs.writeFileSync(path.join(directory, 'binary.bin'), Buffer.from([0, 1, 2]));
    fs.writeFileSync(path.join(directory, 'large.txt'), Buffer.alloc(1024 * 1024 + 1));
    execFileSync('git', ['init'], { cwd: directory, stdio: 'ignore' });
    execFileSync('git', ['add', '.'], { cwd: directory, stdio: 'ignore' });
    const report = runAudit({ repoPath: directory, settingsPath });
    expect(report.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'settings-tracked', status: 'fail' }),
      expect.objectContaining({ id: 'read-only-mode', status: 'warn' }),
    ]));
  });

  it('tolerates tracked files that disappear during scanning', () => {
    const directory = temporary();
    const missing = path.join(directory, 'missing.txt');
    fs.writeFileSync(missing, 'temporary');
    execFileSync('git', ['init'], { cwd: directory, stdio: 'ignore' });
    execFileSync('git', ['add', '.'], { cwd: directory, stdio: 'ignore' });
    fs.unlinkSync(missing);
    expect(() => runAudit({
      repoPath: directory, settingsPath: path.join(directory, 'settings.json'),
    })).not.toThrow();
  });

  it('allows the tracked environment example template', () => {
    const directory = temporary();
    fs.writeFileSync(path.join(directory, '.env.example'), 'MONICA_API_KEY=example');
    execFileSync('git', ['init'], { cwd: directory, stdio: 'ignore' });
    execFileSync('git', ['add', '.'], { cwd: directory, stdio: 'ignore' });
    const report = runAudit({ repoPath: directory, settingsPath: path.join(directory, 'settings.json') });
    expect(report.checks.find((check) => check.id === 'tracked-env-files')?.status).toBe('pass');
  });

  it('defaults the repository path to the current working directory', () => {
    const directory = temporary();
    const report = runAudit({ settingsPath: path.join(directory, 'settings.json') });
    expect(report.repoPath).toBe(process.cwd());
  });

  it('runs the command and enforces fail and strict-warning exits', async () => {
    const directory = temporary();
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    await createAuditCommand().parseAsync([
      '--format', 'json', '--repo-path', directory,
    ], { from: 'user' });
    expect(log).toHaveBeenCalled();
    expect(exit).not.toHaveBeenCalled();
    await createAuditCommand().parseAsync([
      '--format', 'json', '--repo-path', directory, '--strict',
    ], { from: 'user' });
    expect(exit).toHaveBeenCalledWith(1);
  });
});
