import { describe, it, expect, beforeEach } from 'vitest';
import * as commands from '../src/commands';
import { getOptionFlags, hasSubcommand } from './mocks/command-helpers';

describe('CLI Commands - Part 3: Options and Arguments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
