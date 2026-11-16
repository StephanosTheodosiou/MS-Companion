

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
