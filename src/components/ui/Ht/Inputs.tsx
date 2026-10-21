import React, { useState } from 'react';
import { Icon, IconName } from '../Icon';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { icon?: IconName; invalid?: boolean };
export const TextInput = React.forwardRef<HTMLInputElement, InputProps>(({ icon, invalid, className, id, ...rest }, ref) => (
  <div className="ht-control">
    {icon && <Icon name={icon} />}
    <input
      ref={ref}
      id={id}
      className={`ht-input${className ? ' ' + className : ''}`}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && id ? id + '-err' : undefined}
      {...rest}
    />
  </div>
));
TextInput.displayName = 'TextInput';

type PasswordProps = Omit<InputProps, 'type'> & { revealed?: boolean; onRevealChange?: (v: boolean) => void };
export const PasswordInput: React.FC<PasswordProps> = ({ icon = 'lock', invalid, id, revealed, onRevealChange, ...rest }) => {
  const [own, setOwn] = useState(false);
  const show = revealed ?? own;
  const toggle = () => (onRevealChange ? onRevealChange(!show) : setOwn(!show));
  return (
    <div className="ht-control">
      <Icon name={icon} />
      <input
        id={id}
        type={show ? 'text' : 'password'}
        className="ht-input ht-input--trail"
        aria-invalid={invalid || undefined}
        aria-describedby={invalid && id ? id + '-err' : undefined}
        {...rest}
      />
      <button type="button" className="ht-iconbtn" onClick={toggle} aria-pressed={show} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
        <Icon name={show ? 'eyeoff' : 'eye'} />
      </button>
    </div>
  );
};
