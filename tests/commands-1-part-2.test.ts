import { describe, it, expect, beforeEach } from 'vitest';
import { Command } from 'commander';
import * as commands from '../src/commands';
import { getSubcommandNames, getOptionFlags, hasSubcommand } from './mocks/command-helpers';

describe('CLI Commands - Part 1: Core Commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
