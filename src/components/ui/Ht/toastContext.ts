import { createContext, useContext } from 'react';

export const ToastCtx = createContext<(msg: string) => void>(() => {});
/** Show a short confirmation message at the bottom of the screen. */
export const useToast = () => useContext(ToastCtx);
