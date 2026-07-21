let runtimeFieldSelection: string[] | undefined;

/** Executes the set runtime field selection operation. */
export function setRuntimeFieldSelection(fields?: string[]): void {
  runtimeFieldSelection = fields && fields.length > 0 ? fields : undefined;
}

/** Gets runtime field selection. */
export function getRuntimeFieldSelection(): string[] | undefined {
  return runtimeFieldSelection;
}

/** Resets runtime field selection. */
export function resetRuntimeFieldSelection(): void {
  runtimeFieldSelection = undefined;
}
