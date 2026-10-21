import React from 'react';

export type Column<T> = {
  header: React.ReactNode;
  render: (row: T, index: number) => React.ReactNode;
  align?: 'right';
  className?: string;
  headClassName?: string;
};

type DataTableProps<T> = {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  empty?: React.ReactNode;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;
};

export function DataTable<T>({ rows, columns, rowKey, empty = 'Không có dữ liệu.', onRowClick, rowClassName }: DataTableProps<T>) {
  const alignStyle = (c: Column<T>) => (c.align ? { textAlign: c.align } : undefined);
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="ht-table">
        <thead>
          <tr>{columns.map((c, i) => <th key={i} className={c.headClassName} style={alignStyle(c)}>{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={rowKey(row)} className={rowClassName?.(row)}
              {...(onRowClick && {
                onClick: () => onRowClick(row),
                onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter') onRowClick(row); },
                tabIndex: 0,
                style: { cursor: 'pointer' },
              })}>
              {columns.map((c, i) => <td key={i} className={c.className} style={alignStyle(c)}>{c.render(row, r)}</td>)}
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={columns.length} className="ht-empty">{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
