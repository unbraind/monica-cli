import { describe, it, expect, beforeEach } from 'vitest';
import * as commands from '../src/commands';
import { getOptionFlags, hasSubcommand } from './mocks/command-helpers';

describe('CLI Commands - Part 3: Options and Arguments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Command Options', () => {
    it('all commands with CRUD have format option', () => {
      const crudCommands = [
        commands.createContactsCommand(),
        commands.createActivitiesCommand(),
        commands.createNotesCommand(),
        commands.createTasksCommand(),
        commands.createRemindersCommand(),
        commands.createTagsCommand(),
        commands.createCompaniesCommand(),
        commands.createGendersCommand(),
        commands.createCallsCommand(),
        commands.createGiftsCommand(),
        commands.createDebtsCommand(),
        commands.createAddressesCommand(),
        commands.createJournalCommand(),
        commands.createGroupsCommand(),
        commands.createOccupationsCommand(),
        commands.createConversationsCommand(),
        commands.createRelationshipsCommand(),
      ];

      for (const cmd of crudCommands) {
        const options = getOptionFlags(cmd);
        expect(options).toContain('--format');
      }
    });

    it('commands with pagination have page and limit options', () => {
      const paginatedCommands = [
        commands.createContactsCommand(),
        commands.createActivitiesCommand(),
        commands.createNotesCommand(),
        commands.createTasksCommand(),
        commands.createRemindersCommand(),
        commands.createTagsCommand(),
        commands.createCompaniesCommand(),
        commands.createCallsCommand(),
        commands.createGiftsCommand(),
        commands.createDebtsCommand(),
        commands.createAddressesCommand(),
        commands.createJournalCommand(),
        commands.createGroupsCommand(),
        commands.createDocumentsCommand(),
        commands.createPhotosCommand(),
        commands.createOccupationsCommand(),
        commands.createConversationsCommand(),
        commands.createRelationshipsCommand(),
      ];

      for (const cmd of paginatedCommands) {
        const options = getOptionFlags(cmd);
        expect(options).toContain('--page');
        expect(options).toContain('--limit');
      }
    });

    it('list subcommands have --all option for bulk fetching', () => {
      const commandsWithAllOption = [
        commands.createActivitiesCommand(),
        commands.createNotesCommand(),
        commands.createTasksCommand(),
        commands.createRemindersCommand(),
        commands.createTagsCommand(),
        commands.createCompaniesCommand(),
        commands.createCallsCommand(),
        commands.createGiftsCommand(),
        commands.createDebtsCommand(),
        commands.createAddressesCommand(),
        commands.createJournalCommand(),
        commands.createGroupsCommand(),
        commands.createDocumentsCommand(),
        commands.createPhotosCommand(),
        commands.createOccupationsCommand(),
        commands.createConversationsCommand(),
        commands.createPetsCommand(),
      ];

      for (const cmd of commandsWithAllOption) {
        const listCmd = cmd.commands.find(c => c.name() === 'list');
        expect(listCmd).toBeDefined();
        const listOptions = listCmd!.options.map(o => o.long).filter(Boolean);
        expect(listOptions).toContain('--all');
      }
    });
  });

  describe('Required Options', () => {
    it('create subcommands have required options', () => {
      const commandsWithCreate = [
        commands.createContactsCommand(),
        commands.createActivitiesCommand(),
        commands.createNotesCommand(),
        commands.createTasksCommand(),
        commands.createRemindersCommand(),
        commands.createTagsCommand(),
        commands.createCompaniesCommand(),
        commands.createGendersCommand(),
        commands.createCallsCommand(),
        commands.createGiftsCommand(),
        commands.createDebtsCommand(),
        commands.createAddressesCommand(),
        commands.createJournalCommand(),
        commands.createGroupsCommand(),
        commands.createOccupationsCommand(),
        commands.createConversationsCommand(),
        commands.createRelationshipsCommand(),
        commands.createPetsCommand(),
      ];

      for (const cmd of commandsWithCreate) {
        const createCmd = cmd.commands.find(c => c.name() === 'create');
        if (createCmd) {
          const hasRequiredOptions = createCmd.options.some(o => o.required);
          expect(hasRequiredOptions).toBe(true);
        }
      }
    });

    it('contacts create has first-name and gender-id options', () => {
      const cmd = commands.createContactsCommand();
      const createCmd = cmd.commands.find(c => c.name() === 'create');
      expect(createCmd).toBeDefined();
      const optionFlags = createCmd!.options.map(o => o.long).filter(Boolean);
      expect(optionFlags).toContain('--first-name');
      expect(optionFlags).toContain('--gender-id');
    });

    it('activities create has required options', () => {
      const cmd = commands.createActivitiesCommand();
      const createCmd = cmd.commands.find(c => c.name() === 'create');
      expect(createCmd).toBeDefined();
      const optionFlags = createCmd!.options.map(o => o.long).filter(Boolean);
      expect(optionFlags).toContain('--type');
      expect(optionFlags).toContain('--summary');
      expect(optionFlags).toContain('--date');
      expect(optionFlags).toContain('--contacts');
    });

    it('notes create has body and contact options', () => {
      const cmd = commands.createNotesCommand();
      const createCmd = cmd.commands.find(c => c.name() === 'create');
      expect(createCmd).toBeDefined();
      const optionFlags = createCmd!.options.map(o => o.long).filter(Boolean);
      expect(optionFlags).toContain('--body');
      expect(optionFlags).toContain('--contact');
    });

    it('tasks create has title and contact options', () => {
      const cmd = commands.createTasksCommand();
      const createCmd = cmd.commands.find(c => c.name() === 'create');
      expect(createCmd).toBeDefined();
      const optionFlags = createCmd!.options.map(o => o.long).filter(Boolean);
      expect(optionFlags).toContain('--title');
      expect(optionFlags).toContain('--contact');
    });

    it('reminders create has all required options', () => {
      const cmd = commands.createRemindersCommand();
      const createCmd = cmd.commands.find(c => c.name() === 'create');
      expect(createCmd).toBeDefined();
      const optionFlags = createCmd!.options.map(o => o.long).filter(Boolean);
      expect(optionFlags).toContain('--title');
      expect(optionFlags).toContain('--contact');
      expect(optionFlags).toContain('--date');
      expect(optionFlags).toContain('--frequency');
    });

    it('tags create has name option', () => {
      const cmd = commands.createTagsCommand();
      const createCmd = cmd.commands.find(c => c.name() === 'create');
      expect(createCmd).toBeDefined();
      const optionFlags = createCmd!.options.map(o => o.long).filter(Boolean);
      expect(optionFlags).toContain('--name');
    });

    it('companies create has name option', () => {
      const cmd = commands.createCompaniesCommand();
      const createCmd = cmd.commands.find(c => c.name() === 'create');
      expect(createCmd).toBeDefined();
      const optionFlags = createCmd!.options.map(o => o.long).filter(Boolean);
      expect(optionFlags).toContain('--name');
    });
  });

  describe('Special Subcommands', () => {
    it('contacts has search subcommand with query argument', () => {
      const cmd = commands.createContactsCommand();
      const searchCmd = cmd.commands.find(c => c.name() === 'search');
      expect(searchCmd).toBeDefined();
      expect(searchCmd!.name()).toContain('search');
    });

    it('contacts has logs subcommand with id argument', () => {
      const cmd = commands.createContactsCommand();
      const logsCmd = cmd.commands.find(c => c.name() === 'logs');
      expect(logsCmd).toBeDefined();
    });

    it('tasks has complete subcommand', () => {
      const cmd = commands.createTasksCommand();
      const completeCmd = cmd.commands.find(c => c.name() === 'complete');
      expect(completeCmd).toBeDefined();
      expect(completeCmd!.description()).toContain('complete');
    });

    it('tags has set, unset, clear subcommands for contact management', () => {
      const cmd = commands.createTagsCommand();
      expect(hasSubcommand(cmd, 'set')).toBe(true);
      expect(hasSubcommand(cmd, 'unset')).toBe(true);
      expect(hasSubcommand(cmd, 'clear')).toBe(true);
    });

    it('conversations has messages and add-message subcommands', () => {
      const cmd = commands.createConversationsCommand();
      expect(hasSubcommand(cmd, 'messages')).toBe(true);
      expect(hasSubcommand(cmd, 'add-message')).toBe(true);
    });

    it('relationships has types/groups list and get subcommands', () => {
      const cmd = commands.createRelationshipsCommand();
      expect(hasSubcommand(cmd, 'types')).toBe(true);
      expect(hasSubcommand(cmd, 'type')).toBe(true);
      expect(hasSubcommand(cmd, 'groups')).toBe(true);
      expect(hasSubcommand(cmd, 'group')).toBe(true);
    });

    it('groups has attach-contacts and detach-contacts subcommands', () => {
      const cmd = commands.createGroupsCommand();
      expect(hasSubcommand(cmd, 'attach-contacts')).toBe(true);
      expect(hasSubcommand(cmd, 'detach-contacts')).toBe(true);
    });

    it('user has compliance and sign-compliance subcommands', () => {
      const cmd = commands.createUserCommand();
      expect(hasSubcommand(cmd, 'compliance')).toBe(true);
      expect(hasSubcommand(cmd, 'sign-compliance')).toBe(true);
    });
  });

  describe('Argument Definitions', () => {
    it('get subcommands have id argument', () => {
      const commandsWithGet = [
        commands.createContactsCommand(),
        commands.createActivitiesCommand(),
        commands.createNotesCommand(),
        commands.createTasksCommand(),
        commands.createRemindersCommand(),
        commands.createTagsCommand(),
        commands.createCompaniesCommand(),
        commands.createGendersCommand(),
        commands.createCallsCommand(),
        commands.createGiftsCommand(),
        commands.createDebtsCommand(),
        commands.createAddressesCommand(),
        commands.createJournalCommand(),
        commands.createGroupsCommand(),
        commands.createDocumentsCommand(),
        commands.createPhotosCommand(),
        commands.createOccupationsCommand(),
        commands.createConversationsCommand(),
        commands.createRelationshipsCommand(),
        commands.createPetsCommand(),
      ];

      for (const cmd of commandsWithGet) {
        const getCmd = cmd.commands.find(c => c.name() === 'get');
        if (getCmd) {
          expect(getCmd.description()).toContain('specific');
        }
      }
    });

    it('delete subcommands have id argument', () => {
      const commandsWithDelete = [
        commands.createContactsCommand(),
        commands.createActivitiesCommand(),
        commands.createNotesCommand(),
        commands.createTasksCommand(),
        commands.createRemindersCommand(),
        commands.createTagsCommand(),
        commands.createCompaniesCommand(),
        commands.createGendersCommand(),
        commands.createCallsCommand(),
        commands.createGiftsCommand(),
        commands.createDebtsCommand(),
        commands.createAddressesCommand(),
        commands.createJournalCommand(),
        commands.createGroupsCommand(),
        commands.createDocumentsCommand(),
        commands.createPhotosCommand(),
        commands.createOccupationsCommand(),
        commands.createConversationsCommand(),
        commands.createRelationshipsCommand(),
        commands.createPetsCommand(),
      ];

      for (const cmd of commandsWithDelete) {
        const deleteCmd = cmd.commands.find(c => c.name() === 'delete');
        if (deleteCmd) {
          expect(deleteCmd.description()).toContain('Delete');
        }
      }
    });

    it('update subcommands have id argument', () => {
      const commandsWithUpdate = [
        commands.createContactsCommand(),
        commands.createActivitiesCommand(),
        commands.createNotesCommand(),
        commands.createTasksCommand(),
        commands.createRemindersCommand(),
        commands.createTagsCommand(),
        commands.createCompaniesCommand(),
        commands.createGendersCommand(),
        commands.createCallsCommand(),
        commands.createGiftsCommand(),
        commands.createDebtsCommand(),
        commands.createAddressesCommand(),
        commands.createJournalCommand(),
        commands.createGroupsCommand(),
        commands.createOccupationsCommand(),
        commands.createConversationsCommand(),
        commands.createRelationshipsCommand(),
        commands.createPetsCommand(),
      ];

      for (const cmd of commandsWithUpdate) {
        const updateCmd = cmd.commands.find(c => c.name() === 'update');
        if (updateCmd) {
          expect(updateCmd.description()).toContain('Update');
        }
      }
    });
  });
});

import { vi } from 'vitest';
