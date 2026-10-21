import React, { useEffect, useRef } from 'react';
import { useField, useFormikContext } from 'formik';
import { Field, PasswordInput, TextInput } from '../ui/Ht';
import type { IconName } from '../ui/Icon';

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'value' | 'onChange' | 'onBlur'> & {
  icon?: IconName;
  revealed?: boolean;
  onRevealChange?: (v: boolean) => void;
};

type FormikFieldProps = InputProps & {
  name: string;
  label: React.ReactNode;
  password?: boolean;
  required?: boolean;
  hint?: React.ReactNode;
  aside?: React.ReactNode;
  fieldStyle?: React.CSSProperties;
  children?: React.ReactNode;
};

export const FormikField: React.FC<FormikFieldProps> = ({ name, label, password, required, hint, aside, fieldStyle, children, revealed, onRevealChange, ...input }) => {
  const [field, meta] = useField<string>(name);
  const { submitCount } = useFormikContext();
  const error = meta.touched && (meta.value || submitCount > 0) ? meta.error : undefined;
  const common = { 'data-testid': `${name}-input`, ...field, ...input, id: name, invalid: !!error };

  return (
    <Field label={label} htmlFor={name} required={required} error={error} hint={hint} aside={aside} style={fieldStyle}>
      {password ? <PasswordInput {...common} revealed={revealed} onRevealChange={onRevealChange} /> : <TextInput {...common} />}
      {children}
    </Field>
  );
};

export const FocusFirstError: React.FC = () => {
  const { submitCount, isValidating, errors } = useFormikContext<Record<string, string>>();
  const handled = useRef(0);
  useEffect(() => {
    if (submitCount === handled.current || isValidating) return;
    handled.current = submitCount;
    const first = Object.keys(errors)[0];
    if (first) document.getElementById(first)?.focus();
  }, [submitCount, isValidating, errors]);
  return null;
};
