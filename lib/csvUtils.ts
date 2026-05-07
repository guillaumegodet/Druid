/**
 * Escapes a value for RFC 4180-compliant CSV output.
 * Wraps in double quotes only when the value contains commas, quotes, or newlines.
 */
export function csvEscape(value: unknown): string {
  const str = (value ?? '').toString();
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Returns the value if it matches ISO date format (YYYY-MM-DD), otherwise returns an empty string. */
export function isoDateOrEmpty(value: unknown): string {
  const str = (value ?? '') as string;
  return /^\d{4}-\d{2}-\d{2}$/.test(str) ? str : '';
}
