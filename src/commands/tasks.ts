import { Command } from 'commander';
import type { Task, TaskCreateInput, TaskUpdateInput } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';
import { createCrudCommand, runCommandAction } from './crud-command';
import { parsePositiveInteger } from './global-options';
import { resolveCommandOutputFormat } from './output-format';

/** Build task update data while preserving fields omitted by the caller. */
function taskUpdateInput(options: Record<string, unknown>, current: Task): TaskUpdateInput {
  let completed = current.completed ? 1 : 0;
  if (options.completed === true) completed = 1;
  if (options.notCompleted === true) completed = 0;
  return {
    title: (options.title as string | undefined) ?? current.title,
    description: (options.description as string | undefined) ?? current.description ?? undefined,
    contact_id: current.contact?.id ?? 0,
    completed,
  };
}

/** Build the task CRUD and completion command family. */
export function createTasksCommand(): Command {
  const command = createCrudCommand<Task, TaskCreateInput, TaskUpdateInput>({
    name: 'tasks',
    description: 'Manage tasks',
    singular: 'task',
    label: 'Task',
    fields: fmt.TaskFields,
    listPage: api.listTasks,
    listAll: (options) => api.listAllTasks({ sort: options.sort }),
    get: api.getTask,
    create: api.createTask,
    update: api.updateTask,
    remove: api.deleteTask,
    configureList: (candidate) => candidate.option(
      '-s, --sort <field>',
      'Sort field (created_at|completed_at)',
    ),
    configureCreate: (candidate) => candidate
      .requiredOption('--title <title>', 'Task title')
      .requiredOption('--contact <id>', 'Contact ID', parsePositiveInteger)
      .option('--description <text>', 'Description')
      .option('--completed', 'Mark as completed'),
    configureUpdate: (candidate) => candidate
      .option('--title <title>', 'Task title')
      .option('--description <text>', 'Description')
      .option('--completed', 'Mark as completed')
      .option('--not-completed', 'Mark as not completed'),
    buildCreateInput: (options) => ({
      title: options.title as string,
      description: options.description as string | undefined,
      contact_id: options.contact as number,
      completed: options.completed === true ? 1 : 0,
    }),
    buildUpdateInput: taskUpdateInput,
  });

  command.command('complete <id>')
    .description('Mark a task as complete')
    .action(async function (this: Command, id: string): Promise<void> {
      await runCommandAction(async () => {
        const resourceId = parsePositiveInteger(id);
        const current = await api.getTask(resourceId);
        const result = await api.updateTask(resourceId, {
          title: current.data.title,
          description: current.data.description ?? undefined,
          contact_id: current.data.contact?.id ?? 0,
          completed: 1,
        });
        console.log(fmt.formatSuccess('Task completed', result.data.id));
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      });
    });

  return command;
}
