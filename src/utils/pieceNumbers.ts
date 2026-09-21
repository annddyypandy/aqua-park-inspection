export function formatPieceNumber(value: number): string {
  return String(value).padStart(3, '0');
}

export function nextPieceNumber(existingNumbers: string[]): string {
  const numeric = existingNumbers
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value) && value > 0);

  const max = numeric.length > 0 ? Math.max(...numeric) : 0;
  return formatPieceNumber(max + 1);
}
