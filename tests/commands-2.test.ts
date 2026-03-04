import { describe, it, expect, beforeEach } from 'vitest';
import { Command } from 'commander';
import * as commands from '../src/commands';
import { getSubcommandNames, getOptionFlags, hasSubcommand } from './mocks/command-helpers';

describe('CLI Commands - Part 2: Additional Commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Calls Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createCallsCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('create');
      expect(subcommands).toContain('update');
      expect(subcommands).toContain('delete');
    });
  });

  describe('Gifts Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createGiftsCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('create');
      expect(subcommands).toContain('update');
      expect(subcommands).toContain('delete');
    });
  });

  describe('Debts Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createDebtsCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('create');
      expect(subcommands).toContain('update');
      expect(subcommands).toContain('delete');
    });
  });

  describe('Addresses Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createAddressesCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('create');
      expect(subcommands).toContain('update');
      expect(subcommands).toContain('delete');
    });
  });

  describe('Journal Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createJournalCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('create');
      expect(subcommands).toContain('update');
      expect(subcommands).toContain('delete');
    });
  });

  describe('Groups Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createGroupsCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('create');
      expect(subcommands).toContain('update');
      expect(subcommands).toContain('delete');
      expect(subcommands).toContain('attach-contacts');
      expect(subcommands).toContain('detach-contacts');
    });
  });

  describe('Documents Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createDocumentsCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('delete');
      expect(subcommands).not.toContain('create');
      expect(subcommands).not.toContain('update');
    });
  });

  describe('Photos Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createPhotosCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('delete');
      expect(subcommands).not.toContain('create');
      expect(subcommands).not.toContain('update');
    });
  });

  describe('Occupations Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createOccupationsCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('create');
      expect(subcommands).toContain('update');
      expect(subcommands).toContain('delete');
    });
  });

  describe('Conversations Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createConversationsCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('create');
      expect(subcommands).toContain('update');
      expect(subcommands).toContain('delete');
      expect(subcommands).toContain('messages');
      expect(subcommands).toContain('add-message');
    });
  });

  describe('Relationships Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createRelationshipsCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('create');
      expect(subcommands).toContain('update');
      expect(subcommands).toContain('delete');
      expect(subcommands).toContain('types');
      expect(subcommands).toContain('type');
      expect(subcommands).toContain('groups');
      expect(subcommands).toContain('group');
    });
  });

  describe('User Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createUserCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('me');
      expect(subcommands).toContain('show');
      expect(subcommands).toContain('compliance');
      expect(subcommands).toContain('sign-compliance');
    });
  });

  describe('Genders Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createGendersCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('create');
      expect(subcommands).toContain('update');
      expect(subcommands).toContain('delete');
    });
  });

  describe('Countries Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createCountriesCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('list');
      expect(subcommands).not.toContain('get');
      expect(subcommands).not.toContain('create');
    });
  });

  describe('Currencies Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createCurrenciesCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).not.toContain('create');
    });
  });

  describe('Activity Types Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createActivityTypesCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('create');
      expect(subcommands).toContain('update');
      expect(subcommands).toContain('delete');
    });
  });

  describe('Activity Type Categories Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createActivityTypeCategoriesCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('create');
      expect(subcommands).toContain('update');
      expect(subcommands).toContain('delete');
    });
  });

  describe('Contact Field Types Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createContactFieldTypesCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('create');
      expect(subcommands).toContain('update');
      expect(subcommands).toContain('delete');
    });
  });

  describe('Contact Fields Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createContactFieldsCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('create');
      expect(subcommands).toContain('update');
      expect(subcommands).toContain('delete');
    });
  });

  describe('Audit Logs Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createAuditLogsCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('list');
      expect(subcommands).not.toContain('get');
      expect(subcommands).not.toContain('create');
      expect(subcommands).not.toContain('delete');
    });
  });

  describe('Pets Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createPetsCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('create');
      expect(subcommands).toContain('update');
      expect(subcommands).toContain('delete');
    });
  });
});

import { vi } from 'vitest';
