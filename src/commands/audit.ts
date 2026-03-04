import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as fmt from '../formatters';
import { resolveCommandOutputFormat } from './output-format';
import { GLOBAL_SETTINGS_PATH, normalizeSettings } from '../utils/settings';
type AuditStatus = 'pass' | 'warn' | 'fail';
type AuditSeverity = 'info' | 'warning' | 'critical';
interface AuditCheck {
  id: string;
  status: AuditStatus;
  severity: AuditSeverity;
  message: string;
  details?: string[];
}
interface AuditSummary {
  total: number;
  pass: number;
  warn: number;
  fail: number;
}
export interface AuditReport {
  generatedAt: string;
  ok: boolean;
  repoPath: string;
  settingsPath: string;
  summary: AuditSummary;
  checks: AuditCheck[];
}
export interface AuditOptions {
  repoPath?: string;
  settingsPath?: string;
  strict?: boolean;
}
const SECRET_PATTERNS: Array<{ id: string; regex: RegExp }> = [
  { id: 'env-api-key', regex: /MONICA_API_KEY\s*=\s*[^\s#]{20,}/ },
  { id: 'json-api-key', regex: /"apiKey"\s*:\s*"[^"]{40,}"/ },
  { id: 'jwt-token', regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]{10,}\.[A-Za-z0-9._-]{10,}\b/ },
  { id: 'bearer-token', regex: /Bearer\s+[A-Za-z0-9._-]{20,}/i },
  { id: 'private-http-host', regex: /https?:\/\/(?:localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?::\d+)?/i },
];
const SECRET_SCAN_IGNORED_SEGMENTS = new Set(['tests', '__tests__', '__fixtures__', 'fixtures']);

function shouldIgnoreSecretScan(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  const segments = normalized.split('/').filter((segment) => segment.length > 0);
  const fileName = path.basename(normalized);
  if (segments.some((segment) => SECRET_SCAN_IGNORED_SEGMENTS.has(segment))) {
    return true;
  }
  return /\.test\.[A-Za-z0-9]+$/i.test(fileName) || /\.spec\.[A-Za-z0-9]+$/i.test(fileName);
}
function getOutputFormat(command: Command): OutputFormat {
  return resolveCommandOutputFormat(command);
}
function getActionCommand(command?: Command): Command {
  return command || new Command();
}
function formatMode(mode: number): string {
  return `0${(mode & 0o777).toString(8)}`;
}
function listTrackedFiles(repoPath: string): string[] {
  try {
    const output = execFileSync('git', ['ls-files', '-z'], {
      cwd: repoPath,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return output.split('\0').map((file) => file.trim()).filter((file) => file.length > 0);
  } catch {
    return [];
  }
}
function isLikelyBinary(buffer: Buffer): boolean {
  const sampleSize = Math.min(buffer.length, 8000);
  for (let i = 0; i < sampleSize; i += 1) {
    if (buffer[i] === 0) {
      return true;
    }
  }
  return false;
}
function scanFileForSecrets(filePath: string): string[] {
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile() || stat.size > 1024 * 1024) {
      return [];
    }

    const buffer = fs.readFileSync(filePath);
    if (isLikelyBinary(buffer)) {
      return [];
    }

    const content = buffer.toString('utf8');
    return SECRET_PATTERNS.filter((pattern) => pattern.regex.test(content)).map((pattern) => pattern.id);
  } catch {
    return [];
  }
}
function summarizeChecks(checks: AuditCheck[]): AuditSummary {
  const summary: AuditSummary = { total: checks.length, pass: 0, warn: 0, fail: 0 };
  checks.forEach((check) => {
    if (check.status === 'pass') summary.pass += 1;
    if (check.status === 'warn') summary.warn += 1;
    if (check.status === 'fail') summary.fail += 1;
  });
  return summary;
}
export function runAudit(options: AuditOptions = {}): AuditReport {
  const repoPath = path.resolve(options.repoPath || process.cwd());
  const settingsPath = path.resolve(options.settingsPath || GLOBAL_SETTINGS_PATH);
  const settingsDir = path.dirname(settingsPath);
  const checks: AuditCheck[] = [];
  const settingsExists = fs.existsSync(settingsPath);
  checks.push(settingsExists
    ? { id: 'settings-file', status: 'pass', severity: 'info', message: 'Global settings file exists' }
    : {
        id: 'settings-file',
        status: 'warn',
        severity: 'warning',
        message: `Global settings file not found at ${settingsPath}`,
      });

  if (settingsExists && process.platform !== 'win32') {
    const mode = fs.statSync(settingsPath).mode;
    const expected = 0o600;
    const current = mode & 0o777;
    checks.push(current === expected
      ? {
          id: 'settings-file-permissions',
          status: 'pass',
          severity: 'info',
          message: `Settings file permissions are secure (${formatMode(mode)})`,
        }
      : {
          id: 'settings-file-permissions',
          status: 'warn',
          severity: 'warning',
          message: `Settings file permissions should be 0600 (current ${formatMode(mode)})`,
        });
  }
  if (fs.existsSync(settingsDir) && process.platform !== 'win32') {
    const mode = fs.statSync(settingsDir).mode;
    const current = mode & 0o777;
    checks.push(current === 0o700
      ? {
          id: 'settings-dir-permissions',
          status: 'pass',
          severity: 'info',
          message: `Settings directory permissions are secure (${formatMode(mode)})`,
        }
      : {
          id: 'settings-dir-permissions',
          status: 'warn',
          severity: 'warning',
          message: `Settings directory permissions should be 0700 (current ${formatMode(mode)})`,
        });
  }
  let currentSettings: { readOnlyMode?: boolean } | null = null;
  if (settingsExists) {
    try {
      const parsed = JSON.parse(fs.readFileSync(settingsPath, 'utf8')) as { readOnlyMode?: boolean; readOnly?: boolean };
      currentSettings = normalizeSettings(parsed);
    } catch {
      currentSettings = null;
    }
  }
  if (currentSettings) {
    checks.push(currentSettings.readOnlyMode === true
      ? { id: 'read-only-mode', status: 'pass', severity: 'info', message: 'Read-only mode is enabled in global settings' }
      : {
          id: 'read-only-mode',
          status: 'warn',
          severity: 'warning',
          message: 'Read-only mode is disabled; use `monica config set --read-only` for production data safety',
        });
  }
  const trackedFiles = listTrackedFiles(repoPath);
  if (trackedFiles.length === 0) {
    checks.push({
      id: 'git-tracked-files',
      status: 'warn',
      severity: 'warning',
      message: 'No tracked files detected (not a git repository or empty repository)',
    });
  } else {
    checks.push({
      id: 'git-tracked-files',
      status: 'pass',
      severity: 'info',
      message: `Scanned ${trackedFiles.length} tracked files`,
    });
  }
  const trackedAbsolute = new Set(trackedFiles.map((file) => path.resolve(repoPath, file)));
  checks.push(trackedAbsolute.has(settingsPath)
    ? {
        id: 'settings-tracked',
        status: 'fail',
        severity: 'critical',
        message: 'Global settings file is tracked by git and may leak credentials',
        details: [settingsPath],
      }
    : {
        id: 'settings-tracked',
        status: 'pass',
        severity: 'info',
        message: 'Global settings file is not tracked by git',
      });
  const trackedEnvFiles = trackedFiles.filter((file) => {
    const baseName = path.basename(file);
    if (baseName === '.env.example') return false;
    return baseName === '.env' || baseName.startsWith('.env.');
  });
  checks.push(trackedEnvFiles.length > 0
    ? {
        id: 'tracked-env-files',
        status: 'fail',
        severity: 'critical',
        message: 'Tracked .env files detected (these can expose secrets)',
        details: trackedEnvFiles.slice(0, 20),
      }
    : {
        id: 'tracked-env-files',
        status: 'pass',
        severity: 'info',
        message: 'No tracked .env secret files detected',
      });
  const secretFindings = trackedFiles.flatMap((file) => {
    if (shouldIgnoreSecretScan(file)) {
      return [] as string[];
    }
    const absolutePath = path.resolve(repoPath, file);
    const patterns = scanFileForSecrets(absolutePath);
    if (patterns.length === 0) {
      return [] as string[];
    }
    return [`${file}: ${patterns.join(',')}`];
  });
  checks.push(secretFindings.length > 0
    ? {
        id: 'tracked-secret-patterns',
        status: 'fail',
        severity: 'critical',
        message: 'Potential secret patterns found in tracked files',
        details: secretFindings.slice(0, 20),
      }
    : {
        id: 'tracked-secret-patterns',
        status: 'pass',
        severity: 'info',
        message: 'No known Monica secret patterns found in tracked files',
      });
  if (process.env.MONICA_API_KEY || process.env.MONICA_USER_PASSWORD) {
    checks.push({
      id: 'env-secrets-active',
      status: 'warn',
      severity: 'warning',
      message: 'Sensitive MONICA_* environment variables are active in this shell',
    });
  }
  const summary = summarizeChecks(checks);
  const report: AuditReport = {
    generatedAt: new Date().toISOString(),
    ok: summary.fail === 0,
    repoPath,
    settingsPath,
    summary,
    checks,
  };
  return report;
}
export function createAuditCommand(): Command {
  const cmd = new Command('audit')
    .description('Run local security and hygiene audit for Monica CLI secrets/config')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('--repo-path <path>', 'Repository path to scan (default: current directory)')
    .option('--strict', 'Exit with code 1 if any warning or failure is detected')
    .action(function (this: Command, options: AuditOptions): void {
      const actionCommand = getActionCommand(this);
      const format = getOutputFormat(actionCommand);
      const report = runAudit(options);
      console.log(fmt.formatOutput(report, format));
      if (report.summary.fail > 0 || (options.strict && report.summary.warn > 0)) {
        process.exit(1);
      }
    });
  return cmd;
}
