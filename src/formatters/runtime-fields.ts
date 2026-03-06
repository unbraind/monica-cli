let runtimeFieldSelection: string[] | undefined;

export function setRuntimeFieldSelection(fields?: string[]): void {
  runtimeFieldSelection = fields && fields.length > 0 ? fields : undefined;
}

export function getRuntimeFieldSelection(): string[] | undefined {
  return runtimeFieldSelection;
}
