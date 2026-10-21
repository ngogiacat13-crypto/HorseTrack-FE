import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../Icon';

export const BackButton: React.FC<{ fallback: string; children?: React.ReactNode }> = ({ fallback, children = 'Quay lại' }) => {
  const navigate = useNavigate();
  const canGoBack = ((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0;
  return (
    <button type="button" className="ht-back" data-testid="back-btn" onClick={() => (canGoBack ? navigate(-1) : navigate(fallback, { replace: true }))}>
      <Icon name="back" size={14} />{children}
    </button>
  );
};
