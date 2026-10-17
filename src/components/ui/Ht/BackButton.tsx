import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../Icon';

/* ---------- Back button ----------
   navigate(-1) returns to the page the user actually came from (a page reached from several places).
   Opened directly from a link or a new tab, there is nothing to go back to → go to `fallback` instead.
   React Router stores the position in history as `idx` (0 = first page of this tab). */
export const BackButton: React.FC<{ fallback: string; children?: React.ReactNode }> = ({ fallback, children = 'Quay lại' }) => {
  const navigate = useNavigate();
  const canGoBack = ((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0;
  return (
    <button type="button" className="ht-back" onClick={() => (canGoBack ? navigate(-1) : navigate(fallback, { replace: true }))}>
      <Icon name="back" size={14} />{children}
    </button>
  );
};
