import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as settings from '../src/utils/settings';
import { createProgram } from '../src/program';
import { Command } from 'commander';
import { inheritOptionFromParents } from '../src/program';

describe('program global flag propagation', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(process.stdout, 'write').mockImplementation(((
      _chunk: unknown,
      encodingOrCallback?: unknown,
      callback?: unknown,
    ) => {
      const done = typeof encodingOrCallback === 'function' ? encodingOrCallback : callback;
      if (typeof done === 'function') done();
      return true;
    }) as typeof process.stdout.write);
    vi.spyOn(settings, 'loadSettings').mockReturnValue(null);
  });
  afterEach(() => vi.restoreAllMocks());

  async function parse(args: string[]): Promise<ReturnType<typeof createProgram>> {
    const argv = ['node', 'monica', ...args];
    const program = createProgram(argv);
    await program.parseAsync(args, { from: 'user' });
    return program;
  }

  it.each([
    ['--json', 'json'], ['--yaml', 'yaml'], ['--yml', 'yaml'], ['--table', 'table'],
    ['--md', 'md'], ['--markdown', 'md'],
  ])('applies %s to the action chain', async (flag, expected) => {
    const program = await parse([flag, 'info', 'command-catalog']);
    const info = program.commands.find((command) => command.name() === 'info');
    expect(info?.getOptionValue('format')).toBe(expected);
  });

  it('forces raw output to JSON and applies fields and request timeout', async () => {
    const program = await parse([
      '--raw', '--fields', 'id,name', '--request-timeout-ms', '2500',
      'info', 'command-catalog',
    ]);
    const info = program.commands.find((command) => command.name() === 'info');
    expect(info?.getOptionValue('format')).toBe('json');
    expect(process.env.MONICA_REQUEST_TIMEOUT_MS).toBe('2500');
  });

  it('honors explicit format and a configured non-TOON default', async () => {
    let program = await parse(['--format', 'table', 'info', 'command-catalog']);
    expect(program.commands.find((command) => command.name() === 'info')?.getOptionValue('format'))
      .toBe('table');
    (settings.loadSettings as unknown as ReturnType<typeof vi.fn>)
      .mockReturnValue({ defaultFormat: 'yaml' });
    program = await parse(['info', 'command-catalog']);
    expect(program.commands.find((command) => command.name() === 'info')?.getOptionValue('format'))
      .toBe('yaml');
  });

  it('inherits the closest defined parent option only when unset', () => {
    const root = new Command('root').option('--value <value>');
    const middle = new Command('middle').option('--value <value>');
    const leaf = new Command('leaf').option('--value <value>');
    root.addCommand(middle.addCommand(leaf));
    root.setOptionValue('value', 'root');
    middle.setOptionValue('value', 'middle');
    inheritOptionFromParents(leaf, 'value');
    expect(leaf.getOptionValue('value')).toBe('middle');
    leaf.setOptionValue('value', 'leaf');
    inheritOptionFromParents(leaf, 'value');
    expect(leaf.getOptionValue('value')).toBe('leaf');
  });
});
