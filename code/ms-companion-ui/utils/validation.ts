

export const AuthLimits = {
  emailMax: 256,
  passwordMin: 8,
  passwordMax: 128,
  nameMax: 100,
} as const;

export type Validator = (value: string) => string | undefined;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail: Validator = (value) => {
  const email = value.trim();
  if (!email) {
    return 'Enter your email address.';
  }
  if (email.length > AuthLimits.emailMax || !EMAIL_PATTERN.test(email)) {
    return 'Enter a valid email address, like name@example.com.';
  }
  return undefined;
};

export const validateLoginPassword: Validator = (value) =>
  value ? undefined : 'Enter your password.';

export const validateNewPassword: Validator = (value) => {
  if (!value) {
    return 'Create a password.';
  }
  if (value.length < AuthLimits.passwordMin) {
    return `Use at least ${AuthLimits.passwordMin} characters.`;
  }
  if (value.length > AuthLimits.passwordMax) {
    return `Use ${AuthLimits.passwordMax} characters or fewer.`;
  }
  return undefined;
};


export function validateName(label: string): Validator {
  return (value) => {
    const name = value.trim();
    if (!name) {
      return `Enter your ${label}.`;
    }
    if (name.length > AuthLimits.nameMax) {
      return `Use ${AuthLimits.nameMax} characters or fewer.`;
    }
    return undefined;
  };
}

// ---------- MS team phone number (profile, check-in, relapse log) ----------

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
