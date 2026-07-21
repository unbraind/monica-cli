import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../src/api';
import { createUserCommand } from '../src/commands/user';

describe('user command', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(api, 'getUser').mockResolvedValue({ data: { id: 1 } } as never);
  });
  afterEach(() => vi.restoreAllMocks());

  it('supports every current-user alias', async () => {
    await createUserCommand().parseAsync(['get'], { from: 'user' });
    await createUserCommand().parseAsync(['me'], { from: 'user' });
    await createUserCommand().parseAsync(['show'], { from: 'user' });
    expect(api.getUser).toHaveBeenCalledTimes(3);
  });

  it('reads all compliance status or one term', async () => {
    vi.spyOn(api, 'getUserComplianceStatus').mockResolvedValue({ data: [] });
    vi.spyOn(api, 'getUserComplianceStatusForTerm').mockResolvedValue({ data: { id: 2 } } as never);
    await createUserCommand().parseAsync(['compliance'], { from: 'user' });
    await createUserCommand().parseAsync(['compliance', '--id', '2'], { from: 'user' });
    expect(api.getUserComplianceStatus).toHaveBeenCalled();
    expect(api.getUserComplianceStatusForTerm).toHaveBeenCalledWith(2);
  });

  it('manages the user contact association and signs compliance', async () => {
    vi.spyOn(api, 'setMeContact').mockResolvedValue(['ok']);
    vi.spyOn(api, 'unsetMeContact').mockResolvedValue(['ok']);
    vi.spyOn(api, 'signCompliance').mockResolvedValue({ data: { id: 3 } } as never);
    await createUserCommand().parseAsync(['set-contact', '4'], { from: 'user' });
    await createUserCommand().parseAsync(['unset-contact'], { from: 'user' });
    await createUserCommand().parseAsync(['sign-compliance', '--ip', '127.0.0.1'], { from: 'user' });
    expect(api.setMeContact).toHaveBeenCalledWith(4);
    expect(api.unsetMeContact).toHaveBeenCalled();
    expect(api.signCompliance).toHaveBeenCalledWith({ ip_address: '127.0.0.1' });
  });

  it('uses the shared error contract', async () => {
    (api.getUser as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('offline'));
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    await createUserCommand().parseAsync(['get'], { from: 'user' });
    expect(exit).toHaveBeenCalledWith(1);
  });
});
