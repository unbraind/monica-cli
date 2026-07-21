import { Command } from 'commander';
import type { OutputFormat, PlaceInput } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';
import { parsePositiveInteger } from './global-options';
import { resolveCommandOutputFormat } from './output-format';

const PLACE_FIELDS = ['id', 'street', 'city', 'province', 'postal_code', 'country', 'latitude', 'longitude'];

function placeInput(options: Record<string, unknown>): PlaceInput {
  return {
    street: options.street as string | undefined,
    city: options.city as string | undefined,
    province: options.province as string | undefined,
    postal_code: options.postalCode as string | undefined,
    country: options.country as string | undefined,
    latitude: options.latitude as number | undefined,
    longitude: options.longitude as number | undefined,
  };
}

function addPlaceOptions(command: Command): Command {
  return command.option('--street <street>', 'Street address')
    .option('--city <city>', 'City')
    .option('--province <province>', 'State, region, or province')
    .option('--postal-code <code>', 'Postal code')
    .option('--country <code>', 'ISO country code (maximum 3 characters)')
    .option('--latitude <number>', 'Latitude', Number)
    .option('--longitude <number>', 'Longitude', Number);
}

/** Build the source-backed Monica 4.x place command tree. */
export function createPlacesCommand(): Command {
  const cmd = new Command('places')
    .description('Manage account places from the Monica 4.x API')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parsePositiveInteger)
    .option('-l, --limit <limit>', 'Items per page', parsePositiveInteger);

  cmd.command('list')
    .description('List places')
    .option('--all', 'Fetch all pages')
    .option('--sort <field>', 'Sort criterion')
    .action(async function (this: Command): Promise<void> {
      const options = this.opts() as { all?: boolean; sort?: string };
      const format = resolveCommandOutputFormat(this) as OutputFormat;
      try {
        const parentOptions = this.parent?.opts() as { page?: number; limit?: number };
        if (options.all) {
          const places = await api.listAllPlaces({ sort: options.sort });
          console.log(fmt.formatOutput(places, format, { fields: PLACE_FIELDS }));
          return;
        }
        const result = await api.listPlaces({
          page: parentOptions.page,
          limit: parentOptions.limit,
          sort: options.sort,
        });
        console.log(fmt.formatPaginatedResponse(result, format, PLACE_FIELDS));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd.command('get <id>')
    .description('Get one place')
    .action(async function (this: Command, id: string): Promise<void> {
      try {
        const result = await api.getPlace(parsePositiveInteger(id));
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  addPlaceOptions(cmd.command('create').description('Create a place'))
    .action(async function (this: Command): Promise<void> {
      try {
        const result = await api.createPlace(placeInput(this.opts()));
        console.log(fmt.formatSuccess('Place created', result.data.id));
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  addPlaceOptions(cmd.command('update <id>').description('Replace a place'))
    .action(async function (this: Command, id: string): Promise<void> {
      try {
        const result = await api.updatePlace(parsePositiveInteger(id), placeInput(this.opts()));
        console.log(fmt.formatSuccess('Place updated', result.data.id));
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd.command('delete <id>')
    .description('Delete a place')
    .action(async function (this: Command, id: string): Promise<void> {
      try {
        const result = await api.deletePlace(parsePositiveInteger(id));
        const output = resolveCommandOutputFormat(this) === 'json'
          ? JSON.stringify(result)
          : fmt.formatDeleted(result.id);
        console.log(output);
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  return cmd;
}
