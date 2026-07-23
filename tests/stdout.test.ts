import { describe, expect, it, vi } from 'vitest';
import * as fmt from '../src/formatters';
import { writeFormattedOutput } from '../src/commands/stdout';

describe('structured stdout', () => {
  it('waits for the stdout callback after rendering the complete payload', async () => {
    vi.spyOn(fmt, 'formatOutput').mockReturnValue('rendered');
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(((
      chunk: unknown,
      callback?: unknown,
    ) => {
      expect(chunk).toBe('rendered\n');
      if (typeof callback === 'function') callback();
      return true;
    }) as typeof process.stdout.write);
    await writeFormattedOutput({ large: true }, 'json');
    expect(write).toHaveBeenCalledOnce();
  });
});
