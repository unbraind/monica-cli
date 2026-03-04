import { describe, it, expect, beforeEach } from 'vitest';
import { Command } from 'commander';
import * as commands from '../src/commands';
import { getSubcommandNames, getOptionFlags, hasSubcommand } from './mocks/command-helpers';

describe('CLI Commands - Part 1: Core Commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Command Creation', () => {
    it('creates contacts command', () => {
      const cmd = commands.createContactsCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('contacts');
      expect(cmd.description()).toBe('Manage contacts');
    });

    it('creates activities command', () => {
      const cmd = commands.createActivitiesCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('activities');
      expect(cmd.description()).toBe('Manage activities');
    });

    it('creates notes command', () => {
      const cmd = commands.createNotesCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('notes');
      expect(cmd.description()).toBe('Manage notes');
    });

    it('creates tasks command', () => {
      const cmd = commands.createTasksCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('tasks');
      expect(cmd.description()).toBe('Manage tasks');
    });

    it('creates reminders command', () => {
      const cmd = commands.createRemindersCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('reminders');
      expect(cmd.description()).toBe('Manage reminders');
    });

    it('creates tags command', () => {
      const cmd = commands.createTagsCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('tags');
      expect(cmd.description()).toBe('Manage tags');
    });

    it('creates companies command', () => {
      const cmd = commands.createCompaniesCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('companies');
      expect(cmd.description()).toBe('Manage companies');
    });

    it('creates info command', () => {
      const cmd = commands.createInfoCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('info');
      expect(cmd.description()).toBe('Get information about the Monica instance');
    });

    it('creates calls command', () => {
      const cmd = commands.createCallsCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('calls');
      expect(cmd.description()).toBe('Manage calls with contacts');
    });

    it('creates gifts command', () => {
      const cmd = commands.createGiftsCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('gifts');
      expect(cmd.description()).toBe('Manage gifts');
    });

    it('creates debts command', () => {
      const cmd = commands.createDebtsCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('debts');
      expect(cmd.description()).toBe('Manage debts');
    });

    it('creates addresses command', () => {
      const cmd = commands.createAddressesCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('addresses');
      expect(cmd.description()).toBe('Manage contact addresses');
    });

    it('creates journal command', () => {
      const cmd = commands.createJournalCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('journal');
      expect(cmd.description()).toBe('Manage journal entries');
    });

    it('creates groups command', () => {
      const cmd = commands.createGroupsCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('groups');
      expect(cmd.description()).toBe('Manage contact groups');
    });

    it('creates documents command', () => {
      const cmd = commands.createDocumentsCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('documents');
      expect(cmd.description()).toBe('Manage documents');
    });

    it('creates photos command', () => {
      const cmd = commands.createPhotosCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('photos');
      expect(cmd.description()).toBe('Manage photos');
    });

    it('creates occupations command', () => {
      const cmd = commands.createOccupationsCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('occupations');
      expect(cmd.description()).toBe('Manage occupations');
    });

    it('creates conversations command', () => {
      const cmd = commands.createConversationsCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('conversations');
      expect(cmd.description()).toBe('Manage conversations');
    });

    it('creates relationships command', () => {
      const cmd = commands.createRelationshipsCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('relationships');
      expect(cmd.description()).toBe('Manage relationships');
    });

    it('creates user command', () => {
      const cmd = commands.createUserCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('user');
      expect(cmd.description()).toBe('Get current user information');
    });

    it('creates genders command', () => {
      const cmd = commands.createGendersCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('genders');
      expect(cmd.description()).toBe('Manage genders');
    });

    it('creates countries command', () => {
      const cmd = commands.createCountriesCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('countries');
      expect(cmd.description()).toBe('List countries');
    });

    it('creates currencies command', () => {
      const cmd = commands.createCurrenciesCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('currencies');
      expect(cmd.description()).toBe('List currencies');
    });

    it('creates activity-types command', () => {
      const cmd = commands.createActivityTypesCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('activity-types');
      expect(cmd.description()).toBe('Manage activity types');
    });

    it('creates activity-type-categories command', () => {
      const cmd = commands.createActivityTypeCategoriesCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('activity-type-categories');
      expect(cmd.description()).toBe('Manage activity type categories');
    });

    it('creates contact-field-types command', () => {
      const cmd = commands.createContactFieldTypesCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('contact-field-types');
      expect(cmd.description()).toBe('Manage contact field types');
    });

    it('creates contact-fields command', () => {
      const cmd = commands.createContactFieldsCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('contact-fields');
      expect(cmd.description()).toBe('Manage contact fields');
    });

    it('creates audit-logs command', () => {
      const cmd = commands.createAuditLogsCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('audit-logs');
      expect(cmd.description()).toBe('List audit logs');
    });

    it('creates pets command', () => {
      const cmd = commands.createPetsCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('pets');
      expect(cmd.description()).toBe('Manage pets');
    });

    it('creates api-research command', () => {
      const cmd = commands.createApiResearchCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('api-research');
      expect(cmd.description()).toBe('Summarize Monica API resource/endpoint coverage for agent planning');
    });

    it('creates agent-runbook command', () => {
      const cmd = commands.createAgentRunbookCommand();
      expect(cmd).toBeInstanceOf(Command);
      expect(cmd.name()).toBe('agent-runbook');
      expect(cmd.description()).toBe('Generate a deterministic read-only execution runbook for agent workflows');
    });
  });

  describe('Contacts Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createContactsCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('create');
      expect(subcommands).toContain('update');
      expect(subcommands).toContain('delete');
      expect(subcommands).toContain('search');
      expect(subcommands).toContain('logs');
      expect(subcommands).toContain('birthdate');
      expect(subcommands).toContain('deceased');
      expect(subcommands).toContain('stay-in-touch');
      expect(subcommands).toContain('first-met');
      expect(subcommands).toContain('food-preferences');
      expect(subcommands).toContain('set-avatar');
      expect(subcommands).toContain('delete-avatar');
    });

    it('has format option', () => {
      const cmd = commands.createContactsCommand();
      const options = getOptionFlags(cmd);
      expect(options).toContain('--format');
    });

    it('has page and limit options', () => {
      const cmd = commands.createContactsCommand();
      const options = getOptionFlags(cmd);
      expect(options).toContain('--page');
      expect(options).toContain('--limit');
    });

    it('create subcommand has required options', () => {
      const cmd = commands.createContactsCommand();
      const createCmd = cmd.commands.find(c => c.name() === 'create');
      expect(createCmd).toBeDefined();
      const options = createCmd!.options;
      expect(options.some(o => o.required)).toBe(true);
    });
  });

  describe('Activities Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createActivitiesCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('create');
      expect(subcommands).toContain('update');
      expect(subcommands).toContain('delete');
    });

    it('has format option', () => {
      const cmd = commands.createActivitiesCommand();
      const options = getOptionFlags(cmd);
      expect(options).toContain('--format');
    });
  });

  describe('Notes Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createNotesCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('create');
      expect(subcommands).toContain('update');
      expect(subcommands).toContain('delete');
    });
  });

  describe('Tasks Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createTasksCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('create');
      expect(subcommands).toContain('update');
      expect(subcommands).toContain('complete');
      expect(subcommands).toContain('delete');
    });
  });

  describe('Reminders Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createRemindersCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('create');
      expect(subcommands).toContain('update');
      expect(subcommands).toContain('delete');
    });
  });

  describe('Tags Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createTagsCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('create');
      expect(subcommands).toContain('update');
      expect(subcommands).toContain('delete');
      expect(subcommands).toContain('set');
      expect(subcommands).toContain('unset');
      expect(subcommands).toContain('clear');
      expect(subcommands).toContain('contacts');
    });
  });

  describe('Companies Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createCompaniesCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('create');
      expect(subcommands).toContain('update');
      expect(subcommands).toContain('delete');
    });
  });

  describe('Info Command Subcommands', () => {
    it('has expected subcommands', () => {
      const cmd = commands.createInfoCommand();
      const subcommands = getSubcommandNames(cmd);
      
      expect(subcommands).toContain('me');
      expect(subcommands).toContain('genders');
      expect(subcommands).toContain('countries');
      expect(subcommands).toContain('currencies');
      expect(subcommands).toContain('activity-types');
      expect(subcommands).toContain('relationship-types');
      expect(subcommands).toContain('contact-field-types');
      expect(subcommands).toContain('capabilities');
      expect(subcommands).toContain('instance-profile');
      expect(subcommands).toContain('supported-commands');
      expect(subcommands).toContain('unsupported-commands');
      expect(subcommands).toContain('command-catalog');
    });
  });
});

import { vi } from 'vitest';
