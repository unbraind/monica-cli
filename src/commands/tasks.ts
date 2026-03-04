import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';

export function createTasksCommand(): Command {
  const cmd = new Command('tasks')
    .description('Manage tasks')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parseInt)
    .option('-l, --limit <limit>', 'Items per page', parseInt);

  cmd
    .command('list')
    .description('List all tasks')
    .option('--all', 'Fetch all pages')
    .option('-s, --sort <field>', 'Sort field (created_at|completed_at)')
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        if (options.all) {
          const tasks = await api.listAllTasks({ sort: options.sort });
          console.log(fmt.formatOutput(tasks, format, { fields: fmt.TaskFields }));
        } else {
          const result = await api.listTasks({
            page: parentOpts.page,
            limit: parentOpts.limit,
            sort: options.sort,
          });
          console.log(fmt.formatPaginatedResponse(result, format, fmt.TaskFields));
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('get <id>')
    .description('Get a specific task')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.getTask(parseInt(id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('create')
    .description('Create a new task')
    .requiredOption('--title <title>', 'Task title')
    .requiredOption('--contact <id>', 'Contact ID', parseInt)
    .option('--description <text>', 'Description')
    .option('--completed', 'Mark as completed')
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.createTask({
          title: options.title,
          description: options.description,
          contact_id: options.contact,
          completed: options.completed ? 1 : 0,
        });
        console.log(fmt.formatSuccess('Task created', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('update <id>')
    .description('Update a task')
    .option('--title <title>', 'Task title')
    .option('--description <text>', 'Description')
    .option('--completed', 'Mark as completed')
    .option('--not-completed', 'Mark as not completed')
    .action(async (id, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const current = await api.getTask(parseInt(id));
        const data = current.data;
        
        let completed: number;
        if (options.completed) {
          completed = 1;
        } else if (options.notCompleted) {
          completed = 0;
        } else {
          completed = data.completed ? 1 : 0;
        }
        
        const result = await api.updateTask(parseInt(id), {
          title: options.title || data.title,
          description: options.description ?? data.description,
          contact_id: data.contact?.id || 0,
          completed,
        });
        console.log(fmt.formatSuccess('Task updated', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('complete <id>')
    .description('Mark a task as complete')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const current = await api.getTask(parseInt(id));
        const data = current.data;
        
        const result = await api.updateTask(parseInt(id), {
          title: data.title,
          description: data.description || undefined,
          contact_id: data.contact?.id || 0,
          completed: 1,
        });
        console.log(fmt.formatSuccess('Task completed', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('delete <id>')
    .description('Delete a task')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.deleteTask(parseInt(id));
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
