import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

interface CommandNode {
  fullCommand: string;
  subcommands?: CommandNode[];
}

interface CommandCatalogPayload {
  commandTree: CommandNode;
}

interface AuditFailure {
  command: string;
  reason: string;
}

const CLI_ENTRYPOINT = resolve('dist/index.js');

function runCli(args: string[]): ReturnType<typeof spawnSync> {
  return spawnSync(process.execPath, [CLI_ENTRYPOINT, ...args], {
    encoding: 'utf8',
    timeout: 45000,
    maxBuffer: 4 * 1024 * 1024,
    env: process.env,
  });
}

function loadCommandCatalog(): CommandCatalogPayload {
  const result = runCli(['--json', 'info', 'command-catalog']);
  if (result.status !== 0) {
    throw new Error(`Unable to load built command catalog: ${result.stderr || result.error?.message || 'unknown error'}`);
  }
  return JSON.parse(result.stdout as string) as CommandCatalogPayload;
}

function collectCommands(node: CommandNode, acc: string[] = []): string[] {
  acc.push(node.fullCommand);
  for (const subcommand of node.subcommands ?? []) {
    collectCommands(subcommand, acc);
  }
  return acc;
}

function shouldRequireInheritedFooter(command: string): boolean {
  return command !== 'monica' && !command.endsWith(' help');
}

function runHelp(command: string): { ok: boolean; output: string; reason?: string } {
  const result = runCli([...command.split(' ').slice(1), '--help']);

  if (result.error) {
    return { ok: false, output: `${result.stdout || ''}\n${result.stderr || ''}`.trim(), reason: result.error.message };
  }
  if (result.status !== 0) {
    return { ok: false, output: `${result.stdout || ''}\n${result.stderr || ''}`.trim(), reason: `exit ${result.status}` };
  }

  const output = `${result.stdout || ''}\n${result.stderr || ''}`.trim();
  return { ok: true, output };
}

function main(): void {
  const catalog = loadCommandCatalog();
  const commands = collectCommands(catalog.commandTree);
  const failures: AuditFailure[] = [];

  for (const command of commands) {
    const result = runHelp(command);
    if (!result.ok) {
      failures.push({ command, reason: result.reason || 'unknown error' });
      continue;
    }
    if (!result.output.includes('Usage:')) {
      failures.push({ command, reason: 'missing Usage section' });
      continue;
    }
    if (shouldRequireInheritedFooter(command) && !result.output.includes('Inherited global options:')) {
      failures.push({ command, reason: 'missing inherited global options footer' });
    }
  }

  const passed = commands.length - failures.length;
  console.log(`SUMMARY|total=${commands.length}|pass=${passed}|fail=${failures.length}`);
  if (failures.length > 0) {
    for (const failure of failures.slice(0, 30)) {
      console.log(`FAIL|${failure.command}|${failure.reason}`);
    }
    process.exit(1);
  }
}

main();
