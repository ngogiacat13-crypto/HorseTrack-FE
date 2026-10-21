import React, { useCallback, useRef, useState } from 'react';
import { Icon } from '../Icon';
import { ToastCtx } from './toastContext';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number>();
  const show = useCallback((m: string) => {
    setMsg(m);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg && <div className="ht-toast" role="status" data-testid="toast"><Icon name="check" /><span>{msg}</span></div>}
    </ToastCtx.Provider>
  );
};
