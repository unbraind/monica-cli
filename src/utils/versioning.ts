export function formatVersionDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1);
  const day = String(date.getDate());
  return `${year}.${month}.${day}`;
}

export function isValidVersionDate(value: string): boolean {
  return /^\d{4}\.(?:[1-9]|1[0-2])\.(?:[1-9]|[12]\d|3[01])$/.test(value);
}

export function toGitDate(versionDate: string): string {
  return versionDate.replace(/\./g, '-');
}

export function buildDateReleaseVersion(versionDate: string, releaseNumber: number): string {
  if (!isValidVersionDate(versionDate)) {
    throw new Error(`Invalid version date "${versionDate}". Expected format: YYYY.M.D`);
  }
  if (!Number.isInteger(releaseNumber) || releaseNumber <= 0) {
    throw new Error(`Invalid release number "${releaseNumber}". Expected a positive integer.`);
  }
  if (releaseNumber === 1) {
    return versionDate;
  }
  return `${versionDate}-${releaseNumber}`;
}

export function parseReleaseCount(rawCount: string): number {
  const parsed = Number.parseInt(rawCount.trim(), 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Unable to parse release count from "${rawCount}"`);
  }
  return parsed;
}
