import React from 'react';
import { Icon } from '../Icon';
import { useToast } from './toastContext';

/** Copy text to the clipboard; falls back to a hidden textarea when the Clipboard API is unavailable. */
const copy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
};

/* ---------- Plain text + small copy button ---------- */
export const CopyText: React.FC<{ text: string; label?: string; mono?: boolean }> = ({ text, label = 'mã', mono = true }) => {
  const toast = useToast();
  return (
    <span className="ht-copy">
      <span className={mono ? 'ht-mono' : undefined}>{text}</span>
      <button type="button" className="ht-copy__btn" title={`Sao chép ${label}`} aria-label={`Sao chép ${label} ${text}`}
        onClick={async () => { await copy(text); toast(`Đã sao chép ${label} ${text}`); }}>
        <Icon name="copy" size={14} />
      </button>
    </span>
  );
};
