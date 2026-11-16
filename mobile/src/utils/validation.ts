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

/** Returns an error message, or null when the email looks right. */
export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === '') return 'Enter your email address.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Enter an email like name@example.com.';
  return null;
}

export const MIN_PASSWORD_LENGTH = 8;

/** Returns an error message, or null when the password is long enough. */
export function validateNewPassword(value: string): string | null {
  if (value.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  return null;
}
