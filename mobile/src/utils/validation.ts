// Pure functions are easy to unit test later.

/** Returns an error message, or null when the phone number is acceptable (empty is allowed). */
export function validatePhone(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  if (!/^[+\d][\d\s()-]*$/.test(trimmed)) {
    return 'Use only numbers, spaces, + ( ) and -.';
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 6 || digits.length > 15) {
    return 'The number should have between 6 and 15 digits.';
  }
  return null;
}

/** Keeps only what a phone dialer needs, for use in a tel: link. */
export function toDialNumber(value: string): string {
  return value.replace(/[^\d+]/g, '');
}
