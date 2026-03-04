import { describe, expect, it } from 'vitest';
import { buildWriteGuardCommands } from '../scripts/e2e-readonly-commands';

describe('e2e readonly write guards', () => {
  it('includes baseline mutating commands', () => {
    const commands = buildWriteGuardCommands(null);
    expect(commands).toContain("monica contacts create --first-name 'read-only-guard' --gender-id 1");
    expect(commands).toContain("monica tags create --name 'read-only-guard'");
    expect(commands).toContain("monica companies create --name 'read-only-guard'");
  });

  it('adds contact-scoped mutating commands when contact id is available', () => {
    const commands = buildWriteGuardCommands(42);
    expect(commands).toContain("monica tasks create --title 'read-only-guard' --contact 42");
    expect(commands).toContain("monica notes create --body 'read-only-guard' --contact 42");
  });
});
