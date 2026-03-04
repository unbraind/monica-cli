import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { validateOutput, type OutputValidation } from './e2e-output-validation';
import { buildBaseCommandChecks, buildWriteGuardCommands, type CommandCheck } from './e2e-readonly-commands';
interface RunResult {
  ok: boolean;
  code: number | null;
  stdout: string;
  stderr: string;
  error?: string;
}
interface E2ESummary {
  total: number;
  passed: number;
  expectedFailures: number;
  failed: number;
}
type CommandStatus = 'pass' | 'expected' | 'fail';
interface CommandResult {
  command: string;
  status: CommandStatus;
  outputValidation: OutputValidation;
  detail?: string;
}
interface E2EReport {
  generatedAt: string;
  timeoutMs: number;
  requestTimeoutMs: number;
  searchQuery: string;
  contactId: number | null;
  summary: E2ESummary;
  commands: CommandResult[];
}
interface SettingsSnapshot {
  exists: boolean;
  content: string;
  mode: number;
}
const TIMEOUT_MS = Number.parseInt(process.env.MONICA_E2E_TIMEOUT_MS ?? '90000', 10);
const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.MONICA_E2E_REQUEST_TIMEOUT_MS ?? '45000', 10);
const SEARCH_QUERY = process.env.MONICA_E2E_SEARCH_QUERY ?? 'example';
const FAIL_ON_TIMEOUT = process.env.MONICA_E2E_FAIL_ON_TIMEOUT === '1';
const VALIDATE_OUTPUT = process.env.MONICA_E2E_VALIDATE_OUTPUT !== '0';
const REPORT_PATH = process.env.MONICA_E2E_REPORT_PATH;
const SETTINGS_PATH = path.join(os.homedir(), '.monica-cli', 'settings.json');
function run(command: string): RunResult {
  const result = spawnSync('bash', ['-lc', command], {
    encoding: 'utf8',
    timeout: TIMEOUT_MS,
    maxBuffer: 16 * 1024 * 1024,
    env: process.env,
  });
  return {
    ok: result.status === 0,
    code: result.status,
    stdout: result.stdout?.trim() || '',
    stderr: result.stderr?.trim() || '',
    error: result.error?.message,
  };
}
function runJson(command: string): unknown | null {
  const result = run(command);
  if (!result.ok) return null;
  try {
    return JSON.parse(result.stdout);
  } catch {
    return null;
  }
}
function isExpectedFailure(result: RunResult): boolean {
  if (!FAIL_ON_TIMEOUT && result.error?.toLowerCase().includes('etimedout')) {
    return true;
  }
  const expectedPatterns = [
    'HTTP 404',
    'Read-only mode enabled',
    'Global contact field listing is unavailable on this Monica instance',
  ];
  return expectedPatterns.some((pattern) => result.stderr.includes(pattern));
}
function validateCommandOutput(check: CommandCheck, result: RunResult): string | null {
  if (!VALIDATE_OUTPUT) {
    return null;
  }
  return validateOutput(result.stdout, check.outputValidation);
}
function sanitizeDetail(detail: string): string {
  return detail.length <= 500 ? detail : `${detail.slice(0, 497)}...`;
}
function getReportPath(): string {
  if (REPORT_PATH?.trim()) {
    return path.resolve(REPORT_PATH.trim());
  }
  return path.join(os.homedir(), '.monica-cli', 'cache', 'e2e-readonly-last.json');
}
function writeReport(report: E2EReport): void {
  const reportPath = getReportPath();
  fs.mkdirSync(path.dirname(reportPath), { recursive: true, mode: 0o700 });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), { mode: 0o600 });
  console.log(`REPORT|${reportPath}`);
}
function captureSettingsSnapshot(filePath: string): SettingsSnapshot {
  if (!fs.existsSync(filePath)) {
    return { exists: false, content: '', mode: 0o600 };
  }
  const stats = fs.statSync(filePath);
  return {
    exists: true,
    content: fs.readFileSync(filePath, 'utf8'),
    mode: stats.mode & 0o777,
  };
}
function restoreSettingsSnapshot(filePath: string, snapshot: SettingsSnapshot): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  if (!snapshot.exists) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return;
  }
  fs.writeFileSync(filePath, snapshot.content, { mode: snapshot.mode });
  fs.chmodSync(filePath, snapshot.mode);
}
function runChecks(): number {
  const baseFlags = `--json --request-timeout-ms ${REQUEST_TIMEOUT_MS}`;
  const contactPayload = runJson(`monica ${baseFlags} contacts list --limit 1`) as { data?: Array<{ id?: number }> } | null;
  const contactId = contactPayload?.data?.[0]?.id ?? null;
  const relationshipTypesPayload = runJson(`monica ${baseFlags} relationships types`) as { data?: Array<{ id?: number }> } | Array<{ id?: number }> | null;
  const relationshipTypeId = Array.isArray(relationshipTypesPayload) ? (relationshipTypesPayload[0]?.id ?? null) : (relationshipTypesPayload?.data?.[0]?.id ?? null);
  const relationshipGroupsPayload = runJson(`monica ${baseFlags} relationships groups`) as { data?: Array<{ id?: number }> } | Array<{ id?: number }> | null;
  const relationshipGroupId = Array.isArray(relationshipGroupsPayload) ? (relationshipGroupsPayload[0]?.id ?? null) : (relationshipGroupsPayload?.data?.[0]?.id ?? null);
  const commands: CommandCheck[] = buildBaseCommandChecks({
    baseFlags,
    requestTimeoutMs: REQUEST_TIMEOUT_MS,
    searchQuery: SEARCH_QUERY,
  });
  if (contactId !== null) {
    commands.push({ command: `monica ${baseFlags} contacts get ${contactId} --with-fields`, outputValidation: 'json' });
    commands.push({ command: `monica ${baseFlags} pets list --contact-id ${contactId} --limit 2`, outputValidation: 'json' });
    commands.push({ command: `monica ${baseFlags} contact-fields list ${contactId} --limit 2`, outputValidation: 'json' });
    commands.push({ command: `monica ${baseFlags} relationships list ${contactId} --limit 2`, outputValidation: 'json' });
  }
  if (relationshipTypeId !== null) {
    commands.push({ command: `monica ${baseFlags} relationships type ${relationshipTypeId}`, outputValidation: 'json' });
  }
  if (relationshipGroupId !== null) {
    commands.push({ command: `monica ${baseFlags} relationships group ${relationshipGroupId}`, outputValidation: 'json' });
  }

  const writeGuardCommands = buildWriteGuardCommands(contactId);
  const summary: E2ESummary = {
    total: commands.length + writeGuardCommands.length,
    passed: 0,
    expectedFailures: 0,
    failed: 0,
  };
  const commandResults: CommandResult[] = [];
  console.log(`E2E read-only start: total=${summary.total}, contactId=${contactId ?? 'none'}, validateOutput=${VALIDATE_OUTPUT}`);
  commands.forEach((check) => {
    const result = run(check.command);
    if (result.ok) {
      const outputError = validateCommandOutput(check, result);
      if (outputError) {
        summary.failed += 1;
        const detail = sanitizeDetail(outputError);
        commandResults.push({
          command: check.command,
          status: 'fail',
          outputValidation: check.outputValidation,
          detail,
        });
        console.log(`FAIL|${check.command}|exit=${result.code ?? -1}|${detail}`);
        return;
      }
      summary.passed += 1;
      commandResults.push({
        command: check.command,
        status: 'pass',
        outputValidation: check.outputValidation,
      });
      console.log(`PASS|${check.command}`);
      return;
    }
    if (isExpectedFailure(result)) {
      summary.expectedFailures += 1;
      const detail = sanitizeDetail(result.error ? `${result.stderr} ${result.error}`.trim() : result.stderr);
      commandResults.push({
        command: check.command,
        status: 'expected',
        outputValidation: check.outputValidation,
        detail,
      });
      console.log(`EXPECTED|${check.command}|${detail}`);
      return;
    }
    summary.failed += 1;
    const detail = sanitizeDetail(result.error ? `${result.stderr} ${result.error}`.trim() : result.stderr);
    commandResults.push({
      command: check.command,
      status: 'fail',
      outputValidation: check.outputValidation,
      detail,
    });
    console.log(`FAIL|${check.command}|exit=${result.code ?? -1}|${detail}`);
  });
  writeGuardCommands.forEach((command) => {
    const writeGuard = run(command);
    const checkName = `write-block:${command}`;
    if (!writeGuard.ok && writeGuard.stderr.includes('Read-only mode enabled')) {
      summary.passed += 1;
      const detail = sanitizeDetail(writeGuard.stderr);
      commandResults.push({
        command: checkName,
        status: 'pass',
        outputValidation: 'none',
        detail,
      });
      console.log(`PASS|${checkName}|${detail}`);
      return;
    }

    summary.failed += 1;
    const detail = sanitizeDetail(writeGuard.error ? `${writeGuard.stderr} ${writeGuard.error}`.trim() : writeGuard.stderr);
    commandResults.push({
      command: checkName,
      status: 'fail',
      outputValidation: 'none',
      detail,
    });
    console.log(`FAIL|${checkName}|exit=${writeGuard.code ?? -1}|${detail}`);
  });
  console.log(
    `SUMMARY|total=${summary.total}|pass=${summary.passed}|expected=${summary.expectedFailures}|fail=${summary.failed}`
  );
  writeReport({
    generatedAt: new Date().toISOString(),
    timeoutMs: TIMEOUT_MS,
    requestTimeoutMs: REQUEST_TIMEOUT_MS,
    searchQuery: SEARCH_QUERY,
    contactId,
    summary,
    commands: commandResults,
  });
  return summary.failed > 0 ? 1 : 0;
}
function main(): void {
  const settingsSnapshot = captureSettingsSnapshot(SETTINGS_PATH);
  let exitCode = 1;
  try {
    exitCode = runChecks();
  } finally {
    restoreSettingsSnapshot(SETTINGS_PATH, settingsSnapshot);
    console.log(`SETTINGS_RESTORED|${SETTINGS_PATH}`);
  }
  if (exitCode > 0) {
    process.exit(exitCode);
  }
}
main();
