export function getSubcommandNames(cmd: { commands: { name: () => string }[] }): string[] {
  return cmd.commands.map((c) => c.name());
}

export function getOptionFlags(cmd: { options: { long: string | undefined }[] }): string[] {
  return cmd.options.map((o) => o.long).filter(Boolean) as string[];
}

export function hasSubcommand(cmd: { commands: { name: () => string }[] }, name: string): boolean {
  return cmd.commands.some((c) => c.name() === name);
}
