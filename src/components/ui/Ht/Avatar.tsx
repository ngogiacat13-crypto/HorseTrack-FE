import React from 'react';

const initialsOf = (name: string) => name.trim().split(/\s+/).slice(-2).map((p) => p[0] ?? '').join('').toUpperCase();

export const Avatar: React.FC<{ name: string; src?: string | null; size?: number; muted?: boolean; className?: string }> = ({ name, src, size = 28, muted, className }) => (
  <i className={`ht-avatar${muted ? ' ht-avatar--muted' : ''}${className ? ` ${className}` : ''}`}
    style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.32)) }} aria-hidden={!src || undefined}>
    {src ? <img src={src} alt={`Ảnh đại diện của ${name}`} /> : initialsOf(name)}
  </i>
);
