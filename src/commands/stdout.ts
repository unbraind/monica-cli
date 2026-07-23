import type { OutputFormat } from '../types';
import * as fmt from '../formatters';

/** Render and fully drain one structured payload before the CLI exits. */
export async function writeFormattedOutput(payload: unknown, format: OutputFormat): Promise<void> {
  const output = `${fmt.formatOutput(payload, format)}\n`;
  await new Promise<void>((resolveDrain) => {
    process.stdout.write(output, () => resolveDrain());
  });
}
