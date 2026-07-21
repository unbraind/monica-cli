import { InvalidArgumentError, type Command } from 'commander';
import type { Conversation, ConversationCreateInput, ConversationUpdateInput } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';
import { createCrudCommand, runCommandAction } from './crud-command';
import { parsePositiveInteger } from './global-options';
import { resolveCommandOutputFormat } from './output-format';

const CONVERSATION_FIELDS = ['id', 'happened_at', 'created_at'];

/** Parse an explicit true or false option value. */
export function parseBoolean(value: string): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new InvalidArgumentError('Invalid boolean. Use: true or false');
}

/** Build the conversation and nested-message command family. */
export function createConversationsCommand(): Command {
  const command = createCrudCommand<Conversation, ConversationCreateInput, ConversationUpdateInput>({
    name: 'conversations', description: 'Manage conversations', singular: 'conversation',
    label: 'Conversation', fields: CONVERSATION_FIELDS,
    listPage: api.listConversations,
    listAll: () => api.listAllConversations(),
    get: api.getConversation,
    create: api.createConversation,
    update: api.updateConversation,
    remove: api.deleteConversation,
    configureCreate: (candidate) => candidate
      .requiredOption('--contact <id>', 'Contact ID', parsePositiveInteger)
      .requiredOption('--happened-at <date>', 'Date/time (YYYY-MM-DD)')
      .requiredOption('--contact-field-type <id>', 'Contact field type ID', parsePositiveInteger),
    configureUpdate: (candidate) => candidate.option('--happened-at <date>', 'Date/time (YYYY-MM-DD)'),
    buildCreateInput: (options) => ({
      contact_id: options.contact as number,
      happened_at: options.happenedAt as string,
      contact_field_type_id: options.contactFieldType as number,
    }),
    buildUpdateInput: (options, current) => ({
      happened_at: (options.happenedAt as string | undefined) ?? current.happened_at,
    }),
  });

  command.command('messages <id>').description('List messages in a conversation')
    .action(async function (this: Command, id: string): Promise<void> {
      await runCommandAction(async () => {
        const { page, limit } = this.parent?.opts() as { page?: number; limit?: number };
        const result = await api.listConversationMessages(parsePositiveInteger(id), { page, limit });
        console.log(fmt.formatPaginatedResponse(
          result, resolveCommandOutputFormat(this), ['id', 'body', 'created_at'],
        ));
      });
    });

  command.command('add-message <id>').description('Add a message to a conversation')
    .requiredOption('--content <text>', 'Message content')
    .requiredOption('--contact <id>', 'Contact ID', parsePositiveInteger)
    .requiredOption('--written-at <date>', 'Written date (YYYY-MM-DD)')
    .requiredOption('--written-by-me <boolean>', 'Whether the message was written by me', parseBoolean)
    .action(async function (this: Command, id: string): Promise<void> {
      await runCommandAction(async () => {
        const options = this.opts() as {
          content: string; contact: number; writtenAt: string; writtenByMe: boolean;
        };
        const result = await api.createConversationMessage(parsePositiveInteger(id), {
          content: options.content, contact_id: options.contact,
          written_at: options.writtenAt, written_by_me: options.writtenByMe,
        });
        console.log(fmt.formatSuccess('Message added', result.data.id));
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      });
    });

  command.command('update-message <id> <message-id>').description('Update a conversation message')
    .requiredOption('--content <text>', 'Message content')
    .action(async function (this: Command, id: string, messageId: string): Promise<void> {
      await runCommandAction(async () => {
        const result = await api.updateConversationMessage(
          parsePositiveInteger(id), parsePositiveInteger(messageId),
          { content: (this.opts() as { content: string }).content },
        );
        console.log(fmt.formatSuccess('Message updated', result.data.id));
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      });
    });

  command.command('delete-message <id> <message-id>').description('Delete a conversation message')
    .action(async function (this: Command, id: string, messageId: string): Promise<void> {
      await runCommandAction(async () => {
        const result = await api.deleteConversationMessage(
          parsePositiveInteger(id), parsePositiveInteger(messageId),
        );
        console.log(resolveCommandOutputFormat(this) === 'json'
          ? JSON.stringify(result) : fmt.formatDeleted(result.id));
      });
    });
  return command;
}
