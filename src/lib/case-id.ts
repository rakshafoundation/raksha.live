/** Formats a numeric sequence into the public case ID, e.g. RN-10291. */
export function formatCaseNumber(sequence: number): string {
  return `RN-${String(sequence).padStart(5, '0')}`;
}
