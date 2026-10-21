import React, { createContext, useContext, useId, useState } from 'react';

function TabsBar<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: string; count?: number }[] }) {
  return (
    <div className="ht-tabs" role="tablist">
      {items.map((it) => (
        <button key={it.value} type="button" role="tab" className="ht-tab" aria-selected={it.value === value} onClick={() => onChange(it.value)}>
          {it.label}{it.count !== undefined && <span className="ht-tab__n">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}

type TabsCtx = { value: string; select: (v: string) => void; baseId: string };
const TabsContext = createContext<TabsCtx | null>(null);

function useTabs(part: string) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error(`<Tabs.${part}> phải nằm trong <Tabs.Group>.`);
  return ctx;
}

type GroupProps = { children: React.ReactNode } & (
  | { defaultValue: string; value?: undefined; onChange?: (v: string) => void }
  | { value: string; onChange: (v: string) => void; defaultValue?: undefined }
);

function Group({ defaultValue, value, onChange, children }: GroupProps) {
  const [own, setOwn] = useState(defaultValue ?? '');
  const baseId = useId();
  const current = value ?? own;
  const select = (v: string) => {
    if (value === undefined) setOwn(v);
    onChange?.(v);
  };
  return <TabsContext.Provider value={{ value: current, select, baseId }}>{children}</TabsContext.Provider>;
}

function List({ children, label }: { children: React.ReactNode; label?: string }) {
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const tabs = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const i = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    next.focus();
    next.click();
  };
  return <div className="ht-tabs" role="tablist" aria-label={label} onKeyDown={onKeyDown}>{children}</div>;
}

function Tab({ value, count, children }: { value: string; count?: number; children: React.ReactNode }) {
  const { value: current, select, baseId } = useTabs('Tab');
  const active = value === current;
  return (
    <button type="button" role="tab" className="ht-tab" id={`${baseId}-tab-${value}`} aria-controls={`${baseId}-panel-${value}`}
      aria-selected={active} tabIndex={active ? 0 : -1} onClick={() => select(value)}>
      {children}{count !== undefined && <span className="ht-tab__n">{count}</span>}
    </button>
  );
}

function Panel({ value, children }: { value: string; children: React.ReactNode }) {
  const { value: current, baseId } = useTabs('Panel');
  if (value !== current) return null;
  return <div role="tabpanel" id={`${baseId}-panel-${value}`} aria-labelledby={`${baseId}-tab-${value}`}>{children}</div>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const Tabs = Object.assign(TabsBar, { Group, List, Tab, Panel });

export function Segmented<T extends string>({ value, onChange, items, label }: { value: T; onChange: (v: T) => void; items: { value: T; label: string }[]; label: string }) {
  return (
    <div className="ht-seg" role="group" aria-label={label}>
      {items.map((it) => (
        <button key={it.value} type="button" aria-pressed={it.value === value} onClick={() => onChange(it.value)}>{it.label}</button>
      ))}
    </div>
  );
}
