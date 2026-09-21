export function parseWeightKg(value: string): number | null {
  const trimmed = value.trim().replace(',', '.');
  if (trimmed === '') {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('Weight must be a number in kg.');
  }

  return parsed;
}

export function formatWeightKg(value: number | null): string {
  if (value === null) {
    return '';
  }

  return String(value);
}

export function nextAnchorNumber(existingNumbers: string[]): string {
  const numeric = existingNumbers
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value) && value > 0);

  const max = numeric.length > 0 ? Math.max(...numeric) : 0;
  return String(max + 1);
}
