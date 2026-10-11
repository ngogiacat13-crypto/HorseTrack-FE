import { useState, type ChangeEvent } from 'react';

/* Minimal form state: values, touched, errors. Replaces Formik + Yup for the auth pages.
   validate() returns { field: 'message' } for every invalid field (same messages as the old Yup schemas). */
export type Errors<T> = Partial<Record<keyof T, string>>;

export function useForm<T extends Record<string, string>>(initial: T, validate: (v: T) => Errors<T>) {
  const [values, setValues] = useState<T>(initial);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<Errors<T>>({});
  const [submitting, setSubmitting] = useState(false);

  const all = validate(values);
  const errors: Errors<T> = {};
  (Object.keys(values) as (keyof T)[]).forEach((k) => {
    const e = serverErrors[k] || (touched[k] ? all[k] : undefined);
    if (e) errors[k] = e;
  });

  const field = (name: keyof T) => ({
    name: name as string,
    id: name as string,
    value: values[name],
    invalid: !!errors[name],
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setValues((s) => ({ ...s, [name]: v }));
      if (serverErrors[name]) setServerErrors((s) => ({ ...s, [name]: undefined }));
    },
    onBlur: () => { if (values[name]) setTouched((t) => ({ ...t, [name]: true })); },
  });

  /** Marks every field touched; returns true when the form is valid. */
  const check = () => {
    const t: Partial<Record<keyof T, boolean>> = {};
    (Object.keys(values) as (keyof T)[]).forEach((k) => (t[k] = true));
    setTouched(t);
    const errs = validate(values);
    const first = (Object.keys(values) as (keyof T)[]).find((k) => errs[k]);
    if (first) document.getElementById(first as string)?.focus();
    return !first;
  };

  const reset = (v: T = initial) => { setValues(v); setTouched({}); setServerErrors({}); };

  return { values, setValues, errors, field, check, reset, submitting, setSubmitting, setServerErrors };
}
