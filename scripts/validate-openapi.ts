import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildOpenApiDocument } from '../src/commands/api-research-openapi';

const validationDirectory = mkdtempSync(join(tmpdir(), 'monica-openapi-validation-'));

try {
  const contracts = [
    { file: 'stable-3.2.json', edition: 'stable', version: '3.2.0' },
    { file: 'next-3.1.json', edition: 'next', version: '3.1.2' },
  ] as const;

  for (const contract of contracts) {
    const path = join(validationDirectory, contract.file);
    writeFileSync(
      path,
      `${JSON.stringify(buildOpenApiDocument(contract.edition, contract.version), null, 2)}\n`,
      { encoding: 'utf8', mode: 0o600 },
    );
    const bunx = process.platform === 'win32' ? 'bunx.cmd' : 'bunx';
    const result = spawnSync(bunx, ['redocly', 'lint', '--max-problems', '10', path], {
      encoding: 'utf8',
      stdio: 'inherit',
    });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exitCode = result.status ?? 1;
  }
} finally {
  rmSync(validationDirectory, { recursive: true, force: true });
}
