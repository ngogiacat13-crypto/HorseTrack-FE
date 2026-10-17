import React, { useEffect, useRef } from 'react';
import { useField, useFormikContext } from 'formik';
import { Field, PasswordInput, TextInput } from '../ui/Ht';
import type { IconName } from '../ui/Icon';

/* Formik + the HorseTrack UI kit: label + input + error in one line.
   useField(name) gives the value/onChange/onBlur (field) and touched/error (meta) of one form field.

   <FormikField name="oldPassword" label="Mật khẩu hiện tại" password required />

   An error shows once the field was left with something typed in it, or after the first submit —
   so tabbing through an empty form does not paint every field red. */
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
  /** extra content under the input, e.g. a strength meter */
  children?: React.ReactNode;
};

export const FormikField: React.FC<FormikFieldProps> = ({ name, label, password, required, hint, aside, fieldStyle, children, revealed, onRevealChange, ...input }) => {
  const [field, meta] = useField<string>(name);
  const { submitCount } = useFormikContext();
  const error = meta.touched && (meta.value || submitCount > 0) ? meta.error : undefined;
  const common = { ...field, ...input, id: name, invalid: !!error };

  return (
    <Field label={label} htmlFor={name} required={required} error={error} hint={hint} aside={aside} style={fieldStyle}>
      {password ? <PasswordInput {...common} revealed={revealed} onRevealChange={onRevealChange} /> : <TextInput {...common} />}
      {children}
    </Field>
  );
};

/** Put inside a Formik form: after a submit with errors, move focus to the first invalid field. */
export const FocusFirstError: React.FC = () => {
  const { submitCount, isValidating, errors } = useFormikContext<Record<string, string>>();
  const handled = useRef(0);
  useEffect(() => {
    // Formik validates after counting the submit: wait until it is done, and act once per submit.
    if (submitCount === handled.current || isValidating) return;
    handled.current = submitCount;
    const first = Object.keys(errors)[0];
    if (first) document.getElementById(first)?.focus();
  }, [submitCount, isValidating, errors]);
  return null;
};
