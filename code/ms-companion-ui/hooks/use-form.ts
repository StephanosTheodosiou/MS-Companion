import { useState } from 'react';

type FormValues = Record<string, string>;
type FieldMessages<T> = Partial<Record<keyof T, string>>;

export type FormValidators<T extends FormValues> = {
  [K in keyof T]?: (value: string, values: T) => string | undefined;
};

export function useForm<T extends FormValues>(initialValues: T, validators: FormValidators<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FieldMessages<T>>({});
  const [visited, setVisited] = useState<Partial<Record<keyof T, boolean>>>({});

  const validateField = (field: keyof T, current: T) =>
    validators[field]?.(current[field], current);
  const fields = Object.keys(initialValues) as (keyof T)[];

  function setValue(field: keyof T, value: string) {
    const next = { ...values, [field]: value } as T;
    setValues(next);
    if (visited[field]) {
      setErrors((previous) => ({ ...previous, [field]: validateField(field, next) }));
    }
  }

  function handleBlur(field: keyof T) {
    if (!values[field]) {
      return;
    }
    setVisited((previous) => ({ ...previous, [field]: true }));
    setErrors((previous) => ({ ...previous, [field]: validateField(field, values) }));
  }

  function validateAll(): boolean {
    const nextErrors: FieldMessages<T> = {};
    for (const field of fields) {
      nextErrors[field] = validateField(field, values);
    }
    setErrors(nextErrors);
    setVisited(
      Object.fromEntries(fields.map((field) => [field, true])) as Record<keyof T, boolean>,
    );
    return fields.every((field) => !nextErrors[field]);
  }

  function setFieldErrors(serverErrors: Record<string, string>) {
    const known = fields.filter((field) => serverErrors[field as string]);
    setErrors((previous) => ({
      ...previous,
      ...Object.fromEntries(known.map((field) => [field, serverErrors[field as string]])),
    }));
    setVisited((previous) => ({
      ...previous,
      ...Object.fromEntries(known.map((field) => [field, true])),
    }));
    return known.length > 0;
  }

  return { values, errors, setValue, handleBlur, validateAll, setFieldErrors };
}
