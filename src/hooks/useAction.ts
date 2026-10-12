import { useCallback, useState } from 'react';
import type { ApiError } from '../api/http';
import { useToast } from '../components/ui/Ht';

/** Runs one API action at a time: tracks busy + error, shows a toast on success, then calls onDone (e.g. reload).
    run() resolves to true on success so the caller can close its dialog. */
export function useAction(onDone?: () => void) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = useCallback(async (fn: () => Promise<unknown>, okMessage?: string) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      if (okMessage) toast(okMessage);
      onDone?.();
      return true;
    } catch (e) {
      setError((e as ApiError).message ?? 'Thao tác thất bại.');
      return false;
    } finally {
      setBusy(false);
    }
  }, [toast, onDone]);
  return { busy, error, setError, run };
}
