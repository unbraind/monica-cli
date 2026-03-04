import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';

export function createConversationsCommand(): Command {
  const cmd = new Command('conversations')
    .description('Manage conversations')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parseInt)
    .option('-l, --limit <limit>', 'Items per page', parseInt);

  const ConversationFields = ['id', 'happened_at', 'created_at'];

  cmd
    .command('list')
    .description('List all conversations')
    .option('--all', 'Fetch all pages')
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        if (options.all) {
          const conversations = await api.listAllConversations();
          console.log(fmt.formatOutput(conversations, format, { fields: ConversationFields }));
        } else {
          const result = await api.listConversations({
            page: parentOpts.page,
            limit: parentOpts.limit,
          });
          console.log(fmt.formatPaginatedResponse(result, format, ConversationFields));
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('get <id>')
    .description('Get a specific conversation')
    .action(async (id, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.getConversation(parseInt(id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('create')
    .description('Create a new conversation')
    .requiredOption('--contact <id>', 'Contact ID', parseInt)
    .requiredOption('--happened-at <date>', 'Date/time (YYYY-MM-DD)', String)
    .requiredOption('--contact-field-type <id>', 'Contact field type ID', parseInt)
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.createConversation({
          contact_id: options.contact,
          happened_at: options.happenedAt,
          contact_field_type_id: options.contactFieldType,
        });
        console.log(fmt.formatSuccess('Conversation created', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('update <id>')
    .description('Update a conversation')
    .requiredOption('--happened-at <date>', 'Date/time (YYYY-MM-DD)', String)
    .action(async (id, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.updateConversation(parseInt(id), {
          happened_at: options.happenedAt,
        });
        console.log(fmt.formatSuccess('Conversation updated', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('delete <id>')
    .description('Delete a conversation')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.deleteConversation(parseInt(id));
        if (format === 'json') {
          console.log(JSON.stringify(result));
        } else {
          console.log(fmt.formatDeleted(result.id));
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('messages <id>')
    .description('List messages in a conversation')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.listConversationMessages(parseInt(id), {
          page: parentOpts.page,
          limit: parentOpts.limit,
        });
        console.log(fmt.formatPaginatedResponse(result, format, ['id', 'body', 'created_at']));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('add-message <id>')
    .description('Add a message to a conversation')
    .requiredOption('--content <text>', 'Message content')
    .requiredOption('--contact <id>', 'Contact ID', parseInt)
    .requiredOption('--written-at <date>', 'Written date (YYYY-MM-DD)', String)
    .requiredOption('--written-by-me', 'Written by me (true/false)', (v) => v === 'true')
    .action(async (id, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.createConversationMessage(parseInt(id), {
          content: options.content,
          contact_id: options.contact,
          written_at: options.writtenAt,
          written_by_me: options.writtenByMe,
        });
        console.log(fmt.formatSuccess('Message added', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('update-message <id> <message-id>')
    .description('Update a message in a conversation')
    .requiredOption('--content <text>', 'Message content')
    .action(async (id, messageId, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.updateConversationMessage(parseInt(id), parseInt(messageId), {
          content: options.content,
        });
        console.log(fmt.formatSuccess('Message updated', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('delete-message <id> <message-id>')
    .description('Delete a message from a conversation')
    .action(async (id, messageId, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.deleteConversationMessage(parseInt(id), parseInt(messageId));
        if (format === 'json') {
          console.log(JSON.stringify(result));
        } else {
          console.log(fmt.formatDeleted(result.id));
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  return cmd;
}
