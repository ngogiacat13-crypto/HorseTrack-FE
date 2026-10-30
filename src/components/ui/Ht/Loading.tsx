import React from 'react';

const BODY = [
  '................ee..',
  '...............eeee.',
  '..............mbbbbb',
  '.............mbbwbbb',
  '............mmbbbbbb',
  '...........mmbbb....',
  '..m.......mmbbb.....',
  '.mm..bbbbbbbbbb.....',
  'mm..bbbbbbbbbbb.....',
  'm...bbbbbbbbbbb.....',
  '....bbbbbbbbbb......',
];
const LEGS_STRIDE = [
  '....bb......bb......',
  '...bb........bb.....',
  '..bb..........bb....',
  '..h............h....',
];
const LEGS_GATHER = [
  '.....bb....bb.......',
  '.....bb....bb.......',
  '.....bb....bb.......',
  '.....h.....h........',
];
const PIXEL_CLASS: Record<string, string> = { b: 'ht-horse__body', m: 'ht-horse__mane', e: 'ht-horse__ear', w: 'ht-horse__eye', h: 'ht-horse__hoof' };

const pixels = (rows: string[], top: number) => rows.flatMap((row, y) => [...row].flatMap((cell, x) => (
  PIXEL_CLASS[cell] ? [<rect key={`${x}-${y + top}`} x={x} y={y + top} width={1} height={1} className={PIXEL_CLASS[cell]} />] : []
)));

export const Loading: React.FC<{ label?: string }> = ({ label = 'Đang Tải...' }) => (
  <div className="ht-loading" role="status" data-testid="loading">
    <svg className="ht-horse" viewBox="0 0 20 15" aria-hidden="true">
      <g className="ht-horse__frame">{pixels(BODY, 0)}</g>
      <g className="ht-horse__legs ht-horse__legs--stride">{pixels(LEGS_STRIDE, 11)}</g>
      <g className="ht-horse__legs ht-horse__legs--gather">{pixels(LEGS_GATHER, 11)}</g>
    </svg>
    <span className="ht-loading__text">{label}</span>
  </div>
);
