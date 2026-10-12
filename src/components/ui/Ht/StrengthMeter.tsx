import React from 'react';
import { scorePassword } from './password';

const STRENGTH = ['Tối thiểu 8 ký tự; nên có chữ hoa, số và ký tự đặc biệt.', 'Độ mạnh: Yếu', 'Độ mạnh: Trung bình', 'Độ mạnh: Khá', 'Độ mạnh: Mạnh'];
export const StrengthMeter: React.FC<{ value: string; showLabel?: boolean }> = ({ value, showLabel = true }) => {
  const level = scorePassword(value);
  return (
    <>
      <div className="ht-strength" data-level={level} aria-hidden="true"><span /><span /><span /><span /></div>
      {showLabel && <span className="ht-strength-label">{STRENGTH[level]}</span>}
    </>
  );
};
